/*
 * Controlador de Transacciones
 */
const { validateRfc } = require('../services/rfcValidator');
const { insertarTransaccion, obtenerTransacciones } = require('../models/transaccionModel');
const { generarReportePDF } = require('../services/pdfService');

/**
 * POST /api/transacciones
 * Recibe un JSON con lista de transacciones, valida RFCs e inserta vía SP.
 */
async function cargarTransacciones(req, res) {
    try {
        const { transacciones } = req.body;

        if (!Array.isArray(transacciones) || transacciones.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Se requiere un arreglo "transacciones" con al menos un elemento.',
            });
        }

        const resultados = [];

        for (const tx of transacciones) {
            const { Folio, 'RFC Emisor': rfcEmisor, 'RFC Receptor': rfcReceptor, Monto, Estatus } = tx;

            const validacionEmisor = validateRfc(rfcEmisor);
            const validacionReceptor = validateRfc(rfcReceptor);

            const inserted = await insertarTransaccion({
                folio: Folio,
                rfc_emisor: rfcEmisor || null,
                rfc_receptor: rfcReceptor || null,
                monto: Monto || 0,
                estatus: Estatus || 'Vigente',
                rfc_emisor_valido: validacionEmisor.valid,
                rfc_receptor_valido: validacionReceptor.valid,
                error_emisor_code: validacionEmisor.errorCode || '',
                error_receptor_code: validacionReceptor.errorCode || '',
            });

            resultados.push({
                folio: Folio,
                id: inserted.id,
                nivel_prioridad: inserted.nivel_prioridad,
                rfc_emisor_valido: validacionEmisor.valid,
                rfc_receptor_valido: validacionReceptor.valid,
                errores: {
                    emisor: validacionEmisor.errorCode,
                    receptor: validacionReceptor.errorCode,
                },
            });
        }

        return res.status(201).json({
            success: true,
            message: `${resultados.length} transacción(es) procesada(s).`,
            data: resultados,
        });
    } catch (error) {
        console.error('Error al cargar transacciones:', error);
        return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
}

/**
 * GET /api/transacciones
 * Lista todas las transacciones. Soporta filtro por ?rfc_emisor=XXX
 */
async function listarTransacciones(req, res) {
    try {
        const { rfc_emisor } = req.query;
        const transacciones = await obtenerTransacciones(rfc_emisor || null);

        return res.json({
            success: true,
            count: transacciones.length,
            data: transacciones,
        });
    } catch (error) {
        console.error('Error al listar transacciones:', error);
        return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
}

/**
 * GET /api/transacciones/reporte
 * Genera PDF filtrado por ?rfc_emisor=XXX
 */
async function generarReporte(req, res) {
    try {
        const { rfc_emisor } = req.query;
        const transacciones = await obtenerTransacciones(rfc_emisor || null);

        if (transacciones.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No se encontraron transacciones para el filtro especificado.',
            });
        }

        generarReportePDF(res, transacciones, rfc_emisor);
    } catch (error) {
        console.error('Error al generar reporte:', error);
        return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
}

module.exports = {
    cargarTransacciones,
    listarTransacciones,
    generarReporte,
};
