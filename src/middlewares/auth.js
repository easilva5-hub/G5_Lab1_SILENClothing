const jwt = require("jsonwebtoken");
const HttpError = require("../utils/httpError");
const authenticateToken = (req, res, next) => {
  const match = /^Bearer\s+(\S+)$/i.exec(req.headers.authorization || "");
  if (!match)
    return next(new HttpError(401, "Acceso denegado: falta el token"));
  try {
    const data = jwt.verify(match[1], process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });
    if (!Number.isInteger(data.id) || !["ADMIN", "USER"].includes(data.role))
      throw Error("payload");
    req.user = data;
    next();
  } catch (e) {
    next(new HttpError(403, "Token inválido o expirado"));
  }
};
const requireRole =
  (...roles) =>
  (req, res, next) =>
    req.user && roles.includes(req.user.role)
      ? next()
      : next(new HttpError(403, "No tienes permisos para esta operación"));
module.exports = { authenticateToken, requireRole };
