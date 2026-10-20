
 // Manejador de errores: 4 parámetros. Responde siempre en JSON.
const errorHandler = (err, req, res, next) => {
  let status = err.status || err.statusCode || 500;
  // TODO Paso 3:
  //  a) Si el body trae JSON mal formado (err.type === "entity.parse.failed") responde 400.
  //  b) Si status es 500, responde "Error interno del servidor" y agrega err.stack
  //     solo cuando process.env.NODE_ENV !== "production".

  if (err.type === "entity.parse.failed") {
    status = 400;
  }

  const message = status === 500
    ? "Error interno del servidor"
    : err.message;

  const response = { error: message };

  if (status === 500 && process.env.NODE_ENV !== "production") {
    response.stack = err.stack;
  }

  res.status(status).json(response);
};

module.exports = errorHandler;
