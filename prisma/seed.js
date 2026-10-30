require("dotenv").config();
const prisma = require("../src/db/prisma");
async function main() {
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
  console.log(`Relaciones N:M verificadas para ${prendas.length} prendas.`);
}
main().catch(e => { console.error(e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
