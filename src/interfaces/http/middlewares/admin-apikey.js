// src/interfaces/http/middlewares/admin-apikey.js
export function requireAdminApiKey(req, res, next) {
  const provided = req.header('x-admin-api-key') || req.query.admin_key;
  if (!provided || provided !== process.env.ADMIN_API_KEY) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  return next();
}

export default requireAdminApiKey;
