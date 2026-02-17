/* Servicio de generación de reportes PDF*/
const PDFDocument = require('pdfkit');

/**
 * Genera un PDF con la lista de transacciones filtradas.
 * @param {import('express').Response} res - Objeto de respuesta HTTP para streaming
 * @param {Array} transacciones - Lista de transacciones a incluir
 * @param {string|null} rfcFiltro - RFC Emisor usado como filtro (para encabezado)
 */
function generarReportePDF(res, transacciones, rfcFiltro) {
    const doc = new PDFDocument({ margin: 40, size: 'LETTER', layout: 'landscape' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
        'Content-Disposition',
        `attachment; filename="reporte_cfdi_${Date.now()}.pdf"`
    );
    doc.pipe(res);

    // Encabezado institucional
    doc
        .rect(0, 0, doc.page.width, 80)
        .fill('#1a1a2e');

    doc
        .fill('#e0e0e0')
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('Sistema de Gestión CFDI', 40, 20, { align: 'left' });

    doc
        .fontSize(10)
        .font('Helvetica')
        .fill('#a0a0a0')
        .text('Comprobantes Fiscales Digitales ', 40, 48, {
            align: 'left',
        });

    // Información del reporte
    doc.moveDown(2);
    doc
        .fill('#333')
        .fontSize(10)
        .font('Helvetica')
        .text(`Fecha de generación: ${new Date().toLocaleString('es-MX')}`, 40);

    if (rfcFiltro) {
        doc.text(`Filtrado por RFC Emisor: ${rfcFiltro}`, 40);
    }

    doc.text(`Total de registros: ${transacciones.length}`, 40);
    doc.moveDown(1);

    // Tabla de datos
    const headers = ['Folio', 'RFC Emisor', 'RFC Receptor', 'Monto', 'Estatus', 'Prioridad'];
    const colWidths = [100, 120, 120, 100, 100, 80];
    const tableLeft = 40;
    let y = doc.y;

    // Fila de encabezados
    doc.rect(tableLeft, y, colWidths.reduce((a, b) => a + b, 0), 22).fill('#16213e');
    let x = tableLeft;
    headers.forEach((header, i) => {
        doc
            .fill('#ffffff')
            .fontSize(9)
            .font('Helvetica-Bold')
            .text(header, x + 4, y + 6, { width: colWidths[i] - 8, align: 'left' });
        x += colWidths[i];
    });
    y += 22;

    // Filas de datos
    transacciones.forEach((t, idx) => {
        if (y > doc.page.height - 60) {
            doc.addPage();
            y = 40;
        }

        const bgColor = idx % 2 === 0 ? '#f8f9fa' : '#ffffff';
        const isAlert =
            t.estatus === 'Inconsistente' || !t.rfc_emisor_valido || !t.rfc_receptor_valido;
        const textColor = isAlert ? '#c0392b' : '#2c3e50';

        doc
            .rect(tableLeft, y, colWidths.reduce((a, b) => a + b, 0), 20)
            .fill(bgColor);

        const cells = [
            t.folio,
            t.rfc_emisor || '—',
            t.rfc_receptor || '—',
            `$${Number(t.monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
            t.estatus,
            t.nivel_prioridad,
        ];

        x = tableLeft;
        cells.forEach((cell, i) => {
            doc
                .fill(textColor)
                .fontSize(8)
                .font('Helvetica')
                .text(String(cell), x + 4, y + 5, { width: colWidths[i] - 8, align: 'left' });
            x += colWidths[i];
        });

        y += 20;
    });

    // Pie de página
    doc
        .moveDown(2)
        .fill('#999')
        .fontSize(8)
        .text('Documento generado — Sistema de Gestión CFDI', 40, doc.page.height - 30, {
            align: 'center',
            width: doc.page.width - 80,
        });

    doc.end();
}

module.exports = { generarReportePDF };
