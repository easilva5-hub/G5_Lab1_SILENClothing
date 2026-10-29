const {Router}=require("express");
const c=require("../controllers/prenda.controller");
const {authenticateToken,requireRole}=require("../middlewares/auth");
const router=Router();const admin=[authenticateToken,requireRole("ADMIN")];
router.get("/",c.list);router.get("/:id",c.getById);
router.post("/",admin,c.create);router.post("/lote",admin,c.createMany);
router.put("/:id",admin,c.update);router.delete("/:id",admin,c.remove);
module.exports=router;
