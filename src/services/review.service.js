const prisma = require("../db/prisma");
const HttpError = require("../utils/httpError");

// SERVICIO · Tarjeta A (Reseñas de una prenda).

const MAX_COMMENT = 300;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

const isPlainObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

// Solo se expone id y nombre del autor: nunca email ni password
const authorSelect = { id: true, name: true };

// Devuelve un mensaje de error o null si los datos son válidos (→ 400)
const validate = (data) => {
  if (!isPlainObject(data)) return "El cuerpo debe ser un objeto JSON";

  if (!Number.isInteger(data.rating) || data.rating < 1 || data.rating > 5)
    return "El rating debe ser un entero entre 1 y 5";

  if (data.comment !== undefined && data.comment !== null) {
    if (typeof data.comment !== "string") return "El comentario debe ser un texto";
    if (data.comment.trim().length > MAX_COMMENT)
      return `El comentario no puede superar ${MAX_COMMENT} caracteres`;
  }

  return null;
};

// Lanza 404 si la prenda no existe
const ensurePrenda = async (prendaId) => {
  const prenda = await prisma.prenda.findUnique({ where: { id: prendaId }, select: { id: true } });
  if (!prenda) throw new HttpError(404, "Prenda no encontrada");
};

// page/limit llegan como texto en el query string: se sanean (nunca se confía en ellos)
const toPositiveInt = (value, fallback) => {
  const n = Number.parseInt(value, 10);
  return Number.isInteger(n) && n >= 1 ? n : fallback;
};

// POST /api/products/:id/reviews → 201 | 400 | 404 | 409
const create = async (userId, prendaId, data) => {
  await ensurePrenda(prendaId); // 404 antes que validar el cuerpo: el recurso debe existir

  const error = validate(data);
  if (error) throw new HttpError(400, error);

  const existing = await prisma.review.findUnique({
    where: { userId_prendaId: { userId, prendaId } },
    select: { id: true },
  });
  if (existing) throw new HttpError(409, "Ya reseñaste esta prenda");

  const comment = typeof data.comment === "string" && data.comment.trim() !== "" ? data.comment.trim() : null;

  try {
    return await prisma.review.create({
      data: { rating: data.rating, comment, userId, prendaId },
      include: { user: { select: authorSelect } },
    });
  } catch (err) {
    // Carrera: dos peticiones simultáneas pasaron la comprobación; la restricción única decide
    if (err?.code === "P2002") throw new HttpError(409, "Ya reseñaste esta prenda");
    throw err;
  }
};

// GET /api/products/:id/reviews?page&limit → 200 { productId, average, total, page, limit, pages, data } | 404
const listByPrenda = async (prendaId, query = {}) => {
  await ensurePrenda(prendaId);

  const page = toPositiveInt(query.page, 1);
  const limit = Math.min(toPositiveInt(query.limit, DEFAULT_LIMIT), MAX_LIMIT);
  const where = { prendaId };

  // Una sola consulta agregada da el promedio y el total; la otra trae la página pedida
  const [stats, data] = await Promise.all([
    prisma.review.aggregate({ where, _avg: { rating: true }, _count: { _all: true } }),
    prisma.review.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }], // más recientes primero (id desempata)
      skip: (page - 1) * limit,
      take: limit,
      include: { user: { select: authorSelect } },
    }),
  ]);

  const total = stats._count._all;
  const avg = stats._avg.rating;

  return {
    productId: prendaId,
    average: avg === null ? null : Math.round(avg * 100) / 100, // sin reseñas no hay promedio
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
    data,
  };
};

// DELETE /api/reviews/:id → 204 | 403 (no es el autor ni ADMIN) | 404
const remove = async (reviewId, user) => {
  const review = await prisma.review.findUnique({ where: { id: reviewId }, select: { id: true, userId: true } });
  if (!review) throw new HttpError(404, "Reseña no encontrada");

  if (review.userId !== user.id && user.role !== "ADMIN")
    throw new HttpError(403, "Solo el autor o un administrador puede eliminar esta reseña");

  // deleteMany: si otra petición la borró en medio, no lanza P2025 y la operación sigue siendo idempotente
  await prisma.review.deleteMany({ where: { id: reviewId } });
};

module.exports = { create, listByPrenda, remove };
