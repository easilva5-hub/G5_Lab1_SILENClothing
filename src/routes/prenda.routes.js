
const { Router } = require("express");
const prendaController = require("../controllers/prenda.controller");

// RUTAS: conectan cada verbo + URL con una acción del controlador
const router = Router();

// ✅ Ya resueltas
router.get("/", prendaController.list);
router.get("/:id", prendaController.getById);

// TODO Paso 2: agrega POST "/" → create, PUT "/:id" → update y DELETE "/:id" → remove
router.post("/", prendaController.create);
router.put("/:id", prendaController.update);
router.delete("/:id", prendaController.remove);

module.exports = router;
