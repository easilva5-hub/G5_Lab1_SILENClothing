
 // Hito 2 · Playground del grupo 5 (MongoDB for VS Code o mongosh)
use("silenclothing_lab");

// 1. createCollection con $jsonSchema: 1 enum, 1 rango (minimum/maximum) y 1 arreglo
// (si usan additionalProperties: false, declaren _id: { bsonType: "objectId" })

db.createCollection("resenas_prendas", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["prendaId", "userId", "rating", "channel"],
      properties: {
        prendaId: {
          bsonType: "number",
          minimum: 1
        },
        userId: {
          bsonType: "number",
          minimum: 1
        },
        rating: {
          bsonType: "number",
          minimum: 1,
          maximum: 5
        },
        comment: {
          bsonType: "string"
        },
        channel: {
          bsonType: "string",
          enum: ["web", "tienda", "redes_sociales"]
        },
        tags: {
          bsonType: "array",
          items: {
            bsonType: "string"
          }
        },
        details: {
          bsonType: "object",
          properties: {
            sizePurchased: { bsonType: "string" },
            fit: { bsonType: "string" }
          }
        },
        photos: {
          bsonType: "array",
          items: {
            bsonType: "object",
            properties: {
              url: { bsonType: "string" },
              description: { bsonType: "string" }
            }
          }
        },
        createdAt: {
          bsonType: "date"
        }
      }
    }
  },
  validationLevel: "strict",
  validationAction: "error"
});

print("Coleccion resenas_prendas creada correctamente");

// 2. Dos inserts válidos

db.resenas_prendas.insertOne({
  prendaId: 1,
  userId: 2,
  rating: 5,
  comment: "Excelente calidad de tela y buen diseño",
  channel: "web",
  tags: ["oversize", "comodidad"],
  details: {
    sizePurchased: "M",
    fit: "holgado"
  },
  photos: [],
  createdAt: new Date("2026-11-13T19:00:00Z")
});

print("Insert valido 1: reseña registrada correctamente");

db.resenas_prendas.insertOne({
  prendaId: 2,
  userId: 2,
  rating: 4,
  comment: "El hoodie es comodo y abrigado",
  channel: "tienda",
  tags: ["comodidad", "ropa-urbana"],
  details: {
    sizePurchased: "L",
    fit: "normal"
  },
  photos: [],
  createdAt: new Date("2026-11-14T09:00:00Z")
});

print("Insert valido 2: reseña registrada correctamente");

// 3. Dos inserts rechazados: envuélvanlos en try/catch e impriman qué campo falló

try {
  db.resenas_prendas.insertOne({
    prendaId: 1,
    userId: 2,
    rating: 7,
    channel: "web",
    tags: ["calidad"]
  });

  print("ERROR: se acepto una calificacion invalida");
} catch (error) {
  if (error.code !== 121) throw error;

  print("Insert rechazado 1");
  print("Campo: rating");
  print("Motivo: la calificacion debe estar entre 1 y 5");
  print("Mensaje MongoDB: " + error.message);

  if (error.errInfo) {
    printjson(error.errInfo.details);
  }
}

try {
  db.resenas_prendas.insertOne({
    prendaId: 2,
    userId: 2,
    rating: 4,
    channel: "telefono",
    tags: "comodidad"
  });

  print("ERROR: se aceptaron datos invalidos");
} catch (error) {
  if (error.code !== 121) throw error;

  print("Insert rechazado 2");
  print("Campos: channel y tags");
  print("Motivo: canal no permitido y etiquetas no son un arreglo");
  print("Mensaje MongoDB: " + error.message);

  if (error.errInfo) {
    printjson(error.errInfo.details);
  }
}

// 4. $lookup entre dos colecciones (+ $unwind si debe salir un solo objeto)

db.createCollection("canales_resena");

db.canales_resena.insertMany([
  {
    code: "web",
    description: "Reseña realizada desde la tienda web"
  },
  {
    code: "tienda",
    description: "Reseña realizada desde la tienda fisica"
  },
  {
    code: "redes_sociales",
    description: "Reseña realizada desde redes sociales"
  }
]);

print("Resultado de la consulta $lookup:");

db.resenas_prendas.aggregate([
  {
    $lookup: {
      from: "canales_resena",
      localField: "channel",
      foreignField: "code",
      as: "informacionCanal"
    }
  },
  {
    $unwind: "$informacionCanal"
  },
  {
    $project: {
      _id: 0,
      prendaId: 1,
      rating: 1,
      comment: 1,
      channel: 1,
      descripcionCanal: "$informacionCanal.description"
    }
  }
]).forEach(printjson);
