const ResenaPrenda = require("../models/reseñaPrenda.model");

const create = async (data) => {
  return await ResenaPrenda.create(data);
};

const findAll = async () => {
  return await ResenaPrenda.find();
};

module.exports = {
  create,
  findAll,
};