/* Modelo de Transacción */
const pool = require('../config/database');

/*Inserta una transacción usando el Stored Procedure que calcula la prioridad.*/
async function insertarTransaccion({
    folio,
    rfc_emisor,
    rfc_receptor,
    monto,
    estatus,
    rfc_emisor_valido,
    rfc_receptor_valido,
    error_emisor_code,
    error_receptor_code,
}) {
    const query = `
    SELECT * FROM sp_insert_transaccion($1, $2, $3, $4, $5, $6, $7, $8, $9)
  `;
    const values = [
        folio,
        rfc_emisor,
        rfc_receptor,
        monto,
        estatus,
        rfc_emisor_valido,
        rfc_receptor_valido,
        error_emisor_code || null,
        error_receptor_code || null,
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
}

/**
 * Obtiene todas las transacciones, opcionalmente filtradas por RFC emisor
 * Usa la Vista para incluir la info de errores del catálogo.
 */
async function obtenerTransacciones(rfcEmisor) {
    let query = 'SELECT * FROM vw_transacciones_errores';
    const values = [];

    if (rfcEmisor) {
        query += ' WHERE rfc_emisor ILIKE $1';
        values.push(`%${rfcEmisor}%`);
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, values);
    return result.rows;
}

module.exports = {
    insertarTransaccion,
    obtenerTransacciones,
};
