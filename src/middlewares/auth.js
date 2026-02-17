/*Middleware de autenticación por X-API-KEY*/

/**
 * Verifica que la petición incluya un header X-API-KEY válido.
 * Si no está presente o es incorrecto, devuelve 401 Unauthorized.
 */
function authMiddleware(req, res, next) {
    const apiKey = req.headers['x-api-key'];
    const validKey = process.env.API_KEY;
    if (!process.env.API_KEY) {
        throw new Error('API_KEY no está definida en el entorno');
    }

    if (!apiKey || apiKey !== validKey) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized — Se requiere un header X-API-KEY válido.',
        });
    }

    next();
}

module.exports = authMiddleware;
