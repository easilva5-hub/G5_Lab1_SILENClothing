const { Prisma } = require("@prisma/client");

// Nombres amigables para los mensajes (meta.modelName trae el nombre del model de Prisma)
const NO_ENCONTRADO = { Prenda: "Prenda no encontrada", Categoria: "Categoría no encontrada" };

// Averigua qué campo(s) @unique chocaron. Con el adaptador pg de Prisma 7 el dato viene en
// meta.driverAdapterError; en otras configuraciones, en meta.target.
const camposUnicos = (err) => {
  const target = err.meta?.target;
  if (Array.isArray(target)) return target.join(", ");
  if (typeof target === "string") return target;

  const cause = err.meta?.driverAdapterError?.cause;
  const fields = cause?.constraint?.fields;
  if (Array.isArray(fields) && fields.length) return fields.join(", ");

  // Con el adaptador pg solo llega el nombre del índice: "<tabla>_<campo>_key" (ej. prendas_nombre_key)
  const index = cause?.constraint?.index;
  if (!index) return "campo único";
  const sinTabla = cause.table && index.startsWith(`${cause.table}_`) ? index.slice(cause.table.length + 1) : index;
  return sinTabla.replace(/_key$/, "");
};

// Traduce los errores conocidos de Prisma a { status, message }. Devuelve null si no es de Prisma.
const fromPrisma = (err) => {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002": // violación de @unique (valor duplicado)
        return { status: 409, message: `Ya existe un registro con ese valor único (${camposUnicos(err)})` };
      case "P2025": // update/delete sobre un registro que no existe
        return { status: 404, message: NO_ENCONTRADO[err.meta?.modelName] ?? "Registro no encontrado" };
      case "P2000": // valor demasiado largo para la columna (@db.VarChar)
        return { status: 400, message: "Un valor excede el largo permitido por el campo" };
      case "P2020": // número fuera del rango del tipo (ej. un id mayor que el máximo de INTEGER)
        return { status: 400, message: "Un valor numérico está fuera de rango" };
      default:
        return null;
    }
  }
  // Tipo o formato inválido que Prisma rechaza antes de llegar a la base
  if (err instanceof Prisma.PrismaClientValidationError) {
    return { status: 400, message: "Datos con tipo o formato inválido" };
  }
  return null;
};

// Manejador de errores: 4 parámetros (Express los reconoce así). Responde siempre en JSON.
const errorHandler = (err, req, res, next) => {
  const mapped = fromPrisma(err);

  // Orden de prioridad: error de Prisma → JSON mal formado en el body (400) → HttpError → 500
  let status = mapped?.status ?? err.status ?? err.statusCode ?? 500;
  if (!mapped && err.type === "entity.parse.failed") status = 400;

  const message = status === 500 ? "Error interno del servidor" : mapped?.message ?? err.message;
  const response = { error: message };

  if (status === 500) {
    console.error(err);
    // En desarrollo se muestra el detalle; en producción, nunca
    if (process.env.NODE_ENV !== "production") response.stack = err.stack;
  }

  res.status(status).json(response);
};

module.exports = errorHandler;
