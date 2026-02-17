/* Servidor Express - Punto de entrada*/
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const authMiddleware = require('./middlewares/auth');
const apiRoutes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares globales
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Archivos estáticos (Frontend)
app.use(express.static(path.join(__dirname, '..', 'public')));

// Rutas de la API (protegidas con X-API-KEY)
app.use('/api', authMiddleware, apiRoutes);

// Health check (sin autenticación)
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Inicio del servidor
app.listen(PORT, () => {
    console.log(`http://localhost:${PORT}/`);
});

module.exports = app;
