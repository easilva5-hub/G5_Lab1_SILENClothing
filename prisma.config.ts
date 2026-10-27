// Configuración de Prisma 7 (va en la RAÍZ del proyecto, junto a package.json).
// Desde Prisma 7 la URL de la base y el comando del seed se declaran aquí, no en schema.prisma ni en package.json.
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "node prisma/seed.js",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
