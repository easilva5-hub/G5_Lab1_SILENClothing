// SERVER: solo levanta el servidor. La configuración de Express vive en app.js
require("dotenv").config();
const app = require("./app");

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});
