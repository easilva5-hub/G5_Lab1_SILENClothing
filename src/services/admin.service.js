const prisma = require("../db/prisma");
const HttpError = require("../utils/httpError");
const valid = ["PENDING", "DELIVERED", "CANCELLED"];
const num = (v, def, max) => {
  if (v === undefined) return def;
  const n = Number(v);
  if (!Number.isInteger(n) || n < 1)
    throw new HttpError(400, "page y limit deben ser enteros positivos");
  return max ? Math.min(n, max) : n;
};
const statusOf = (s) => {
  if (!valid.includes(s))
    throw new HttpError(400, `status debe ser: ${valid.join(", ")}`);
  return s;
};
const listOrders = async ({ status, from, to, page, limit } = {}) => {
  const where = {};
  if (status !== undefined) where.status = statusOf(status);
  if (from !== undefined || to !== undefined) {
    where.createdAt = {};
    for (const [k, v] of [
      ["gte", from],
      ["lte", to],
    ])
      if (v !== undefined) {
        const d = new Date(v);
        if (Number.isNaN(d.getTime()))
          throw new HttpError(400, "Fecha inválida");
        where.createdAt[k] = d;
      }
  }
  if (
    where.createdAt?.gte &&
    where.createdAt?.lte &&
    where.createdAt.gte > where.createdAt.lte
  )
    throw new HttpError(400, "from no puede superar to");
  const p = num(page, 1),
    l = num(limit, 10, 50);
  const [total, data] = await prisma.$transaction([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      include: {
        customer: { select: { id: true, fullName: true, email: true } },
        items: { include: { prenda: { select: { id: true, nombre: true } } } },
      },
      orderBy: { createdAt: "desc" },
      skip: (p - 1) * l,
      take: l,
    }),
  ]);
  return { page: p, limit: l, total, pages: Math.ceil(total / l), data };
};
const updateOrderStatus = async (id, status) => {
  if (status === undefined) throw new HttpError(400, "Envía status");
  statusOf(status);
  if (status === "CANCELLED")
    throw new HttpError(
      400,
      "Para cancelar usa PATCH /api/orders/:id/cancel (devuelve stock)",
    );
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id } });
    if (!order) throw new HttpError(404, "Pedido no encontrado");
    if (order.status !== "PENDING")
      throw new HttpError(409, "Solo pueden modificarse pedidos pendientes");
    const result = await tx.order.updateMany({
      where: { id, status: "PENDING" },
      data: { status },
    });
    if (!result.count) throw new HttpError(409, "El pedido cambió de estado");
    return tx.order.findUnique({ where: { id } });
  });
};
const topProducts = async (limit) => {
  const take = num(limit, 5, 50);
  const groups = await prisma.orderItem.groupBy({
    by: ["prendaId"],
    _sum: { quantity: true },
    where: { order: { status: { not: "CANCELLED" } } },
    orderBy: { _sum: { quantity: "desc" } },
    take,
  });
  const prendas = await prisma.prenda.findMany({
    where: { id: { in: groups.map((g) => g.prendaId) } },
    select: { id: true, nombre: true },
  });
  const names = new Map(prendas.map((p) => [p.id, p.nombre]));
  return groups.map((g) => ({
    prendaId: g.prendaId,
    nombre: names.get(g.prendaId) || "Prenda eliminada",
    unitsSold: g._sum.quantity || 0,
  }));
};
module.exports = { listOrders, updateOrderStatus, topProducts };
