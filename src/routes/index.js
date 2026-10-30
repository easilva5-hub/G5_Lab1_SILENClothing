const { Router } = require("express");
const router = Router();
router.use("/prendas", require("./prenda.routes"));
router.use("/products", require("./product.routes"));
router.use("/categories", require("./category.routes"));
router.use("/auth", require("./auth.routes"));
router.use("/orders", require("./order.routes"));
router.use("/admin", require("./admin.routes"));
module.exports = router;
