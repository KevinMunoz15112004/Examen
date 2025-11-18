-- ============================================
-- Script para asignar asesor a contrataciones
-- ============================================

-- PASO 1: Ver los asesores disponibles
SELECT 
  id as asesor_uuid,
  email,
  raw_user_meta_data->>'full_name' as nombre
FROM auth.users
WHERE raw_user_meta_data->>'role' = 'asesor'
ORDER BY created_at ASC;

-- PASO 2: Asignar el PRIMER asesor a todas las contrataciones sin asesor
-- (Reemplaza 'UUID-DEL-ASESOR' con el UUID que viste en el PASO 1)
UPDATE contrataciones
SET asesor_id = (
  SELECT id FROM auth.users
  WHERE raw_user_meta_data->>'role' = 'asesor'
  ORDER BY created_at ASC
  LIMIT 1
)
WHERE asesor_id IS NULL;

-- PASO 3: Verificar que se asignaron correctamente
SELECT 
  COUNT(*) as total_contrataciones,
  COUNT(CASE WHEN asesor_id IS NOT NULL THEN 1 END) as con_asesor,
  COUNT(CASE WHEN asesor_id IS NULL THEN 1 END) as sin_asesor
FROM contrataciones;

-- PASO 4: Ver distribución
SELECT 
  c.asesor_id,
  u.email as asesor_email,
  COUNT(c.id) as cantidad_contratos
FROM contrataciones c
LEFT JOIN auth.users u ON c.asesor_id = u.id
GROUP BY c.asesor_id, u.email
ORDER BY cantidad_contratos DESC;
