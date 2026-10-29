const prisma = require("../db/prisma");
const HttpError = require("../utils/httpError");

// SERVICIO (Lab 2): misma interfaz pública que en el Lab 1 (list, getById, create, update, remove),
// pero ahora persiste en PostgreSQL con Prisma. El modelo ya no es un archivo .js:
// es el `model Prenda` de prisma/schema.prisma. Controlador y rutas no cambian.
//
// Errores:
//  · Reglas de negocio → HttpError(400) lanzado aquí.
//  · Id inexistente    → HttpError(404) en getById; en update/remove lo lanza Prisma (P2025).
//  · Nombre repetido   → Prisma lanza P2002 (@unique). errorHandler lo traduce a 404 / 409.

const FIELDS = ["nombre", "precio", "stock", "talla", "categoria"];

const isPlainObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

// Devuelve un mensaje de error o null si los datos son válidos.
// partial = true en PUT: valida solo los campos que llegan.
// Prisma valida tipos; las reglas de negocio (precio > 0, largo del nombre…) se validan aquí.
const validate = (data, { partial = false } = {}) => {
  if (!isPlainObject(data)) return "El cuerpo debe ser un objeto JSON";

  if (!partial || data.nombre !== undefined) {
    if (typeof data.nombre !== "string" || data.nombre.trim().length < 3)
      return "El nombre debe tener al menos 3 caracteres";
    if (data.nombre.trim().length > 80) return "El nombre no puede superar 80 caracteres";
  }

  if (!partial || data.precio !== undefined) {
    if (typeof data.precio !== "number" || !Number.isFinite(data.precio) || data.precio <= 0)
      return "El precio debe ser mayor que 0";
  }

  // Campos opcionales: si llegan, deben cumplir el tipo y el largo de la columna
  if (data.stock !== undefined && (!Number.isInteger(data.stock) || data.stock < 0))
    return "El stock debe ser un entero mayor o igual a 0";

  if (data.talla != null && (typeof data.talla !== "string" || data.talla.length > 10))
    return "La talla debe ser un texto de máximo 10 caracteres";

  if (data.categoria != null && (typeof data.categoria !== "string" || data.categoria.length > 40))
    return "La categoría debe ser un texto de máximo 40 caracteres";

  return null;
};

// Copia solo los campos permitidos (evita que guarden propiedades extrañas como id o createdAt)
const pick = (data) => {
  const clean = Object.fromEntries(FIELDS.filter((k) => data[k] !== undefined).map((k) => [k, data[k]]));
  if (typeof clean.nombre === "string") clean.nombre = clean.nombre.trim();
  return clean;
};

const list = () => prisma.prenda.findMany({ orderBy: { id: "asc" } });

const getById = async (id) => {
  const item = await prisma.prenda.findUnique({ where: { id } });
  if (!item) throw new HttpError(404, "Prenda no encontrada");
  return item;
};

// Valida (400) y crea. Si el nombre ya existe, Prisma lanza P2002 → errorHandler responde 409.
const create = async (data) => {
  const error = validate(data);
  if (error) throw new HttpError(400, error);
  return prisma.prenda.create({ data: pick(data) });
};

// Valida con { partial: true } (400) y actualiza. Si el id no existe, Prisma lanza P2025 → 404.
const update = async (id, data) => {
  const error = validate(data, { partial: true });
  if (error) throw new HttpError(400, error);
  return prisma.prenda.update({ where: { id }, data: pick(data) });
};

// Elimina por id. Si no existe, Prisma lanza P2025 → errorHandler responde 404.
const remove = async (id) => {
  await prisma.prenda.delete({ where: { id } });
};

// TRANSACCIÓN ATÓMICA: crea todas las prendas del lote o ninguna.
// Dentro del callback se usa `tx` (NO `prisma`): solo las operaciones hechas con tx forman parte
// de la transacción. Si algo lanza un error (validación o @unique), Prisma hace ROLLBACK
// automático de lo ya insertado; si el callback termina bien, hace COMMIT.
const createMany = (items) =>
  prisma.$transaction(
    async (tx) => {
      const creadas = [];
      for (const [i, item] of items.entries()) {
        const error = validate(item);
        if (error) throw new HttpError(400, `Ítem ${i + 1}: ${error}`);

        try {
          creadas.push(await tx.prenda.create({ data: pick(item) }));
        } catch (err) {
          // Nombre repetido (en la BD o dentro del mismo lote): se informa qué ítem falló
          if (err?.code === "P2002") {
            throw new HttpError(409, `Ítem ${i + 1}: ya existe una prenda con el nombre "${pick(item).nombre}"`);
          }
          throw err;
        }
      }
      return creadas;
    },
    { timeout: 15000 } // por defecto Prisma cancela transacciones de más de 5 s
  );

module.exports = { list, getById, create, update, remove, createMany };
