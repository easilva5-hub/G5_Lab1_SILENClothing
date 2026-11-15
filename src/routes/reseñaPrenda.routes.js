const express = require("express");
const router = express.Router();
const resenaPrendaController = require("../controllers/reseñaPrenda.Controller");

router.post("/", resenaPrendaController.createResena);
router.get("/", resenaPrendaController.getResenas);

module.exports = router;