/*
 * Pruebas unitarias 
 */
const { validateRfc } = require('../src/services/rfcValidator');

describe('Validador de RFC - validateRfc()', () => {

    describe('RFC vacío o nulo', () => {
        test('retorna RFC_EMPTY cuando el RFC es un string vacío', () => {
            const result = validateRfc('');
            expect(result.valid).toBe(false);
            expect(result.errorCode).toBe('RFC_EMPTY');
        });

        test('retorna RFC_EMPTY cuando el RFC es null', () => {
            const result = validateRfc(null);
            expect(result.valid).toBe(false);
            expect(result.errorCode).toBe('RFC_EMPTY');
        });

        test('retorna RFC_EMPTY cuando el RFC es undefined', () => {
            const result = validateRfc(undefined);
            expect(result.valid).toBe(false);
            expect(result.errorCode).toBe('RFC_EMPTY');
        });

        test('retorna RFC_EMPTY cuando el RFC solo tiene espacios', () => {
            const result = validateRfc('   ');
            expect(result.valid).toBe(false);
            expect(result.errorCode).toBe('RFC_EMPTY');
        });
    });

    describe('Longitud incorrecta', () => {
        test('retorna RFC_LENGTH_INVALID cuando el RFC tiene menos de 12 caracteres', () => {
            const result = validateRfc('ABC12345');
            expect(result.valid).toBe(false);
            expect(result.errorCode).toBe('RFC_LENGTH_INVALID');
        });

        test('retorna RFC_LENGTH_INVALID cuando el RFC tiene más de 13 caracteres', () => {
            const result = validateRfc('ABCD1234567890');
            expect(result.valid).toBe(false);
            expect(result.errorCode).toBe('RFC_LENGTH_INVALID');
        });

        test('retorna RFC_LENGTH_INVALID para un solo carácter', () => {
            const result = validateRfc('A');
            expect(result.valid).toBe(false);
            expect(result.errorCode).toBe('RFC_LENGTH_INVALID');
        });
    });

    describe('Caracteres especiales', () => {
        test('retorna RFC_SPECIAL_CHARS cuando contiene guiones', () => {
            const result = validateRfc('ABC-123456-A1');
            expect(result.valid).toBe(false);
            expect(result.errorCode).toBe('RFC_SPECIAL_CHARS');
        });

        test('retorna RFC_SPECIAL_CHARS cuando contiene signos de puntuación', () => {
            const result = validateRfc('ABC.123456.A1');
            expect(result.valid).toBe(false);
            expect(result.errorCode).toBe('RFC_SPECIAL_CHARS');
        });

        test('retorna RFC_SPECIAL_CHARS cuando contiene espacios internos', () => {
            const result = validateRfc('ABC 123456 A1');
            expect(result.valid).toBe(false);
            expect(result.errorCode).toBe('RFC_SPECIAL_CHARS');
        });
    });

    describe('Formato inválido', () => {
        test('retorna RFC_FORMAT_INVALID cuando 12 chars pero patrón incorrecto', () => {
            const result = validateRfc('123456789012');
            expect(result.valid).toBe(false);
            expect(result.errorCode).toBe('RFC_FORMAT_INVALID');
        });

        test('retorna RFC_FORMAT_INVALID cuando 13 chars pero comienza con números', () => {
            const result = validateRfc('1234ABCDEF012');
            expect(result.valid).toBe(false);
            expect(result.errorCode).toBe('RFC_FORMAT_INVALID');
        });
    });

    describe('RFC válido - Persona Moral (12 caracteres)', () => {
        test('acepta RFC de persona moral con formato correcto', () => {
            const result = validateRfc('ABC920101AB1');
            expect(result.valid).toBe(true);
            expect(result.errorCode).toBeNull();
        });

        test('acepta RFC con & (empresas)', () => {
            const result = validateRfc('A&C920101AB1');
            expect(result.valid).toBe(true);
            expect(result.errorCode).toBeNull();
        });
    });

    describe('RFC válido - Persona Física (13 caracteres)', () => {
        test('acepta RFC de persona física con formato correcto', () => {
            const result = validateRfc('GARC850101HN1');
            expect(result.valid).toBe(true);
            expect(result.errorCode).toBeNull();
        });

        test('acepta RFC con Ñ', () => {
            const result = validateRfc('MUÑZ850101AB2');
            expect(result.valid).toBe(true);
            expect(result.errorCode).toBeNull();
        });
    });

});
