/*
 * · Laboratorio 2 · API MVC con Prisma 7 + PostgreSQL (evolución del Lab 1)
 * · Desarrollo Web Avanzado (A0R04) · ESPE
 * · Grupo: G5 
 * · Emprendimiento: SILEN Clothing
 * · Integrantes: DANIEL ISAI CHIRIBOGA ZURITA
 *                PEDRO ISAAC MAISINCHO PAUCAR
 *                ERICK ALEJANDRO SILVA CULQUI
 * · NRC: 36878 
 * · Fecha: 19/10/2026
 */
const express = require("express");
const routes = require("./routes");
const logger = require("./middlewares/logger");
const notFound = require("./middlewares/notFound");
const errorHandler = require("./middlewares/errorHandler");

const app = express();

// 1. Middlewares que actúan ANTES del controlador
app.use(express.json()); // reemplaza a body-parser: llena req.body con el JSON recibido
app.use(logger);

// 2. Rutas: todas cuelgan del prefijo /api (ver routes/index.js)
app.get("/", (req, res) => res.json({ api: "Lab 3 · Relaciones, autenticación y despliegue de API + PostgreSQL", estado: "ok" }));
app.use("/api", routes);

// 3. Middlewares que actúan DESPUÉS: ruta no encontrada y manejo de errores (siempre al final)
app.use(notFound);
app.use(errorHandler);

module.exports = app;
