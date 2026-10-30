const prisma = require("../db/prisma");
const HttpError = require("../utils/httpError");

const valid = ["PENDING", "CONFIRMED", "DELIVERED", "CANCELLED"];

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

    for (const [k, v] of [["gte", from], ["lte", to]]) {
      if (v !== undefined) {
        const d = new Date(v);
        if (Number.isNaN(d.getTime()))
          throw new HttpError(400, "Fecha inválida");
        where.createdAt[k] = d;
      }
    }
  }

  if (where.createdAt?.gte && where.createdAt?.lte &&
      where.createdAt.gte > where.createdAt.lte)
    throw new HttpError(400, "from no puede superar to");

  const p = num(page, 1);
  const l = num(limit, 10, 50);

  const [total, data] = await prisma.$transaction([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      include: {
        customer: {
          select: { id: true, fullName: true, email: true }
        },
        items: {
          include: {
            prenda: {
              select: { id: true, nombre: true }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" },
      skip: (p - 1) * l,
      take: l
    })
  ]);

  return { page: p, limit: l, total, pages: Math.ceil(total / l), data };
};

// Tarjeta C: cambiar el estado, validar transiciones y guardar el historial
const updateOrderStatus = async (id, status, changedById, note) => {
  if (status === undefined)
    throw new HttpError(400, "Envía status");

  statusOf(status);

  if (status === "PENDING")
    throw new HttpError(409, "No se puede regresar a PENDING");

  if (note !== undefined && note !== null &&
      (typeof note !== "string" || note.length > 200))
    throw new HttpError(400, "La nota debe ser un texto de máximo 200 caracteres");

  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!order)
      throw new HttpError(404, "Pedido no encontrado");

    const transitions = {
      PENDING: ["CONFIRMED", "CANCELLED"],
      CONFIRMED: ["DELIVERED", "CANCELLED"],
      DELIVERED: [],
      CANCELLED: []
    };

    if (!transitions[order.status].includes(status))
      throw new HttpError(409, "Transición de estado no permitida");

    // Actualiza únicamente si el estado anterior no cambió
    const updated = await tx.order.updateMany({
      where: { id, status: order.status },
      data: { status }
    });

    if (updated.count === 0)
      throw new HttpError(409, "El pedido cambió de estado");

    // Si se cancela, devuelve las prendas al inventario
    if (status === "CANCELLED") {
      for (const item of order.items) {
        await tx.prenda.update({
          where: { id: item.prendaId },
          data: {
            stock: { increment: item.quantity }
          }
        });
      }
    }

    // Guarda quién hizo el cambio y los estados anterior y nuevo
    await tx.orderStatusHistory.create({
      data: {
        orderId: id,
        fromStatus: order.status,
        toStatus: status,
        changedById,
        note: note ?? null
      }
    });

    return tx.order.findUnique({ where: { id } });
  }, { timeout: 15000 });
};

const topProducts = async (limit) => {
  const take = num(limit, 5, 50);

  const groups = await prisma.orderItem.groupBy({
    by: ["prendaId"],
    _sum: { quantity: true },
    where: {
      order: {
        status: { not: "CANCELLED" }
      }
    },
    orderBy: {
      _sum: { quantity: "desc" }
    },
    take
  });

  const prendas = await prisma.prenda.findMany({
    where: {
      id: { in: groups.map(g => g.prendaId) }
    },
    select: { id: true, nombre: true }
  });

  const names = new Map(prendas.map(p => [p.id, p.nombre]));

  return groups.map(g => ({
    prendaId: g.prendaId,
    nombre: names.get(g.prendaId) || "Prenda eliminada",
    unitsSold: g._sum.quantity || 0
  }));
};

module.exports = { listOrders, updateOrderStatus, topProducts };