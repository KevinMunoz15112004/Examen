-- ============================================
-- ASIGNAR ASESOR A CONTRATACIONES
-- ============================================
-- Este script asigna un asesor a las contrataciones que no lo tienen

-- Primero, verificar cuántos asesores activos hay
SELECT 'Asesores activos:' as info;
SELECT id, nombre, email FROM asesores WHERE activo = true;

-- Seleccionar el primer asesor activo para asignarlo
-- (Si hay múltiples, puedes modificar la lógica)

UPDATE contrataciones
SET asesor_id = (
  SELECT id FROM asesores 
  WHERE activo = true 
  LIMIT 1
)
WHERE asesor_id IS NULL
  AND estado IN ('pendiente', 'activa', 'cancelada');

-- Verificar el resultado
SELECT 'Contrataciones asignadas:' as info;
SELECT 
  id,
  usuario_id,
  estado,
  asesor_id,
  created_at
FROM contrataciones
WHERE asesor_id IS NOT NULL
ORDER BY created_at DESC;

-- Contar por estado
SELECT 
  estado,
  COUNT(*) as cantidad,
  COUNT(DISTINCT asesor_id) as asesores_distintos
FROM contrataciones
WHERE asesor_id IS NOT NULL
GROUP BY estado;
