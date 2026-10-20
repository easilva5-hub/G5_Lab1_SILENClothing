
const Prenda = require("../models/prenda.model");
const HttpError = require("../utils/httpError");

// SERVICIO: reglas de negocio y acceso a datos a través del modelo.
// Lanza HttpError (400, 404) cuando una regla no se cumple. En el Lab 2 este archivo
// usará Prisma; el controlador y las rutas no cambian.

// Devuelve un mensaje de error o null si los datos son válidos.
// partial = true en PUT: valida solo los campos que llegan.
// TODO Paso 1: al menos 2 validaciones de TU entidad.
const validate = (data, { partial = false } = {}) => {
  // Ejemplo: if (typeof data.name !== "string" || data.name.trim().length < 3) return "name ...";

  if (!partial || data.nombre !== undefined) {
    if (typeof data.nombre !== "string" || data.nombre.trim().length < 3)
      return "El nombre debe tener al menos 3 caracteres";
  }

  if (!partial || data.precio !== undefined) {
    if (typeof data.precio !== "number" || data.precio <= 0)
      return "El precio debe ser mayor que 0";
  }

  return null;
};

// ✅ Ya resuelto: úsalo como guía
const list = () => Prenda.readAll();

// ✅ Ya resuelto
const getById = async (id) => {
  const item = (await Prenda.readAll()).find((p) => p.id === id);
  if (!item) throw new HttpError(404, "Prenda no encontrada");
  return item;
};

// TODO Paso 2: valida (400), genera el id (máximo + 1), agrega el registro con Product.pick, guarda y devuélvelo
const create = async (data) => {
  const error = validate(data);
  if (error) throw new HttpError(400, error);

  const items = await Prenda.readAll();

  const id = items.length > 0
    ? Math.max(...items.map((p) => p.id)) + 1
    : 1;

  const nuevaPrenda = { id, ...Prenda.pick(data) };

  items.push(nuevaPrenda);
  await Prenda.writeAll(items);

  return nuevaPrenda;
};

// TODO Paso 2: valida con { partial: true } (400); si el id no existe lanza 404; mezcla los campos, guarda y devuélvelo
const update = async (id, data) => {
  const error = validate(data, { partial: true });
  if (error) throw new HttpError(400, error);

  const items = await Prenda.readAll();

  const index = items.findIndex((p) => p.id === id);
  if (index === -1) throw new HttpError(404, "Prenda no encontrada");

  items[index] = { ...items[index], ...Prenda.pick(data) };

  await Prenda.writeAll(items);

  return items[index];
};

// TODO Paso 2: elimina por id; si no existía lanza 404
const remove = async (id) => {
  const items = await Prenda.readAll();

  const index = items.findIndex((p) => p.id === id);
  if (index === -1) throw new HttpError(404, "Prenda no encontrada");

  items.splice(index, 1);

  await Prenda.writeAll(items);
};

module.exports = { list, getById, create, update, remove };
