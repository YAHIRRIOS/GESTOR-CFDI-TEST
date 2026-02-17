/* CFDI Dashboard */

const API_BASE = '/api';
const API_KEY = 'JyQfnJyKYwtKUhZKMUgpoOPotgkMWRft';

/* Utilidades */

function getApiKey() {
    return API_KEY;
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

function formatMonto(monto) {
    return `$${Number(monto).toLocaleString('es-MX', 
        { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getEstatusBadge(estatus) {
    const cls = estatus === 'Inconsistente' ? 'badge-inconsistente'
        : estatus === 'Cancelado' ? 'badge-cancelado'
            : 'badge-vigente';
    return `<span class="badge ${cls}">${estatus}</span>`;
}

function getPrioridadBadge(prioridad) {
    const cls = prioridad === 'Alta' ? 'badge-alta' : 'badge-normal';
    return `<span class="badge ${cls}">${prioridad}</span>`;
}

/* Peticiones a la API */

async function apiRequest(method, path, body = null) {
    const apiKey = getApiKey();
    if (!apiKey) {
        showToast('Ingrese su API Key primero.', 'error');
        throw new Error('API Key requerida');
    }

    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'X-API-KEY': apiKey,
        },
    };

    if (body) options.body = JSON.stringify(body);

    const res = await fetch(`${API_BASE}${path}`, options);

    if (res.status === 401) {
        showToast('API Key inválida. Verifique su configuración.', 'error');
        throw new Error('Unauthorized');
    }

    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `Error ${res.status}`);
    }

    return res;
}

/* Carga de archivo */

async function uploadFile(file) {
    try {
        const text = await file.text();
        const json = JSON.parse(text);

        if (!json.transacciones || !Array.isArray(json.transacciones)) {
            showToast('El JSON debe contener un arreglo "transacciones".', 'error');
            return;
        }

        const res = await apiRequest('POST', '/transacciones', json);
        const data = await res.json();

        showToast(`${data.data.length} transacción(es) cargada(s) exitosamente.`, 'success');
        loadTransacciones();
    } catch (err) {
        if (err.message !== 'Unauthorized' && err.message !== 'API Key requerida') {
            showToast(`Error al cargar: ${err.message}`, 'error');
        }
    }
}

/* Consulta y renderizado */

async function loadTransacciones(rfcFilter = '') {
    try {
        const queryParam = rfcFilter ? `?rfc_emisor=${encodeURIComponent(rfcFilter)}` : '';
        const res = await apiRequest('GET', `/transacciones${queryParam}`);
        const data = await res.json();

        renderTable(data.data);
        updateStats(data.data);
    } catch (err) {
        if (err.message !== 'Unauthorized' && err.message !== 'API Key requerida') {
            showToast(`Error al cargar datos: ${err.message}`, 'error');
        }
    }
}

function renderTable(transacciones) {
    const tbody = document.getElementById('tableBody');
    const emptyState = document.getElementById('emptyState');
    const tableCard = document.getElementById('tableCard');
    const filterCard = document.getElementById('filterCard');
    const statsRow = document.getElementById('statsRow');

    tableCard.style.display = 'block';
    filterCard.style.display = 'block';
    statsRow.style.display = 'grid';

    if (transacciones.length === 0) {
        tbody.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';

    tbody.innerHTML = transacciones.map(tx => {
        const isAlert = tx.estatus === 'Inconsistente' || !tx.rfc_emisor_valido || !tx.rfc_receptor_valido;
        const rowClass = isAlert ? 'row-alert' : '';

        let errorDesc = '';
        const errors = [];
        if (tx.error_emisor_descripcion) errors.push(`Emisor: ${tx.error_emisor_descripcion}`);
        if (tx.error_receptor_descripcion) errors.push(`Receptor: ${tx.error_receptor_descripcion}`);
        if (errors.length > 0) errorDesc = errors.join(' | ');

        const iconValid = '<i class="fa-solid fa-circle-check" style="color: #00cec9;"></i>';
        const iconInvalid = '<i class="fa-solid fa-circle-xmark" style="color: #e74c3c;"></i>';

        return `
      <tr class="${rowClass}">
        <td>${tx.folio}</td>
        <td>${tx.rfc_emisor || '—'}</td>
        <td>${tx.rfc_receptor || '—'}</td>
        <td>${formatMonto(tx.monto)}</td>
        <td>${getEstatusBadge(tx.estatus)}</td>
        <td>${getPrioridadBadge(tx.nivel_prioridad)}</td>
        <td>${tx.rfc_emisor_valido ? iconValid : iconInvalid}</td>
        <td>${tx.rfc_receptor_valido ? iconValid : iconInvalid}</td>
        <td style="font-size:0.75rem; white-space:normal; max-width:220px;">${errorDesc}</td>
      </tr>
    `;
    }).join('');
}

function updateStats(transacciones) {
    document.getElementById('statTotal').textContent = transacciones.length;
    document.getElementById('statInconsistentes').textContent =
        transacciones.filter(t => t.estatus === 'Inconsistente').length;
    document.getElementById('statRfcInvalido').textContent =
        transacciones.filter(t => !t.rfc_emisor_valido || !t.rfc_receptor_valido).length;
    document.getElementById('statPrioridadAlta').textContent =
        transacciones.filter(t => t.nivel_prioridad === 'Alta').length;
}

/* Exportar PDF */

async function exportPdf() {
    try {
        const rfcFilter = document.getElementById('filterRfc').value.trim();
        const queryParam = rfcFilter ? `?rfc_emisor=${encodeURIComponent(rfcFilter)}` : '';

        const res = await fetch(`${API_BASE}/transacciones/reporte${queryParam}`, {
            headers: { 'X-API-KEY': API_KEY },
        });

        if (res.status === 401) {
            showToast('Error de autenticación con el servidor.', 'error');
            return;
        }

        if (res.status === 404) {
            showToast('No se encontraron transacciones para exportar.', 'error');
            return;
        }

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte_cfdi_${Date.now()}.pdf`;
        a.click();
        URL.revokeObjectURL(url);

        showToast('Reporte PDF descargado.', 'success');
    } catch (err) {
        showToast(`Error al exportar PDF: ${err.message}`, 'error');
    }
}

/* Eventos */

document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    const uploadZone = document.getElementById('uploadZone');

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) uploadFile(e.target.files[0]);
    });

    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.classList.add('dragover');
    });

    uploadZone.addEventListener('dragleave', () => {
        uploadZone.classList.remove('dragover');
    });

    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) uploadFile(e.dataTransfer.files[0]);
    });

    document.getElementById('btnFilter').addEventListener('click', () => {
        const rfc = document.getElementById('filterRfc').value.trim();
        loadTransacciones(rfc);
    });

    document.getElementById('btnClear').addEventListener('click', () => {
        document.getElementById('filterRfc').value = '';
        loadTransacciones();
    });

    document.getElementById('filterRfc').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const rfc = e.target.value.trim();
            loadTransacciones(rfc);
        }
    });

    document.getElementById('btnPdf').addEventListener('click', exportPdf);

    loadTransacciones();
});
