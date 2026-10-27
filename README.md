# Laboratorio 2 · Persistencia con Prisma 7 + PostgreSQL

**Desarrollo Web Avanzado (A0R04) · ESPE · Unidad 1: Persistencia de datos y ORM**

Evolución del Lab 1: la API MVC de SILEN Clothing deja de guardar en `data/prendas.json` y pasa a PostgreSQL con Prisma ORM.

| Dato | Valor |
|---|---|
| Grupo | G5 |
| Emprendimiento | SILEN Clothing |
| Integrantes | 1. DANIEL ISAI CHIRIBOGA ZURITA<br> 2. PEDRO ISAAC MAISINCHO PAUCAR<br> 3.ERICK ALEJANDRO SILVA CULQUI<br> |
| NRC |36878 |
| Fecha | 19/10/2026 |
| Repositorio | https://github.com/easilva5-hub/G5_Lab1_SILENClothing |

## Cómo ejecutar

Requisitos: Node 20+ y Docker (o un PostgreSQL propio).

```bash
npm install
cp .env.example .env            # en Windows: copy .env.example .env
docker compose up -d            # PostgreSQL 17 (y pgAdmin en http://localhost:5050)
npx prisma migrate dev          # aplica prisma/migrations (crea las tablas prendas y categorias)
npx prisma generate             # Prisma 7: migrate ya no genera el cliente
npx prisma db seed              # datos de prueba (idempotente: se puede repetir)
npm run dev                     # http://localhost:3000
```

Importa en Postman `postman/G5_Lab2.postman_collection.json` y ejecuta **Run collection** (15 peticiones).
Para ver los datos: `npx prisma studio`.

## Versiones y configuración de Prisma 7

| Paquete | Versión (exacta, idéntica en los tres) |
|---|---|
| `prisma` (dev) · `@prisma/client` · `@prisma/adapter-pg` | 7.10.1 |
| `pg` | 8.x |

- `prisma.config.ts` (raíz): contiene `DATABASE_URL` (`datasource.url`) y el comando del seed (`migrations.seed`).
- `prisma/schema.prisma`: el `datasource` solo lleva `provider = "postgresql"`, sin `url`.
- `src/db/prisma.js`: **única** instancia de `PrismaClient`, creada con el adaptador `PrismaPg`.

## Estructura MVC en capas

```
src/
├─ app.js · server.js   ← server.js comprueba la conexión a PostgreSQL antes de escuchar
├─ routes/              ← igual que el Lab 1 + POST /lote
├─ controllers/         ← igual que el Lab 1 + createMany
├─ services/            ← AHORA usa Prisma en lugar de fs (única capa refactorizada)
├─ db/prisma.js         ← NUEVO: instancia única de PrismaClient (adaptador pg)
├─ middlewares/         ← errorHandler traduce errores de Prisma (P2002 → 409, P2025 → 404)
└─ utils/httpError.js
prisma/
├─ schema.prisma        ← el MODELO ahora vive aquí (reemplaza a src/models/)
├─ migrations/          ← SQL versionado de las tablas
└─ seed.js              ← datos de prueba idempotentes
prisma.config.ts        ← URL de la base y comando del seed
MODELO_ER.md            ← diagrama ER (Mermaid) y cardinalidades
docker-compose.yml      ← PostgreSQL 17 + pgAdmin
```

Se eliminaron `data/` y `src/models/`. Flujo de una petición: **ruta → controlador → servicio → Prisma → PostgreSQL**.

## Modelo de datos

Ver [`MODELO_ER.md`](MODELO_ER.md). En este laboratorio se implementan **Prenda** (`prendas`) y **Categoria** (`categorias`), sin relaciones; las relaciones y las entidades Cliente y Venta llegan en el Lab 3.

## Endpoints

