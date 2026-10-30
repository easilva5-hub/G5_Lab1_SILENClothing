# Laboratorio 3 · Autenticación, relaciones y transacciones con Prisma 7 + PostgreSQL

**Desarrollo Web Avanzado (A0R04) · ESPE · Unidad: API REST, seguridad y persistencia**

Evolución de los Laboratorios 1 y 2: la API MVC de **SILEN Clothing** conserva su catálogo de prendas en PostgreSQL con Prisma ORM y agrega autenticación JWT, autorización por roles, perfiles de cliente, pedidos con descuento seguro de stock, cancelación y consultas administrativas. **La entrega se ejecuta en local; el despliegue en Railway queda fuera del alcance de esta versión.**

| Dato | Valor |
|---|---|
| Grupo | G5 |
| Emprendimiento | SILEN Clothing |
| Integrantes | DANIEL ISAI CHIRIBOGA ZURITA; PEDRO ISAAC MAISINCHO PAUCAR; ERICK ALEJANDRO SILVA CULQUI |
| NRC | 36878 |
| Fecha | 28/10/2026 |
| Repositorio | https://github.com/easilva5-hub/G5_Lab1_SILENClothing |

## 1. Cómo ejecutar

**Requisitos:** Node.js 20 o superior, PostgreSQL (instalación local o Docker), npm y Postman.

```bash
npm install
npx prisma migrate deploy
npx prisma generate
npx prisma db seed
npm run dev
```

## 2. Tecnologías y configuración

| Tecnología | Uso |
|---|---|
| Node.js + Express | Servidor HTTP y rutas REST |
| PostgreSQL | Base de datos relacional |
| Prisma ORM 7.10.1 | Modelos, migraciones, transacciones y consultas |
| `@prisma/client` y `@prisma/adapter-pg` 7.10.1 | Cliente Prisma y conexión PostgreSQL |
| `pg` 8.x | Driver de PostgreSQL |
| `bcryptjs` | Hash y verificación de contraseñas |
| `jsonwebtoken` | Generación y verificación de JWT |
| Postman | Pruebas de endpoints y variables de tokens |

- `prisma.config.ts`: configuración de la URL y el seed.
- `prisma/schema.prisma`: modelos, enums, relaciones y mapeos.
- `src/db/prisma.js`: instancia central de Prisma Client con `PrismaPg`.
- `.env.example`: plantilla sin datos sensibles.

## 3. Estructura del proyecto en capas

```text
SILENClothing_Lab3/
├── src/
│   ├── app.js
│   ├── server.js
│   ├── routes/             # auth, prendas, orders y admin
│   ├── controllers/        # recibe req y construye res
│   ├── services/           # reglas de negocio y consultas Prisma
│   ├── middlewares/       # JWT, roles, errores y logging
│   ├── db/prisma.js        # instancia única del ORM
│   └── utils/httpError.js
├── prisma/
│   ├── schema.prisma
│   ├── migrations/         # init y relaciones
│   └── seed.js
├── postman/
│   └── G5_Lab3_SILENClothing.postman_collection.json
├── evidencias/             # crear y adjuntar capturas locales
├── prisma.config.ts
├── docker-compose.yml
├── MODELO_ER.md
├── .env.example
└── README.md
```

## 4. Modelo de datos y relaciones reales

Ver [`MODELO_ER.md`](MODELO_ER.md) para el diagrama y las justificaciones completas.

| Relación | Cardinalidad | Política `onDelete` y motivo |
|---|---|---|
| `User` → `Customer` | 1:1; `Customer.userId @unique` | `Cascade`: al eliminar un usuario, se elimina su perfil |
| `Customer` → `Order` | 1:N | `Restrict`: evita eliminar un cliente con pedidos registrados |
| `Order` → `OrderItem` | 1:N | `Cascade`: las líneas dependen del pedido |
| `Prenda` → `OrderItem` | 1:N; junto a Order forma N:M explícita | `Restrict`: protege la referencia histórica a prendas vendidas |
| `Categoria` → `Prenda` | 1:N opcional | `SetNull`: eliminar una categoría no elimina inventario |

