const { Router } = require("express");
const router = Router();
const reviewRoutes = require("./review.routes");
router.use("/prendas", require("./prenda.routes"));
router.use("/auth", require("./auth.routes"));
router.use("/orders", require("./order.routes"));
router.use("/admin", require("./admin.routes"));
// Tarjeta A
router.use("/reviews", reviewRoutes); // DELETE /api/reviews/:id
router.use("/products/:id/reviews", reviewRoutes.byPrenda); // POST/GET /api/products/:id/reviews (contrato)
module.exports = router;
