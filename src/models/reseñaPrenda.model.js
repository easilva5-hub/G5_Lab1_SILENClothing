const mongoose = require("mongoose");

const photoSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: [true, "La URL de la fotografía es obligatoria"],
      match: [
        /^https?:\/\/.+/,
        "La URL de la fotografía debe iniciar con http:// o https://",
      ],
    },
    description: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const detailsSchema = new mongoose.Schema(
  {
    sizePurchased: {
      type: String,
      trim: true,
    },
    fit: {
      type: String,
      enum: {
        values: ["ajustado", "perfecto", "holgado"],
        message: "El ajuste '{VALUE}' no es válido (use: ajustado, perfecto u holgado)",
      },
    },
  },
  { _id: false }
);

const resenaPrendaSchema = new mongoose.Schema(
  {
    prendaId: {
      type: Number,
      required: [true, "El ID de la prenda (prendaId) es obligatorio"],
      min: [1, "El ID de la prenda debe ser mayor o igual a 1"],
    },
    userId: {
      type: Number,
      required: [true, "El ID del usuario (userId) es obligatorio"],
      min: [1, "El ID del usuario debe ser mayor o igual a 1"],
    },
    rating: {
      type: Number,
      required: [true, "La calificación (rating) es obligatoria"],
      min: [1, "La calificación mínima es 1"],
      max: [5, "La calificación máxima es 5"],
      validate: {
        validator: (v) => Number.isInteger(v),
        message: (props) => `${props.value} no es un número entero válido`,
      },
    },
    comment: {
      type: String,
      minlength: [5, "El comentario debe tener al menos 5 caracteres"],
    },
    channel: {
      type: String,
      enum: {
        values: ["web", "tienda", "redes_sociales"],
        message:
          "El canal '{VALUE}' no es válido (use: web, tienda o redes_sociales)",
      },
      default: "web",
    },
    tags: [String],
    details: detailsSchema,
    photos: [photoSchema],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

resenaPrendaSchema.virtual("stars").get(function () {
  return "★".repeat(this.rating || 0);
});

resenaPrendaSchema.pre("validate", function () {
  if (Array.isArray(this.tags)) {
    this.tags = [...new Set(this.tags.map((t) => t.trim().toLowerCase()))];
  }
  if (this.details && typeof this.details.sizePurchased === "string") {
    this.details.sizePurchased = this.details.sizePurchased.trim().toUpperCase();
  }
});

module.exports = mongoose.model(
  "ResenaPrenda",
  resenaPrendaSchema,
  "resenas_prendas"
);