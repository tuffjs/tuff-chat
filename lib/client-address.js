module.exports = req => (
  { ip:
      req.headers['x-forwarded-for'] ||
      req.connection.remoteAddress,
    port:
      req.headers['x-forwarded-port'] ||
      req.connection.remotePort
  }
);

