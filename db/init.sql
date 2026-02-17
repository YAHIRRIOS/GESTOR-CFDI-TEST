-- 1. Tabla: catalogo_errores
CREATE TABLE IF NOT EXISTS catalogo_errores (
    id          SERIAL PRIMARY KEY,
    codigo      VARCHAR(50) UNIQUE NOT NULL,
    descripcion TEXT NOT NULL
);

-- Seed de errores conocidos
INSERT INTO catalogo_errores (codigo, descripcion) VALUES
    ('RFC_EMPTY',           'El RFC está vacío o es nulo'),
    ('RFC_LENGTH_INVALID',  'El RFC no tiene 12 o 13 caracteres'),
    ('RFC_SPECIAL_CHARS',   'El RFC contiene caracteres especiales no permitidos'),
    ('RFC_FORMAT_INVALID',  'El RFC no cumple con el patrón oficial (3-4 letras + 6 dígitos + 3 alfanuméricos)')
ON CONFLICT (codigo) DO NOTHING;

-- 2. Tabla: transacciones
CREATE TABLE IF NOT EXISTS transacciones (
    id                  SERIAL PRIMARY KEY,
    folio               VARCHAR(100) NOT NULL,
    rfc_emisor          VARCHAR(100),
    rfc_receptor        VARCHAR(100),
    monto               NUMERIC(15, 2) NOT NULL DEFAULT 0,
    estatus             VARCHAR(50) NOT NULL DEFAULT 'Vigente',
    rfc_emisor_valido   BOOLEAN NOT NULL DEFAULT TRUE,
    rfc_receptor_valido BOOLEAN NOT NULL DEFAULT TRUE,
    error_emisor_code   VARCHAR(50) REFERENCES catalogo_errores(codigo),
    error_receptor_code VARCHAR(50) REFERENCES catalogo_errores(codigo),
    nivel_prioridad     VARCHAR(10) NOT NULL DEFAULT 'Normal',
    created_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 3. Stored Procedure: sp_insert_transaccion
--    Calcula el Nivel de Prioridad antes de insertar
CREATE OR REPLACE FUNCTION sp_insert_transaccion(
    p_folio               VARCHAR,
    p_rfc_emisor          VARCHAR,
    p_rfc_receptor        VARCHAR,
    p_monto               NUMERIC,
    p_estatus             VARCHAR,
    p_rfc_emisor_valido   BOOLEAN,
    p_rfc_receptor_valido BOOLEAN,
    p_error_emisor_code   VARCHAR,
    p_error_receptor_code VARCHAR
)
RETURNS TABLE(id INT, nivel_prioridad VARCHAR) AS $$
DECLARE
    v_prioridad VARCHAR(10);
    v_id        INT;
BEGIN
    -- Lógica de negocio: Monto > 50,000 MXN → "Alta", de lo contrario "Normal"
    IF p_monto > 50000 THEN
        v_prioridad := 'Alta';
    ELSE
        v_prioridad := 'Normal';
    END IF;

    INSERT INTO transacciones (
        folio, rfc_emisor, rfc_receptor, monto, estatus,
        rfc_emisor_valido, rfc_receptor_valido,
        error_emisor_code, error_receptor_code,
        nivel_prioridad
    ) VALUES (
        p_folio, p_rfc_emisor, p_rfc_receptor, p_monto, p_estatus,
        p_rfc_emisor_valido, p_rfc_receptor_valido,
        NULLIF(p_error_emisor_code, ''), NULLIF(p_error_receptor_code, ''),
        v_prioridad
    )
    RETURNING transacciones.id, transacciones.nivel_prioridad
    INTO v_id, v_prioridad;

    RETURN QUERY SELECT v_id, v_prioridad;
END;
$$ LANGUAGE plpgsql;

-- 4. Vista: vw_transacciones_errores
--    Une transacciones con su catálogo de errores
CREATE OR REPLACE VIEW vw_transacciones_errores AS
SELECT
    t.id,
    t.folio,
    t.rfc_emisor,
    t.rfc_receptor,
    t.monto,
    t.estatus,
    t.rfc_emisor_valido,
    t.rfc_receptor_valido,
    t.nivel_prioridad,
    t.created_at,
    ce_e.codigo      AS error_emisor_codigo,
    ce_e.descripcion AS error_emisor_descripcion,
    ce_r.codigo      AS error_receptor_codigo,
    ce_r.descripcion AS error_receptor_descripcion
FROM transacciones t
LEFT JOIN catalogo_errores ce_e ON t.error_emisor_code = ce_e.codigo
LEFT JOIN catalogo_errores ce_r ON t.error_receptor_code = ce_r.codigo;
