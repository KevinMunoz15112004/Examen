-- ============================================
-- FIX: Trigger para asignar asesor sin acceder a auth.users
-- ============================================
-- Problema: No se puede acceder a auth.users desde PL/pgSQL
-- Solución: Usar una tabla intermedia o buscar por otro método

-- Opción 1: Crear tabla de asesores para facilitar búsquedas
CREATE TABLE IF NOT EXISTS asesores (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  nombre TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índice
CREATE INDEX IF NOT EXISTS idx_asesores_id ON asesores(id);

-- ============================================
-- Actualizar función trigger
-- ============================================
DROP FUNCTION IF EXISTS fn_assign_asesor_on_create();

CREATE OR REPLACE FUNCTION fn_assign_asesor_on_create()
RETURNS TRIGGER AS $$
DECLARE
  v_asesor_id UUID;
BEGIN
  -- Si no hay asesor asignado, asignar el que tenga menos contratos
  IF NEW.asesor_id IS NULL THEN
    SELECT a.id INTO v_asesor_id
    FROM asesores a
    LEFT JOIN contrataciones c ON a.id = c.asesor_id
    GROUP BY a.id
    ORDER BY COUNT(c.id) ASC, a.created_at ASC
    LIMIT 1;
    
    NEW.asesor_id := v_asesor_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recriar trigger
DROP TRIGGER IF EXISTS tr_assign_asesor_on_create ON contrataciones;
CREATE TRIGGER tr_assign_asesor_on_create
BEFORE INSERT ON contrataciones
FOR EACH ROW
EXECUTE FUNCTION fn_assign_asesor_on_create();

-- ============================================
-- Llenar tabla asesores desde auth.users (ejecutar manualmente)
-- ============================================
-- Este query necesita ser ejecutado por alguien con acceso a auth.users
-- Por ahora, insertar manualmente los UUIDs de los asesores

-- Verificar si hay asesores
SELECT COUNT(*) as cantidad_asesores FROM asesores;

-- Verificar asesores disponibles
SELECT * FROM asesores;