La relación N:M **Order ↔ Prenda** utiliza `OrderItem` como tabla intermedia y almacena `quantity` y `unitPrice`, para preservar el precio de venta de cada línea. Se incluyen:

- Enums `Role` (`USER`, `ADMIN`) y `OrderStatus` (`PENDING`, `DELIVERED`, `CANCELLED`).
- `Decimal(10,2)` para `Prenda.precio`, `Order.total` y `OrderItem.unitPrice`.
- `DateTime` para creación y actualización.
- Clave primaria compuesta `@@id([orderId, prendaId])` e índice `@@index([status, createdAt])`.
- Nombres SQL en `snake_case` mediante `@map` y `@@map`.

## 5. Autenticación JWT y autorización

| Operación | Descripción |
|---|---|
| `POST /api/auth/register` | Valida los datos, aplica `bcrypt.hash(..., 10)` y crea `User` + perfil `Customer` mediante escritura anidada 1:1; asigna `USER` |
| `POST /api/auth/login` | Verifica la contraseña con `bcrypt.compare` y firma JWT con el `id` y `role` |
| `GET /api/auth/me` | Obtiene datos del usuario autenticado sin devolver la contraseña |
| `authenticateToken` | Comprueba el JWT antes de acceder a endpoints privados |
| `requireRole("ADMIN")` | Restringe operaciones de escritura del catálogo y módulo administrativo |

Las credenciales incorrectas responden **401** con un mensaje genérico; la ausencia de token responde **401**; token inválido o rol sin permisos responde **403**. Los datos del usuario se proyectan con `select` para no devolver contraseñas.

Usuarios de desarrollo cargados por el seed:

| Rol | Correo | Contraseña de prueba |
|---|---|---|
| ADMIN | `admin@silen.com` | `Admin123*` |
| USER | `cliente@silen.com` | `Cliente123*` |

Estas credenciales son únicamente para el entorno de prueba local.

## 6. Endpoints y permisos

| Método | Endpoint | Función | Acceso | Éxito y errores principales |
|---|---|---|---|---|
| POST | `/api/auth/register` | Registrar usuario y perfil | Público | 201; 400, 409 |
| POST | `/api/auth/login` | Obtener JWT | Público | 200; 400, 401 |
| GET | `/api/auth/me` | Perfil del token | Autenticado | 200; 401, 403 |
| GET | `/api/prendas` | Listar prendas | Público | 200 |
| GET | `/api/prendas/:id` | Consultar prenda | Público | 200; 400, 404 |
| POST | `/api/prendas` | Crear prenda | ADMIN | 201; 400, 401, 403, 409 |
| POST | `/api/prendas/lote` | Crear lote de prendas atómicamente | ADMIN | 201; 400, 409 |
| PUT | `/api/prendas/:id` | Actualizar prenda | ADMIN | 200; 400, 404, 409 |
| DELETE | `/api/prendas/:id` | Eliminar prenda | ADMIN | 204; 404, 409 |
| POST | `/api/orders` | Crear pedido y descontar stock | Autenticado con perfil de cliente | 201; 400, 403, 404, 409 |
| GET | `/api/orders` | Listar pedidos del cliente | Autenticado con perfil de cliente | 200; 403 |
| PATCH | `/api/orders/:id/cancel` | Cancelar pedido pendiente y reponer stock | Propietario del pedido | 200; 403, 404, 409 |
| GET | `/api/admin/orders` | Consultar pedidos con filtros y paginación | ADMIN | 200; 400, 401, 403 |
| PATCH | `/api/admin/orders/:id/status` | Marcar pedido como entregado | ADMIN | 200; 400, 404, 409 |
| GET | `/api/admin/reports/top-products` | Productos más vendidos | ADMIN | 200; 400 |

*Nota:* las tablas resumen los códigos más relevantes; la autenticación puede añadir `401` o `403` a cualquier endpoint protegido.

## 7. Pedido con transacción y recurso limitado