| Verbo | Ruta | Acción | Éxito | Errores |
|---|---|---|---|---|
| GET | /api/prendas | Listar prendas | 200 | — |
| GET | /api/prendas/:id | Ver una prenda | 200 | 400, 404 |
| POST | /api/prendas | Crear una prenda | 201 | 400, 409 |
| PUT | /api/prendas/:id | Actualizar una prenda | 200 | 400, 404, 409 |
| DELETE | /api/prendas/:id | Eliminar una prenda | 204 | 404 |
| POST | /api/prendas/lote | Crear varias prendas **en una transacción** | 201 | 400, 409 |

### Transacción atómica (`POST /api/prendas/lote`)

El cuerpo es un arreglo de prendas. El servicio usa `prisma.$transaction(async (tx) => { ... })`: valida y crea cada ítem con `tx`. Si **uno** falla (dato inválido → 400, nombre repetido → 409) se lanza un error y Prisma hace **ROLLBACK** automático: no queda ningún registro a medias. Si todos son válidos, hace **COMMIT** y responde 201 con las prendas creadas.

### Manejo de errores (`errorHandler.js`)

| Origen | Código Prisma | HTTP |
|---|---|---|
| Nombre duplicado (`@unique`) | P2002 | 409 |
| Registro no encontrado en update/delete | P2025 | 404 |
| Texto más largo que la columna | P2000 | 400 |
| Número fuera de rango (ej. id gigante) | P2020 | 400 |
| Tipo inválido rechazado por Prisma | `PrismaClientValidationError` | 400 |
| JSON mal formado · validaciones del servicio | — | 400 |

## Validaciones del servicio

1. `nombre`: texto de 3 a 80 caracteres (400).
2. `precio`: número mayor que 0 (400).
3. `stock` (opcional): entero mayor o igual a 0 · `talla` (máx. 10) y `categoria` (máx. 40) opcionales.

## Comandos del laboratorio
```bash
npx prisma migrate dev --name init   # crea las tablas a partir de schema.prisma
npx prisma generate                  # Prisma 7: genera el cliente (ya no lo hace migrate)
npx prisma db seed                   # carga los datos de prueba
npx prisma studio                    # ver y editar los datos en el navegador
npm run dev
```
## Qué trae y dónde va
 
Archivos del kit del Laboratorio 2 y qué se hizo con cada uno en nuestro proyecto:
 
| Archivo del kit | Acción en nuestro proyecto |
|---|---|
| `MODELO_ER.md` | Copiado a la raíz y completado: diagrama Mermaid con 4 entidades (Categoria, Prenda, Cliente, Venta), tablas de entidades y de relaciones con sus cardinalidades. |
| `prisma/schema.prisma` | Copiado y completado: `model Prenda` (campos del Lab 1: nombre, precio, stock, talla, categoria) y `model Categoria`, con `@id @default(autoincrement())`, `@unique`, `@db.VarChar`, campos opcionales y `@map`/`@@map`. Sin `@relation` (llega en el Lab 3). |
| `prisma/seed.js` | Copiado y completado: `deleteMany()` + reinicio de secuencias + `createMany()`. Carga 6 prendas y 4 categorías y se puede ejecutar varias veces sin duplicar ni fallar. «Camiseta Oversize» sirve para probar el 409. |
| `src/db/prisma.js` | Copiado tal cual: instancia única de `PrismaClient` con el adaptador `PrismaPg`. |
| `src/services/product.service.js` | **Reemplazó** al servicio con `fs` y se renombró a `prenda.service.js`. Conserva `FIELDS` y `validate()` del Lab 1 (ampliadas) y usa Prisma en `list`, `getById`, `create`, `update`, `remove` y `createMany` (transacción). |
| `src/middlewares/errorHandler.js` | **Reemplazó** al anterior: P2002 → 409 (único repetido), P2025 → 404 y, además, P2000/P2020/validación de Prisma → 400. Mantiene el 400 por JSON mal formado del Lab 1. |
| `postman/GXX_Lab2.postman_collection.json` | Copiado y adaptado como `postman/G5_Lab2.postman_collection.json`: ruta `/api/prendas`, campos en español y 15 peticiones (CRUD, 409, 404 y transacción con COMMIT/ROLLBACK). |
| `prisma.config.ts` | Copiado tal cual a la **raíz**: `DATABASE_URL` y comando del seed. |
| `docker-compose.yml` | Usado: PostgreSQL 17 + pgAdmin con Docker (`docker compose up -d`). |
| `.env.example` | **Reemplazó** al del Lab 1: se agregó `DATABASE_URL` y se quitó `DATA_FILE`. Cada integrante crea su `.env` a partir de este archivo. |
 
