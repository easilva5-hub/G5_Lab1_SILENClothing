require("dotenv").config();
const bcrypt = require("bcryptjs");
const prisma = require("../src/db/prisma");

async function main() {
  // 1. Limpieza de base de datos respetando dependencias de llaves foráneas
  await prisma.orderStatusHistory.deleteMany();
  await prisma.review.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();
  await prisma.prenda.deleteMany();
  await prisma.categoria.deleteMany();

  // 2. Creación de Categorías
  const categories = await Promise.all(
    ["Camisetas", "Sudaderas", "Pantalones", "Accesorios"].map((nombre) =>
      prisma.categoria.create({ data: { nombre } }),
    ),
  );
  const byName = Object.fromEntries(categories.map((c) => [c.nombre, c.id]));

  // 3. Creación de Prendas
  await prisma.prenda.createMany({
    data: [
      {
        nombre: "Camiseta Oversize",
        precio: 25.5,
        stock: 20,
        talla: "M",
        categoria: "Camisetas",
        categoriaId: byName.Camisetas,
      },
      {
        nombre: "Hoodie Negro",
        precio: 45,
        stock: 15,
        talla: "L",
        categoria: "Sudaderas",
        categoriaId: byName.Sudaderas,
      },
      {
        nombre: "Pantalon Cargo",
        precio: 38,
        stock: 12,
        talla: "M",
        categoria: "Pantalones",
        categoriaId: byName.Pantalones,
      },
      {
        nombre: "Camiseta Oversize Blanca",
        precio: 30,
        stock: 15,
        talla: "M",
        categoria: "Camisetas",
        categoriaId: byName.Camisetas,
      },
      {
        nombre: "Hoodie Gris Basico",
        precio: 42,
        stock: 8,
        talla: "S",
        categoria: "Sudaderas",
        categoriaId: byName.Sudaderas,
      },
      {
        nombre: "Gorra Snapback SILEN",
        precio: 18,
        stock: 30,
        categoria: "Accesorios",
        categoriaId: byName.Accesorios,
      },
    ],
  });

  // 4. Creación de Usuarios y Clientes (Admin y Cliente)
  await prisma.user.create({
    data: {
      email: "admin@silen.com",
      name: "Administrador SILEN",
      role: "ADMIN",
      password: await bcrypt.hash("Admin123*", 10),
      customer: {
        create: { email: "admin@silen.com", fullName: "Administrador SILEN" },
      },
    },
  });

  const user = await prisma.user.create({
    data: {
      email: "cliente@silen.com",
      name: "Cliente SILEN",
      password: await bcrypt.hash("Cliente123*", 10),
      customer: {
        create: { email: "cliente@silen.com", fullName: "Cliente SILEN" },
      },
    },
    include: { customer: true },
  });

  // 5. Creación de Pedido de prueba
  const prenda = await prisma.prenda.findUnique({
    where: { nombre: "Camiseta Oversize" },
  });

  await prisma.order.create({
    data: {
      customerId: user.customer.id,
      status: "DELIVERED",
      total: prenda.precio,
      items: {
        create: [
          { prendaId: prenda.id, quantity: 1, unitPrice: prenda.precio },
        ],
      },
    },
  });

  // 6. Verificación y conexión de relaciones N:M (Categorías y Prendas)
  const prendas = await prisma.prenda.findMany({
    where: { categoriaId: { not: null } },
    select: { id: true, categoriaId: true },
  });

  for (const p of prendas) {
    await prisma.prenda.update({
      where: { id: p.id },
      data: { categorias: { connect: [{ id: p.categoriaId }] } },
    });
  }

  console.log("Seed SILEN completado con éxito: 6 prendas, usuarios, pedidos y relaciones N:M.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());