const { Router } = require("express");
const orderController = require("../controllers/order.controller");
const { authenticateToken } = require("../middlewares/auth");

// Todas las rutas de pedidos requieren un usuario autenticado
const router = Router();
router.use(authenticateToken);

router.post("/", orderController.create);
router.get("/", orderController.listMine);
router.patch("/:id/cancel", orderController.cancel);

module.exports = router;
