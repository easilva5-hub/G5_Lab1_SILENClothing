# Hito 1 · ¿Qué dato de nuestro emprendimiento va a NoSQL?

**Grupo:** G5  
**Emprendimiento:** SILEN Clothing — tienda de ropa urbana

## 1. Datos candidatos para NoSQL

| Dato del emprendimiento | ¿Por qué no encaja bien en una tabla relacional? | Tipo NoSQL | Razón |
|---|---|---|---|
| Reseñas y opiniones de prendas | Cada reseña puede contener un comentario de longitud variable, etiquetas, canal de compra y, en el futuro, fotografías o detalles de talla y ajuste. Muchos de esos atributos son opcionales y no todas las reseñas tienen la misma estructura. Además, se acumulan independientemente del catálogo. | Documental | Un documento puede guardar los campos propios de cada opinión y sus datos anidados sin crear muchas columnas opcionales. MongoDB permite ampliar la estructura cuando aparezcan nuevas características de las reseñas. |
| Fichas técnicas ampliadas de las prendas | Los atributos dependen del tipo de ropa: una camiseta puede tener tipo de cuello y manga; un pantalón, tipo de corte y largo; una chaqueta, tipo de cierre y capucha. Una tabla común tendría numerosos campos vacíos o requeriría tablas adicionales para cada tipo. | Documental | Los documentos permiten representar atributos diferentes por tipo de prenda y agrupar las características que normalmente se consultan juntas. |
| Historial de interacciones del catálogo | Las vistas de productos, búsquedas, clics y favoritos generan muchos registros pequeños y continuos. Su consulta suele orientarse a estadísticas por fecha, producto o tipo de interacción, no a actualizar cada registro. | Columnar | Un almacén columnar es adecuado para analizar grandes volúmenes de eventos y hacer agregaciones sobre columnas concretas, como fecha, producto o acción. |

## 2. Colección documental elegida

**Colección elegida:** `resenas_prendas` (documental, MongoDB).

Se seleccionan las reseñas porque aportan información directa sobre la experiencia de los clientes con cada prenda. El número de reseñas puede crecer con el tiempo y su contenido no es completamente uniforme: una persona puede dejar solo una calificación, otra puede escribir un comentario, agregar etiquetas o adjuntar fotografías.

Cada documento representa una reseña. Los campos `prendaId` y `userId` conservan los identificadores numéricos de la prenda y del usuario que existen en PostgreSQL. Se guardan como referencias, no como copias completas de esos registros.

### Ejemplo de documento

```json
{
  "prendaId": 27,
  "userId": 14,
  "rating": 5,
  "comment": "La camiseta tiene buen corte, la tela es cómoda y el diseño combina con ropa urbana.",
  "channel": "web",
  "tags": [
    "oversize",
    "comodidad",
    "buena-calidad"
  ],
  "details": {
    "sizePurchased": "M",
    "fit": "holgado"
  },
  "photos": [
    {
      "url": "https://thumbs.dreamstime.com/b/maqueta-blanca-y-negra-de-la-camiseta-frente-plantilla-camisa-del-espacio-en-blanco-deporte-visi%C3%B3n-trasera-hombres-ropa-las-155707322.jpg",
      "description": "Vista frontal de la prenda"
    }
  ],
  "createdAt": "2026-11-13T19:00:00.000Z"
}
```

**Descripción de los campos:**

- `prendaId`: identificador de la prenda en PostgreSQL.
- `userId`: identificador del usuario en PostgreSQL.
- `rating`: calificación entera de 1 a 5.
- `comment`: opinión escrita; puede ser opcional.
- `channel`: canal por el que se realizó la compra, por ejemplo `web`, `tienda` o `redes_sociales`.
- `tags`: arreglo opcional de etiquetas descriptivas.
- `details`: objeto opcional con detalles de la talla y el ajuste.
- `photos`: arreglo opcional de fotografías y sus descripciones.
- `createdAt`: fecha de creación de la reseña.

MongoDB genera automáticamente el campo `_id` para identificar cada documento. El ejemplo muestra una estructura propuesta; no representa una reseña real ni implica que el endpoint esté implementado en este hito.

## 3. Datos que se mantienen en PostgreSQL

PostgreSQL continúa siendo la base principal para los datos estructurados y transaccionales del emprendimiento:

| Dato | ¿Por qué permanece en PostgreSQL? |
|---|---|
| Usuarios y clientes | Requieren identificadores, correos únicos y relaciones consistentes con las demás operaciones del sistema. |
| Prendas y categorías | Contienen el catálogo oficial, precios, tallas, categorías y existencias que deben mantenerse íntegros. |
| Pedidos y detalle de pedidos | Se relacionan con clientes y prendas, y necesitan transacciones para registrar compras y controlar el inventario. |
| Stock y precios | Son datos críticos para las ventas; las operaciones deben conservar la consistencia y evitar descuentos incorrectos de existencias. |

Por tanto, MongoDB almacenará el contenido variable de las reseñas en `resenas_prendas`, mientras PostgreSQL conservará los usuarios, clientes, prendas, categorías y pedidos. Los campos `prendaId` y `userId` permitirán relacionar cada reseña con sus registros de PostgreSQL desde la lógica de la aplicación. No se pretende reemplazar la base relacional ni duplicar en MongoDB todo el catálogo.

## 4. Decisión final

Se incorpora MongoDB como almacenamiento documental complementario para las reseñas de SILEN Clothing. Esta separación permite conservar en PostgreSQL las operaciones que necesitan relaciones y transacciones, y aprovechar los documentos flexibles de MongoDB para opiniones que pueden tener comentarios, etiquetas, fotografías y detalles opcionales.

**Alcance de este hito:** se documenta la selección del dato, el tipo NoSQL, la colección y un documento de ejemplo. La conexión con Mongoose, la implementación de rutas y la creación de documentos mediante POST corresponden a los hitos posteriores.
