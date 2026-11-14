# Hito 2 · Workload y modelo documental

Grupo: G5
Emprendimiento: SILEN Clothing  tienda de ropa urbana
Colección elegida en el Hito 1: resenas_prendas
Base NoSQL: MongoDB


## 1. Workload

| Actor               | Operación                    | Lectura o escritura | Frecuencia (por día/hora) | Datos que usa                                    |
|---------------------|------------------------------|---------------------|---------------------------|--------------------------------------------------|
| Cliente registrado  | Publicar una reseña          | Escritura           | 5 a 20 veces al día       | prendaId, userId, rating, comment, channel, tags |
| Visitante o cliente | Consultar reseñas de prendas | Lectura             | 20 a 100 veces al día     | prendaId, rating, comment, createdAt             |
| Administrador       | Revisar opiniones            | Lectura             | 5 a 15 veces al día       | rating, comment, userId, createdAt               |
| Administrador       | Eliminar reseñas             | Escritura           | 0 a 5 veces al día        | _id, userId                                      |


## 2. Relaciones: embeber o referenciar

| Relación             | Cardinalidad | ¿Se lee junto? | ¿Cambia seguido? | ¿Crece sin límite? | Decisión                |
|----------------------|--------------|----------------|------------------|--------------------|-------------------------|
| Reseña - Detalles    | 1:1          | Sí             | No               | No                 | Embebida (details)      |
| Reseña - Etiquetas   | 1:N          | Sí             | No               | No, lista pequeña  | Embebida (tags)         |
| Reseña - Fotografías | 1:N          | Sí             | No               | No, lista limitada | Embebida (photos)       |
| Prenda - Reseñas     | 1:N          | No siempre     | Sí               | Sí                 | Referenciada (prendaId) |
| Usuario - Reseñas    | 1:N          | No siempre     | Sí               | Sí                 | Referenciada (userId)   |
| Canal - Reseñas      | 1:N          | No siempre     | No               | Sí                 | Referenciada (channel)  |



## 3. ER de MongoDB

Lo embebido se dibuja DENTRO de la entidad (`campo[]`); lo referenciado, como caja aparte unida con una línea (`*_id`).

classDiagram
    class resenas_prendas {
        ObjectId _id
        Number prendaId
        Number userId
        Number rating
        String comment
        String channel
        String[] tags
        Object details
        Object[] photos
        Date createdAt
    }

    class canales_resena {
        String code
        String description
    }

    class Prenda_PostgreSQL {
        Int id
        String nombre
        Decimal precio
        Int stock
    }

    class User_PostgreSQL {
        Int id
        String name
        String email
    }

    resenas_prendas --> canales_resena : channel = code
    resenas_prendas ..> Prenda_PostgreSQL : prendaId = id
    resenas_prendas ..> User_PostgreSQL : userId = id


**Datos embebidos:**
- `details`: talla comprada y ajuste de la prenda.
- `tags[]`: etiquetas de la reseña.
- `photos[]`: fotografías con URL y descripción.

**Datos referenciados:**
- `prendaId`: identifica la prenda en PostgreSQL.
- `userId`: identifica al usuario en PostgreSQL.
- `channel`: identifica el canal en `canales_resena` de MongoDB.

Las reseñas se almacenan como documentos independientes.
Los datos pequeños se embeben dentro de cada reseña.
Las referencias evitan duplicar usuarios y prendas.

La relación con `canales_resena` permite realizar
una consulta `$lookup` entre dos colecciones de MongoDB.
Las referencias a PostgreSQL se resuelven desde el backend.


## 4. Playground (`grupoN.mongodb.js`)

- [x] `createCollection` con `$jsonSchema`: 1 `enum`, 1 rango (`minimum`/`maximum`) y 1 arreglo
- [x] 2 inserts válidos y 2 rechazados (con el mensaje)
- [x] `$lookup` entre dos colecciones