El **recurso limitado es el stock de cada prenda**. `POST /api/orders` recibe:

```json
{
  "items": [
    { "prendaId": 1, "quantity": 2 },
    { "prendaId": 2, "quantity": 1 }
  ]
}
```

En `src/services/order.service.js`, `prisma.$transaction(async tx => { ... })` consulta el precio de cada prenda y ejecuta una actualización condicional (`tx.prenda.updateMany`) con `stock: { gte: quantity }` y `stock: { decrement: quantity }`.

- **COMMIT:** si todas las prendas existen y tienen unidades disponibles, se descuenta cada stock y se crea `Order` con los `OrderItem`.
- **ROLLBACK:** si cualquier línea no tiene stock, se lanza `HttpError(409, ...)`. La transacción se revierte: **no queda un pedido parcial ni descuentos permanentes de líneas anteriores**.
- **Cancelación:** `PATCH /api/orders/:id/cancel` comprueba existencia (`404`), propiedad (`403`) y estado pendiente (`409` si no corresponde). Cambia a `CANCELLED` y repone el stock en una misma transacción.

El CRUD de prendas mantiene también la operación de lote `POST /api/prendas/lote` del Lab 2, que es atómica y revierte todo el lote cuando una creación falla.

## 8. Administración y consultas avanzadas

El módulo `src/services/admin.service.js` es exclusivo de `ADMIN` e implementa:

- **Filtros:** `GET /api/admin/orders?status=PENDING&from=2026-10-01&to=2026-10-31`.
- **Paginación:** `page` y `limit` con `skip`/`take`; `count` calcula el total.
- **Relaciones:** `include` carga cliente e ítems; `select` restringe los datos visibles.
- **Orden:** `orderBy` por fecha descendente.
- **Reporte:** `GET /api/admin/reports/top-products?limit=5` utiliza `groupBy` para sumar cantidades, excluyendo pedidos cancelados.

## 9. Validaciones y errores HTTP

| Situación | Respuesta |
|---|---|
| Datos ausentes o inválidos | 400 Bad Request |
| Login incorrecto o token ausente | 401 Unauthorized |
| Token inválido, rol insuficiente o pedido ajeno | 403 Forbidden |
| Recurso inexistente | 404 Not Found |
| Correo/nombre duplicado (`P2002`), stock insuficiente o estado no permitido | 409 Conflict |
| Clave foránea restringida (`P2003`) | 409 Conflict |
| Registro inexistente en operación Prisma (`P2025`) | 404 Not Found |
| Texto demasiado largo o rango inválido (`P2000`, `P2020`) | 400 Bad Request |

**Validaciones de prendas:** `nombre` de 3 a 80 caracteres; `precio` positivo; `stock` entero no negativo; `talla` hasta 10 caracteres y `categoria` hasta 40, ambas opcionales. **Validaciones de pedidos:** `items` no vacío, identificadores y cantidades enteros positivos y sin prendas repetidas en el mismo pedido.

## 10. Colección de Postman y evidencias locales

Importar `postman/G5_Lab3_SILENClothing.postman_collection.json`. La colección está organizada en **4 carpetas y 25 peticiones** que cubren autenticación, roles, CRUD, pedidos, rollback, cancelación y reportes. Configurar la variable `baseUrl = http://localhost:30XX`.

Ejecutar primero los logins de ADMIN y USER. Los scripts de la colección guardan los tokens en las variables `adminToken` y `userToken`; las peticiones privadas usan `Bearer {{adminToken}}` o `Bearer {{userToken}}`, según el rol.


## 11. Qué se adaptó del kit del Lab 3

