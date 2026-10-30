const { Router } = require("express");
const controller = require("../controllers/category.controller");
const { authenticateToken, requireRole } = require("../middlewares/auth");
const router = Router();

router.get("/", controller.list); // público
router.get("/:id/products", controller.productsByCategory); // reto opcional
router.post("/", authenticateToken, requireRole("ADMIN"), controller.create);
module.exports = router;
