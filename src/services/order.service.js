const prisma=require("../db/prisma");const HttpError=require("../utils/httpError");
const orderInclude={items:{include:{prenda:{select:{id:true,nombre:true}}}}};
const customerOf=async(userId)=>{const customer=await prisma.customer.findUnique({where:{userId}});if(!customer)throw new HttpError(403,"El usuario no tiene perfil de cliente");return customer;};
const validateItems=items=>{
 if(!Array.isArray(items)||items.length===0)throw new HttpError(400,"items debe contener al menos una prenda");
 for(const [i,it] of items.entries())if(!it||!Number.isInteger(it.prendaId)||it.prendaId<1||!Number.isInteger(it.quantity)||it.quantity<1)throw new HttpError(400,`Ítem ${i+1}: prendaId y quantity deben ser enteros positivos`);
 if(new Set(items.map(x=>x.prendaId)).size!==items.length)throw new HttpError(400,"No repitas prendas: suma cantidades");
};
const create=async(userId,items)=>{
 validateItems(items);const customer=await customerOf(userId);
 return prisma.$transaction(async tx=>{
  let total=0;const lines=[];
  for(const {prendaId,quantity} of items){
   const prenda=await tx.prenda.findUnique({where:{id:prendaId},select:{id:true,precio:true}});
   if(!prenda)throw new HttpError(404,`Prenda ${prendaId} no encontrada`);
   const {count}=await tx.prenda.updateMany({where:{id:prendaId,stock:{gte:quantity}},data:{stock:{decrement:quantity}}});
   if(count===0)throw new HttpError(409,`Stock insuficiente para prenda ${prendaId}`);
   total+=Number(prenda.precio)*quantity;
   lines.push({prendaId,quantity,unitPrice:prenda.precio});
  }
  return tx.order.create({data:{customerId:customer.id,total:total.toFixed(2),items:{create:lines}},include:orderInclude});
 },{timeout:15000});
};
const listByUser=async userId=>{const customer=await customerOf(userId);return prisma.order.findMany({where:{customerId:customer.id},include:orderInclude,orderBy:{createdAt:"desc"}});};
const cancel=async(userId,orderId)=>{
 const customer=await customerOf(userId);
 return prisma.$transaction(async tx=>{
  const order=await tx.order.findUnique({where:{id:orderId},include:{items:true}});
  if(!order)throw new HttpError(404,"Pedido no encontrado");
  if(order.customerId!==customer.id)throw new HttpError(403,"El pedido no pertenece al usuario");
  const updated=await tx.order.updateMany({where:{id:orderId,status:"PENDING"},data:{status:"CANCELLED"}});
  if(updated.count===0)throw new HttpError(409,"Solo se pueden cancelar pedidos pendientes");
  for(const item of order.items)await tx.prenda.update({where:{id:item.prendaId},data:{stock:{increment:item.quantity}}});
  return tx.order.findUnique({where:{id:orderId},include:orderInclude});
 },{timeout:15000});
};
module.exports={create,listByUser,cancel};
