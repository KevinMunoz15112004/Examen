-- ============================================
-- SIMPLE FIX: Permitir asesor_id NULL sin validación
-- ============================================
-- Problema: No hay asesores en tabla, el trigger falla
-- Solución: Remover constraint de foreign key, permitir NULL

-- Remover constraint de foreign key
ALTER TABLE contrataciones
DROP CONSTRAINT IF EXISTS contrataciones_asesor_id_fkey;

-- Recrear constraint como DEFERRABLE para permitir NULL
ALTER TABLE contrataciones
ADD CONSTRAINT contrataciones_asesor_id_fkey 
FOREIGN KEY (asesor_id) 
REFERENCES auth.users(id) 
ON DELETE SET NULL
DEFERRABLE INITIALLY DEFERRED;

-- ============================================
-- Simplificar trigger: Solo permitir NULL
-- ============================================
DROP TRIGGER IF EXISTS tr_assign_asesor_on_create ON contrataciones;
DROP FUNCTION IF EXISTS fn_assign_asesor_on_create();

-- Ya no necesitamos trigger complejo, dejar asesor_id NULL por defecto
-- Se asignará manualmente después

-- ============================================
-- Script para asignar asesores manualmente después
-- ============================================
-- Primero, obtener UUIDs de los asesores
SELECT 
  id,
  email,
  raw_user_meta_data->>'full_name' as nombre
FROM auth.users
WHERE raw_user_meta_data->>'role' = 'asesor'
LIMIT 10;

-- Después usar:
-- UPDATE contrataciones SET asesor_id = 'UUID-DEL-ASESOR' WHERE asesor_id IS NULL;
