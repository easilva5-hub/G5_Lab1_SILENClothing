const bcrypt=require("bcryptjs");const jwt=require("jsonwebtoken");
const prisma=require("../db/prisma");const HttpError=require("../utils/httpError");
const publicUser={id:true,email:true,name:true,role:true,customer:true};
const register=async({email,password,name,phone}={})=>{
 if(typeof email!=="string"||! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())||email.length>120)throw new HttpError(400,"Correo inválido");
 if(typeof password!=="string"||password.length<8)throw new HttpError(400,"La contraseña debe tener al menos 8 caracteres");
 if(typeof name!=="string"||name.trim().length<2||name.length>100)throw new HttpError(400,"Nombre inválido");
 if(phone!=null&&(typeof phone!=="string"||phone.length>15))throw new HttpError(400,"Teléfono inválido");
 const normalized=email.trim().toLowerCase();
 return prisma.user.create({data:{email:normalized,password:await bcrypt.hash(password,10),name:name.trim(),role:"USER",customer:{create:{fullName:name.trim(),email:normalized,phone:phone||null}}},select:publicUser});
};
const login=async({email,password}={})=>{
 if(typeof email!=="string"||typeof password!=="string")throw new HttpError(400,"Correo y contraseña obligatorios");
 const user=await prisma.user.findUnique({where:{email:email.trim().toLowerCase()}});
 if(!user||!await bcrypt.compare(password,user.password))throw new HttpError(401,"Credenciales incorrectas");
 if(!process.env.JWT_SECRET)throw new Error("JWT_SECRET no configurado");
 return jwt.sign({id:user.id,role:user.role},process.env.JWT_SECRET,{expiresIn:process.env.JWT_EXPIRES_IN||"4h",algorithm:"HS256"});
};
const getProfile=async(id)=>{const user=await prisma.user.findUnique({where:{id},select:publicUser});if(!user)throw new HttpError(404,"Usuario no encontrado");return user;};
module.exports={register,login,getProfile};
