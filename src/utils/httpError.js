// Error con código HTTP: el servicio o el controlador lo lanzan y errorHandler lo responde
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

module.exports = HttpError;