Archivos del Lab 1 que se modificaron o eliminaron:
 
| Archivo | Cambio |
|---|---|
| `src/server.js` | Verifica la conexión a PostgreSQL (`$connect()` + `SELECT 1`) antes de escuchar y cierra el pool con `SIGINT`/`SIGTERM`. |
| `src/controllers/prenda.controller.js` | Solo se agregó `createMany` (400 si el cuerpo no es un arreglo con al menos un elemento). El CRUD no cambió. |
| `src/routes/prenda.routes.js` | Solo se agregó `POST /lote`. El resto de rutas no cambió. |
| `src/models/` y `data/` | **Eliminados**: el modelo ahora es `schema.prisma` y los datos viven en PostgreSQL. |
| `package.json` | Se agregaron `@prisma/client`, `@prisma/adapter-pg`, `pg` y `prisma` (7.10.1 exacta) y los scripts `db:*`. |

## Aporte de cada integrante (Lab 2)

## Aporte de cada integrante (Lab 2)

| Integrante | Qué hizo (archivos / pasos) |
|---|---|
| *PEDRO ISAAC MAISINCHO PAUCAR* | Se encargó de la elaboración del modelo entidad-relación del emprendimiento SILEN Clothing, identificando las entidades, sus atributos y las relaciones correspondientes en MODELO_ER.md. También trabajó en la definición de los modelos Prenda y Categoria dentro de schema.prisma, estableciendo los tipos de datos y las restricciones necesarias. Además, participó en la creación de las migraciones y en la preparación del archivo seed.js para registrar datos iniciales en la base de datos. |
| *ERICK ALEJANDRO SILVA CULQUI* | Trabajó en la adaptación del servicio de prendas (prenda.service.js) para reemplazar el almacenamiento en archivos JSON por consultas a PostgreSQL mediante Prisma. Participó en la implementación y revisión de las operaciones CRUD, manteniendo la estructura MVC desarrollada en el Laboratorio 1. También colaboró en la implementación de la transacción /lote, las validaciones de los datos y el manejo de errores, para que el sistema responda correctamente cuando una operación no pueda completarse. |
| *DANIEL ISAI CHIRIBOGA ZURITA* | Se encargó de la configuración y comprobación de la base de datos PostgreSQL, verificando que las tablas y los registros se generaran correctamente. También trabajó en la adaptación de la colección de Postman para comprobar las operaciones CRUD, los códigos HTTP y las transacciones COMMIT y ROLLBACK. Participó en la ejecución de las 21 pruebas, la recopilación de capturas como evidencias y la actualización de la documentación del proyecto para presentar los resultados del laboratorio. |

## Declaración de uso de IA

- Herramienta(s) usada(s): ChatGPT (OpenAI).
- Para qué la usamos: (consultar, depurar, explicar un error…): principalmente para comprender mejor la estructura MVC y el funcionamiento de los archivos del proyecto. También realizamos consultas sobre algunos conceptos de ExpressJS y la implementación de las operaciones CRUD, además de buscar orientación para identificar y solucionar errores durante el desarrollo.
- Qué verificamos o corregimos nosotros: Nosotos hicimosla adaptación del proyecto al emprendimiento SILEN Clothing, revisamos el funcionamiento de las rutas y realizamos pruebas de las operaciones CRUD. También comprobamos las validaciones, ejecutamos las 13 pruebas en Postman y verificamos los resultados obtenidos para asegurarnos de que la API funcionara correctamente.

