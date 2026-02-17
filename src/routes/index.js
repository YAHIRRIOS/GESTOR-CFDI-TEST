/* Definicion de los endpoits de la API */
const { Router } = require('express');
const {cargarTransacciones,listarTransacciones,generarReporte } = require('../controllers/transaccionController');

const router = Router();

router.post('/transacciones', cargarTransacciones);
router.get('/transacciones', listarTransacciones);
router.get('/transacciones/reporte', generarReporte);

module.exports = router;
