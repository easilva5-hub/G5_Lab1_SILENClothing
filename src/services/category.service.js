const prisma = require("../db/prisma");
const HttpError = require("../utils/httpError");

// Tarjeta B: el modelo existente se llama Categoria (tabla categorias).
// Se conserva la relacion 1:N del Lab 3 y se agrega otra N:M implicita.
const serializeCategory = (c) => ({
  id: c.id,
  name: c.nombre,
  _count: { products: c._count?.prendasEtiquetadas ?? 0 },
});
const serializeProduct = ({ categorias = [], ...p }) => ({
  ...p,
  categories: categorias.map(({ id, nombre }) => ({ id, name: nombre })),
});
const positiveInt = (value, name) => {
  if (!/^[1-9]\d*$/.test(String(value))) throw new HttpError(400, `${name} debe ser un entero positivo`);
  const n = Number(value);
  if (!Number.isSafeInteger(n)) throw new HttpError(400, `${name} fuera de rango`);
  return n;
};
const paging = ({ page = "1", limit = "10" }) => {
  const p = positiveInt(page, "page");
  const l = positiveInt(limit, "limit");
  if (l > 100) throw new HttpError(400, "limit no puede superar 100");
  return { page: p, limit: l, skip: (p - 1) * l };
};

async function create(data = {}) {
  const name = data && typeof data === "object" && !Array.isArray(data) ? data.name : undefined;
  if (typeof name !== "string" || name.trim().length === 0 || name.trim().length > 50) {
    throw new HttpError(400, "name debe ser un texto entre 1 y 50 caracteres");
  }
  const categoria = await prisma.categoria.create({ data: { nombre: name.trim() } });
  return { id: categoria.id, name: categoria.nombre };
}

async function list() {
  const rows = await prisma.categoria.findMany({
    select: { id: true, nombre: true, _count: { select: { prendasEtiquetadas: true } } },
    orderBy: { nombre: "asc" },
  });
  return rows.map(serializeCategory);
}

async function replaceProductCategories(productId, categoryIds) {
  if (!Array.isArray(categoryIds) || !categoryIds.every(Number.isSafeInteger) ||
      categoryIds.some(id => id <= 0) || new Set(categoryIds).size !== categoryIds.length) {
    throw new HttpError(400, "categoryIds debe ser un arreglo sin repetidos de enteros positivos");
  }
  const product = await prisma.prenda.findUnique({ where: { id: productId }, select: { id: true } });
  if (!product) throw new HttpError(404, "Prenda no encontrada");
  if (categoryIds.length > 0) {
    const existing = await prisma.categoria.findMany({
      where: { id: { in: categoryIds } }, select: { id: true },
    });
    if (existing.length !== categoryIds.length) throw new HttpError(404, "Una o más categorías no existen");
  }
  // set sustituye de forma atomica TODAS las asociaciones N:M. [] las borra.
  // La categoria principal (1:N) del Lab 3 NO cambia.
  try {
    const updated = await prisma.prenda.update({
      where: { id: productId },
      data: { categorias: { set: categoryIds.map(id => ({ id })) } },
      include: { categorias: { select: { id: true, nombre: true } } },
    });
    return serializeProduct(updated);
  } catch (e) {
    // Una categoria eliminada entre la comprobacion y el set debe ser 404.
    if (["P2018", "P2025"].includes(e?.code)) throw new HttpError(404, "Prenda o categoría no encontrada");
    throw e;
  }
}

const parseMoney = (value, label) => {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || !/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(value)) {
    throw new HttpError(400, `${label} debe ser un monto no negativo de hasta 2 decimales`);
  }
  const decimal = new (require("@prisma/client").Prisma.Decimal)(value);
  if (decimal.greaterThan("99999999.99")) throw new HttpError(400, `${label} fuera de rango`);
  return decimal;
};
async function search({ q, category, min, max, sort = "name", page, limit } = {}) {
  const { page: p, limit: l, skip } = paging({ page, limit });
  if (!["name", "price_asc", "price_desc"].includes(sort)) {
    throw new HttpError(400, "sort debe ser name, price_asc o price_desc");
  }
  if (q !== undefined && (typeof q !== "string" || q.trim().length > 80)) {
    throw new HttpError(400, "q debe ser un texto de hasta 80 caracteres");
  }
  if (category !== undefined && (typeof category !== "string" || !category.trim() || category.trim().length > 50)) {
    throw new HttpError(400, "category debe ser un nombre de categoría válido");
  }
  const minPrice = parseMoney(min, "min");
  const maxPrice = parseMoney(max, "max");
  if (minPrice && maxPrice && minPrice.greaterThan(maxPrice)) {
    throw new HttpError(400, "min no puede superar max");
  }
  const where = {
    ...(q?.trim() && { nombre: { contains: q.trim(), mode: "insensitive" } }),
    ...(category && { categorias: { some: { nombre: { equals: category.trim(), mode: "insensitive" } } } }),
    ...((minPrice || maxPrice) && { precio: {
      ...(minPrice && { gte: minPrice }), ...(maxPrice && { lte: maxPrice }),
    } }),
  };
  const orderBy = sort === "price_asc" ? [{ precio: "asc" }, { id: "asc" }]
    : sort === "price_desc" ? [{ precio: "desc" }, { id: "asc" }]
    : [{ nombre: "asc" }, { id: "asc" }];
  const [total, results] = await prisma.$transaction([
    prisma.prenda.count({ where }),
    prisma.prenda.findMany({
      where, orderBy, skip, take: l,
      include: { categorias: { select: { id: true, nombre: true } } },
    }),
  ]);
  return { page: p, limit: l, total, pages: Math.ceil(total / l), data: results.map(serializeProduct) };
}

// Reto opcional: productos de una categoría por id, con paginación.
async function productsByCategory(id, query = {}) {
  const { page, limit, skip } = paging(query);
  const category = await prisma.categoria.findUnique({ where: { id }, select: { id: true, nombre: true } });
  if (!category) throw new HttpError(404, "Categoría no encontrada");
  const where = { categorias: { some: { id } } };
  const [total, products] = await prisma.$transaction([
    prisma.prenda.count({ where }),
    prisma.prenda.findMany({
      where, orderBy: [{ nombre: "asc" }, { id: "asc" }], skip, take: limit,
      include: { categorias: { select: { id: true, nombre: true } } },
    }),
  ]);
  return { category: { id: category.id, name: category.nombre }, page, limit,
    total, pages: Math.ceil(total / limit), data: products.map(serializeProduct) };
}

module.exports = { create, list, replaceProductCategories, search, productsByCategory };
