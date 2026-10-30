const reviewService = require("../services/review.service");
const HttpError = require("../utils/httpError");

// CONTROLADOR · Tarjeta A (Reseñas). Lee params/body/query, llama al servicio y decide código + JSON.
// Las reglas de negocio viven en review.service.js; los errores van a next(err) → errorHandler.

const MAX_INT = 2147483647; // límite de un INTEGER de PostgreSQL

// Solo acepta enteros positivos completos: parseInt("12abc") daría 12, aquí se rechaza
const parseId = (value, nombre = "id") => {
  if (!/^\d+$/.test(String(value))) throw new HttpError(400, `El ${nombre} debe ser numérico`);
  const id = Number(value);
  if (id < 1 || id > MAX_INT) throw new HttpError(400, `El ${nombre} debe ser numérico`);
  return id;
};

// POST /api/products/:id/reviews → 201 con la reseña creada
const create = async (req, res, next) => {
  try {
    const review = await reviewService.create(req.user.id, parseId(req.params.id), req.body ?? {});
    res.status(201).json(review);
  } catch (err) {
    next(err);
  }
};

// GET /api/products/:id/reviews?page&limit → 200 (público)
const listByPrenda = async (req, res, next) => {
  try {
    res.json(await reviewService.listByPrenda(parseId(req.params.id), req.query));
  } catch (err) {
    next(err);
  }
};

// DELETE /api/reviews/:id → 204 sin cuerpo
const remove = async (req, res, next) => {
  try {
    await reviewService.remove(parseId(req.params.id), req.user);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};

module.exports = { create, listByPrenda, remove };
