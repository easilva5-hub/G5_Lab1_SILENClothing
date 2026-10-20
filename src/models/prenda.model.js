const { readFile, writeFile } = require("node:fs/promises");

// MODELO: la forma de los datos (campos) y dónde se guardan (archivo JSON).
// En el Lab 2 este archivo desaparece: el modelo pasa a prisma/schema.prisma.
const FILE = process.env.DATA_FILE || "data/prendas.json";

// TODO Paso 1: renombra product → tu entidad (este archivo, data/*.json y la ruta) y pon sus campos (4 o más)
const FIELDS = ["nombre", "precio", "stock", "talla", "categoria"];

const readAll = async () => JSON.parse(await readFile(FILE, "utf8"));
const writeAll = (items) => writeFile(FILE, JSON.stringify(items, null, 2));

// Copia solo los campos permitidos (evita que guarden propiedades extrañas)
const pick = (data) =>
  Object.fromEntries(FIELDS.filter((k) => data[k] !== undefined).map((k) => [k, data[k]]));

module.exports = { FIELDS, readAll, writeAll, pick };



