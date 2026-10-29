const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

// Prisma 7: la conexión la hace el driver `pg` a través del adaptador PrismaPg.
// La misma DATABASE_URL se usa en prisma.config.ts (CLI: migrate/seed) y aquí (la app).
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

// Una sola instancia para toda la app (no se crea un PrismaClient por petición).
// Node cachea el módulo, así que todos los require("../db/prisma") comparten este objeto.
const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === "development" ? ["warn"] : ["error"],
});

module.exports = prisma;
