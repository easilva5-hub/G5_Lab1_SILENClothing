const service = require("../services/category.service");
const HttpError = require("../utils/httpError");

const idFromParams = (req) => {
  if (!/^[1-9]\d*$/.test(req.params.id) || !Number.isSafeInteger(Number(req.params.id))) {
    throw new HttpError(400, "id debe ser un entero positivo");
  }
  return Number(req.params.id);
};
const handle = (fn) => async (req, res, next) => {
  try { await fn(req, res); } catch (error) { next(error); }
};
const create = handle(async (req, res) => {
  res.status(201).json(await service.create(req.body));
});
const list = handle(async (req, res) => {
  res.json(await service.list());
});
const replaceProductCategories = handle(async (req, res) => {
  res.json(await service.replaceProductCategories(idFromParams(req), req.body?.categoryIds));
});
const search = handle(async (req, res) => {
  res.json(await service.search(req.query));
});
const productsByCategory = handle(async (req, res) => {
  res.json(await service.productsByCategory(idFromParams(req), req.query));
});
module.exports = { create, list, replaceProductCategories, search, productsByCategory };
