const { Router } = require("express");
const reviewController = require("../controllers/review.controller");
const { authenticateToken } = require("../middlewares/auth");

// RUTAS · Tarjeta A . 
const router = Router();
router.delete("/:id", authenticateToken, reviewController.remove);

const byPrenda = Router({ mergeParams: true });
byPrenda.get("/", reviewController.listByPrenda);
byPrenda.post("/", authenticateToken, reviewController.create);

router.byPrenda = byPrenda;
module.exports = router;
