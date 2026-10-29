// SERVER: solo levanta el servidor. La configuración de Express vive en app.js
require("dotenv").config(); // debe ir ANTES de importar la app: db/prisma.js lee DATABASE_URL al cargarse
const app = require("./app");
const prisma = require("./db/prisma");

const PORT = process.env.PORT || 3000;

const start = async () => {
  // Falla rápido si la base no responde, en vez de descubrirlo en la primera petición.
  // Con el adaptador pg, $connect() por sí solo NO abre conexión (es "perezoso"), por eso
  // se hace una consulta real: si DATABASE_URL está mal o PostgreSQL está apagado, falla aquí.
  await prisma.$connect();
  await prisma.$queryRaw`SELECT 1`;
  const server = app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT} · PostgreSQL conectado`);
  });

  // Cierre ordenado: detiene el servidor y libera las conexiones del pool
  const shutdown = (signal) => {
    console.log(`${signal} recibido: cerrando servidor y conexión a la base de datos…`);
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
};

start().catch((err) => {
  console.error("No se pudo conectar a la base de datos:", err.message);
  process.exit(1);
});