| Archivo | Adaptación para SILEN Clothing |
|---|---|
| `prisma/schema.prisma` | Modelos de `User`, `Customer`, `Order`, `OrderItem`, `Prenda` y `Categoria`; enums, FK y mapeos |
| `prisma/migrations/` | Migración de relaciones e índices sobre el esquema anterior |
| `prisma/seed.js` | Datos de desarrollo, usuarios ADMIN/USER y prendas de ejemplo |
| `src/middlewares/auth.js` | `authenticateToken` y `requireRole` |
| `src/routes/auth.routes.js` y `src/controllers/auth.controller.js` | Endpoints de registro, login y perfil |
| `src/services/auth.service.js` | bcrypt, JWT y creación anidada de cliente |
| `src/services/order.service.js` | Pedidos con stock condicional, rollback y cancelación |
| `src/services/admin.service.js` | Filtros, paginación, count, include/select y groupBy |
| `src/routes/prenda.routes.js` | Lecturas públicas y escrituras restringidas a ADMIN |
| `src/middlewares/errorHandler.js` | Traducción de errores Prisma y HTTP, incluyendo 409 |
| `postman/G5_Lab3_SILENClothing.postman_collection.json` | 25 solicitudes agrupadas en 4 carpetas y uso de tokens |
| `MODELO_ER.md` | Cardinalidades, `onDelete` y decisiones de modelado |

## 12. Aporte de cada integrante (Lab 3)

**Distribución propuesta de responsabilidades.** Esta tabla reparte el trabajo para organizar la exposición y revisión; antes de entregarla como registro de aportes realizados, el grupo debe confirmar y ajustar lo que efectivamente hizo cada integrante.

| Integrante | Qué hizo (archivos / pasos) |
|---|---|
| DANIEL ISAI CHIRIBOGA ZURITA |Implementación de autenticación y seguridad. Desarrollo de auth.routes.js, auth.controller.js, auth.service.js y auth.js. Registro, login, JWT, bcrypt y protección de rutas mediante roles USER y ADMIN.|
| ERICK ALEJANDRO SILVA CULQUI |Diseño y configuración de PostgreSQL y Prisma. Modificación de schema.prisma, seed.js, migraciones y MODELO_ER.md. Implementación de relaciones 1:1, 1:N y N:M, claves foráneas, restricciones e índices.|
| PEDRO ISAAC MAISINCHO PAUCAR |Implementación del sistema de pedidos y administración. Desarrollo de order.service.js, admin.service.js y sus rutas y controladores. Transacciones, control de stock, rollback, cancelaciones, filtros, paginación y pruebas con Postman.|





## 13. Declaración de uso de IA

- **Herramienta utilizada:**.
- **Para qué se utilizó:** apoyo para comprender la arquitectura por capas con Express y Prisma, adaptar el kit del Lab 3 al emprendimiento SILEN Clothing, preparar código de autenticación y autorización, diseñar las relaciones, plantear las operaciones de pedidos con transacciones, construir consultas administrativas, organizar pruebas de Postman y redactar documentación.
- **Qué corresponde verificar al equipo:** revisar el código, configurar PostgreSQL, aplicar las migraciones, ejecutar seed y endpoints, validar los códigos HTTP, comprobar la reversión de stock, ejecutar la colección de Postman y generar las evidencias. No se declara aquí que todas esas pruebas ya estén aprobadas.






## Taller - Tarjeta C: Estados e historial de pedidos

Se implementó el control de estados de los pedidos y un historial para registrar los cambios realizados.

### Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| PATCH | /api/admin/orders/:id/status | Permite al administrador cambiar el estado de un pedido. |
| GET | /api/orders/:id/history | Permite consultar el historial del pedido al propietario o administrador. |
| PATCH | /api/orders/:id/cancel | Permite al cliente cancelar un pedido pendiente o confirmado. |

### Estados permitidos

- PENDING → CONFIRMED
- PENDING → CANCELLED
- CONFIRMED → DELIVERED
- CONFIRMED → CANCELLED

Los pedidos DELIVERED y CANCELLED no permiten nuevos cambios de estado.

### Validaciones

- 400: Estado inválido.
- 403: Usuario sin permisos.
- 404: Pedido no encontrado.
- 409: Cambio de estado no permitido.

Los cambios se registran en OrderStatusHistory con el estado anterior, el nuevo estado, el usuario responsable, la fecha y una nota opcional.

La actualización del estado y el registro del historial se realizan dentro de una transacción.
