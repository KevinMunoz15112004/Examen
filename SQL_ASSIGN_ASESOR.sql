-- ============================================
-- Script para asignar asesores a contrataciones
-- ============================================

-- Paso 1: Ver los asesores disponibles
SELECT id, email, user_metadata->>'full_name' as nombre
FROM auth.users
WHERE user_metadata->>'role' = 'asesor'
LIMIT 10;

-- Paso 2: Ver las contrataciones sin asesor
SELECT id, usuario_id, estado, created_at
FROM contrataciones
WHERE asesor_id IS NULL
LIMIT 10;

-- Paso 3: Asignar el PRIMER asesor a TODAS las contrataciones sin asesor
UPDATE contrataciones
SET asesor_id = (
  SELECT id FROM auth.users
  WHERE user_metadata->>'role' = 'asesor'
  ORDER BY created_at ASC
  LIMIT 1
)
WHERE asesor_id IS NULL;

-- Paso 4: Verificar que se asignaron
SELECT 
  c.id,
  c.usuario_id,
  c.estado,
  c.asesor_id,
  u.email as asesor_email
FROM contrataciones c
LEFT JOIN auth.users u ON c.asesor_id = u.id
ORDER BY c.created_at DESC
LIMIT 10;
