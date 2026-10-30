const { Router } = require("express");
const c = require("../controllers/prenda.controller");
const { authenticateToken, requireRole } = require("../middlewares/auth");
const reviewRoutes = require("./review.routes");

const router = Router();
const admin = [authenticateToken, requireRole("ADMIN")];

router.get("/", c.list);
router.get("/:id", c.getById);

// Tarjeta A: GET/POST /api/prendas/:id/reviews
router.use("/:id/reviews", reviewRoutes.byPrenda); 

router.post("/", admin, c.create);
router.post("/lote", admin, c.createMany);
router.put("/:id", admin, c.update);
router.delete("/:id", admin, c.remove);

module.exports = router;