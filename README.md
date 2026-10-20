# Laboratorio 1 · Mini-API MVC con CRUD

**Desarrollo Web Avanzado (A0R04) · ESPE · Unidad 1: Persistencia de datos y ORM**

| Dato | Valor |
|---|---|
| Grupo | G5 |
| Emprendimiento | SILEN Clothing |
| Integrantes | 1. DANIEL ISAI CHIRIBOGA ZURITA<br> 2. PEDRO ISAAC MAISINCHO PAUCAR<br> 3.ERICK ALEJANDRO SILVA CULQUI<br> |
| NRC |36878 |
| Fecha | 19/10/2026 |
| Repositorio | (enlace) |

## Cómo ejecutar

```bash
npm install
cp .env.example .env      # en Windows: copy .env.example .env
npm run dev               # http://localhost:3000
```

Importa en Postman `postman/GXX_Lab1.postman_collection.json` y ejecuta **Run collection**.

## Estructura MVC en capas

```
src/
├─ app.js            ← arma la app: express.json, middlewares y prefijo /api
├─ server.js         ← solo levanta el servidor (lee .env)
├─ routes/
│  ├─ index.js       ← archivo principal: monta cada recurso (/api/<entidad>)
│  └─ <entidad>.routes.js  ← verbo + URL → acción del controlador
├─ controllers/      ← lee req, llama al servicio, decide código + JSON
├─ services/         ← reglas de negocio, validaciones y acceso a datos
├─ models/           ← campos de la entidad y archivo JSON (Lab 2: schema.prisma)
├─ middlewares/      ← logger, notFound, errorHandler
└─ utils/httpError.js
data/                ← archivo JSON con los registros
```

Flujo de una petición: **ruta → controlador → servicio → modelo** y de vuelta. El proyecto usa CommonJS (`require` / `module.exports`).

## Endpoints de la entidad

| Verbo | Ruta | Acción | Éxito | Errores |
|---|---|---|---|---|
| GET | /api/prendas | Listar prendas | 200 | — |
| GET | /api/prendas/:id | Ver una prenda | 200 | 400, 404 |
| POST | /api/prendas | Crear una prenda| 201 | 400 |
| PUT | /api/prendas/:id | Actualizar una prenda | 200 | 400, 404 |
| DELETE | /api/prendas/:id | Eliminar una prenda | 204 | 404 |

## Validaciones del servicio

1.El nombre de la prenda debe ser un texto de al menos 3 caracteres. Si no cumple, el sistema devuelve un error 400
2.El precio de la prenda debe ser un número mayor que 0. Si no cumple, el sistema devuelve un error 400.

## Aporte de cada integrante

| Integrante | Qué hizo (archivos / pasos) |
|DANIEL ISAI CHIRIBOGA ZURITA | Adaptación del modelo y servicio de Prendas (prenda.model.js y prenda.service.js), implementación de las operaciones CRUD y validaciones de nombre y precio.|
|ERICK ALEJANDRO SILVA CULQUI | Configuración de las rutas y el controlador (prenda.routes.js, index.js y prenda.controller.js), implementación del middleware Logger y pruebas de los endpoints.|
|PEDRO ISAAC MAISINCHO PAUCAR | Elaboración de la propuesta del emprendimiento y mapa del sistema, adaptación de la colección de Postman, ejecución de las 13 pruebas, recopilación de evidencias y documentación en README.md.|

## Declaración de uso de IA

- Herramienta(s) usada(s):ChatGPT (OpenAI).
- Para qué la usamos (consultar, depurar, explicar un error…): principalmente para comprender mejor la estructura MVC y el funcionamiento de los archivos del proyecto. También realizamos consultas sobre algunos conceptos de ExpressJS y la implementación de las operaciones CRUD, además de buscar orientación para identificar y solucionar errores durante el desarrollo.
- Qué verificamos o corregimos nosotros:Nosotos hicimosla adaptación del proyecto al emprendimiento SILEN Clothing, revisamos el funcionamiento de las rutas y realizamos pruebas de las operaciones CRUD. También comprobamos las validaciones, ejecutamos las 13 pruebas en Postman y verificamos los resultados obtenidos para asegurarnos de que la API funcionara correctamente.
