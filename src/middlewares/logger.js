
// TODO Paso 3: registra hora, verbo y ruta de cada petición (diapositiva «Los middlewares…»)
// Reto opcional: registra también el código de estado y la duración usando res.on("finish", ...)
const logger = (req, res, next) => {
  // Escribe aquí tu console.log(...)
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp} ${req.method} ${req.url} - IP: ${req.ip}]`);

  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`[${timestamp}] Response: ${res.statusCode} - ${duration}ms`);
  });

  next(); // no lo borres: sin next() la petición se queda colgada
};

module.exports = logger;
