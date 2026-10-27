const HttpError = require("../utils/httpError");

// Se ejecuta cuando ninguna ruta respondió
const notFound = (req, res, next) => {
  next(new HttpError(404, `Ruta no encontrada: ${req.method} ${req.originalUrl}`));
};

module.exports = notFound;
