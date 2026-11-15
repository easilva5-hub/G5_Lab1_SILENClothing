const resenaPrendaService = require("../services/reseñaPrenda.service");

const createResena = async (req, res, next) => {
  try {
    const doc = await resenaPrendaService.create(req.body);
    return res.status(201).json(doc);
  } catch (error) {
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        message: "Error de validación",
        errors,
      });
    }
    next(error);
  }
};

const getResenas = async (req, res, next) => {
  try {
    const list = await resenaPrendaService.findAll();
    return res.status(200).json(list);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createResena,
  getResenas,
};