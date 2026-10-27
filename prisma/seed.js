// Carga datos de prueba sin tocar la base a mano:  npx prisma db seed
// Es IDEMPOTENTE: se puede ejecutar las veces que se quiera; siempre deja los mismos datos
// (borra primero con deleteMany(), así no se duplican claves @unique ni falla).
require("dotenv").config();
const prisma = require("../src/db/prisma"); // el mismo cliente (con adaptador pg) que usa la API

const categorias = [
  { nombre: "Camisetas", descripcion: "Camisetas urbanas y oversize" },
  { nombre: "Sudaderas", descripcion: "Hoodies y buzos" },
  { nombre: "Pantalones", descripcion: "Cargo, jogger y jeans" },
  { nombre: "Accesorios", descripcion: "Gorras, mochilas y complementos", activa: false },
];

// Los 4 registros del Lab 1 (data/prendas.json) + 2 nuevos.
// «Camiseta Oversize» es el nombre @unique que usa Postman para probar el 409.
const prendas = [
  { nombre: "Camiseta Oversize", precio: 25.5, stock: 20, talla: "M", categoria: "Camisetas" },
  { nombre: "Hoodie Negro", precio: 45, stock: 15, talla: "L", categoria: "Sudaderas" },
  { nombre: "Pantalon Cargo", precio: 38, stock: 12, talla: "M", categoria: "Pantalones" },
  { nombre: "Camiseta Oversize Blanca", precio: 30, stock: 15, talla: "M", categoria: "Camisetas" },
  { nombre: "Hoodie Gris Basico", precio: 42, stock: 8, talla: "S", categoria: "Sudaderas" },
  { nombre: "Gorra Snapback SILEN", precio: 18, stock: 30, categoria: "Accesorios" }, // talla opcional (null)
];

async function main() {
  await prisma.$transaction(async (tx) => {
    // 1. Limpia las tablas (en el Lab 3, en orden inverso a las relaciones)
    await tx.prenda.deleteMany();
    await tx.categoria.deleteMany();

    // 2. Reinicia los contadores autoincrement para que los ids vuelvan a ser 1, 2, 3…
    //    (deleteMany borra filas, pero no reinicia la secuencia de PostgreSQL)
    await tx.$executeRaw`ALTER SEQUENCE categorias_id_seq RESTART WITH 1`;
    await tx.$executeRaw`ALTER SEQUENCE prendas_id_seq RESTART WITH 1`;

    // 3. Inserta los datos de prueba
    await tx.categoria.createMany({ data: categorias });
    await tx.prenda.createMany({ data: prendas });
  });

  // 4. Muestra cuántos registros quedaron
  const [totalPrendas, totalCategorias] = await Promise.all([prisma.prenda.count(), prisma.categoria.count()]);
  console.log(`Seed completado: ${totalPrendas} prendas y ${totalCategorias} categorías.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
