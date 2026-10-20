
const { Router } = require("express");
const prendaRoutes = require("./prenda.routes");

// Archivo principal de rutas: cada recurso se monta en su propio prefijo
const router = Router();

router.use("/prendas", prendaRoutes); // → /api/products · TODO Paso 1: cambia /products por tu entidad

module.exports = router;
