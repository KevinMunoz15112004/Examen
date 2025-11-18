-- ============================================
-- Trigger para asignar asesor automáticamente
-- a nuevas contrataciones
-- ============================================

-- Función para asignar asesor automáticamente
CREATE OR REPLACE FUNCTION fn_assign_asesor_on_create()
RETURNS TRIGGER AS $$
DECLARE
  v_asesor_id UUID;
BEGIN
  -- Si no hay asesor asignado, asignar el que tenga menos contratos
  IF NEW.asesor_id IS NULL THEN
    SELECT u.id INTO v_asesor_id
    FROM auth.users u
    WHERE u.user_metadata->>'role' = 'asesor'
    LEFT JOIN contrataciones c ON u.id = c.asesor_id
    GROUP BY u.id
    ORDER BY COUNT(c.id) ASC, u.created_at ASC
    LIMIT 1;
    
    NEW.asesor_id := v_asesor_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger BEFORE INSERT en contrataciones
DROP TRIGGER IF EXISTS tr_assign_asesor_on_create ON contrataciones;
CREATE TRIGGER tr_assign_asesor_on_create
BEFORE INSERT ON contrataciones
FOR EACH ROW
EXECUTE FUNCTION fn_assign_asesor_on_create();

-- ============================================
-- Verificación: Asignar asesores a contrataciones existentes sin asesor
-- ============================================
UPDATE contrataciones
SET asesor_id = (
  SELECT u.id
  FROM auth.users u
  WHERE u.user_metadata->>'role' = 'asesor'
  LEFT JOIN contrataciones c ON u.id = c.asesor_id
  GROUP BY u.id
  ORDER BY COUNT(c.id) ASC, u.created_at ASC
  LIMIT 1
)
WHERE asesor_id IS NULL;

-- ============================================
-- Verificar resultado
-- ============================================
SELECT 
  COUNT(*) as total_contrataciones,
  COUNT(CASE WHEN asesor_id IS NOT NULL THEN 1 END) as con_asesor,
  COUNT(CASE WHEN asesor_id IS NULL THEN 1 END) as sin_asesor
FROM contrataciones;

-- Ver distribución de contratos por asesor
SELECT 
  u.email as asesor_email,
  COUNT(c.id) as cantidad_contratos
FROM auth.users u
LEFT JOIN contrataciones c ON u.id = c.asesor_id
WHERE u.user_metadata->>'role' = 'asesor'
GROUP BY u.id, u.email
ORDER BY cantidad_contratos DESC;
