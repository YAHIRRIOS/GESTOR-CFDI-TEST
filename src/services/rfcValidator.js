
const RFC_PATTERN = /^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/i;

/**
 * Valida un RFC mexicano y devuelve el resultado con código de error si aplica
 * @param {string} rfc - El RFC a validar
 * @returns {{ valid: boolean, errorCode: string|null }}
 */
function validateRfc(rfc) {
    // Caso 1: RFC vacío o nulo
    if (!rfc || typeof rfc !== 'string' || rfc.trim() === '') {
        return { valid: false, errorCode: 'RFC_EMPTY' };
    }

    const trimmed = rfc.trim();

    // Caso 2: Longitud inválida (debe ser 12 o 13)
    if (trimmed.length < 12 || trimmed.length > 13) {
        return { valid: false, errorCode: 'RFC_LENGTH_INVALID' };
    }

    // Caso 3: Caracteres especiales no permitidos
    if (/[^A-ZÑ&0-9]/i.test(trimmed)) {
        return { valid: false, errorCode: 'RFC_SPECIAL_CHARS' };
    }

    // Caso 4: Formato inválido (patrón no coincide)
    if (!RFC_PATTERN.test(trimmed)) {
        return { valid: false, errorCode: 'RFC_FORMAT_INVALID' };
    }

    return { valid: true, errorCode: null };
}

module.exports = { validateRfc };
