const { Router } = require("express");
const b = require("../controllers/category.controller");
const prendas = require("../controllers/prenda.controller");
const { authenticateToken, requireRole } = require("../middlewares/auth");
const router = Router();

// Tarjeta B exige /api/products; es un alias de las mismas prendas del Lab 3.
// IMPORTANTE: /search ANTES de /:id, para no tomar "search" como id.
router.get("/search", b.search);
router.put("/:id/categories", authenticateToken, requireRole("ADMIN"), b.replaceProductCategories);
router.get("/", prendas.list);
router.get("/:id", prendas.getById);
module.exports = router;
