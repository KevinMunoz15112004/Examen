-- ============================================
-- FIX: Agregar asesor_id a contrataciones
-- ============================================
-- Problema: Los asesores no pueden ver mensajes porque no hay forma
-- de saber cuáles contrataciones les pertenecen. La tabla mensajes_chat
-- tiene asesor_id pero contrataciones no.
--
-- Solución: 
-- 1. Agregar asesor_id nullable a contrataciones
-- 2. Crear función RPC para que asesores carguen sus mensajes

-- ============================================
-- PASO 1: Agregar columna asesor_id a contrataciones
-- ============================================
ALTER TABLE contrataciones
ADD COLUMN IF NOT EXISTS asesor_id UUID 
REFERENCES auth.users(id) ON DELETE SET NULL;

-- Comentario explicativo
COMMENT ON COLUMN contrataciones.asesor_id IS 'UUID del asesor asignado. NULL si no hay asesor asignado aún.';

-- Crear índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_contrataciones_asesor_id ON contrataciones(asesor_id);

-- ============================================
-- PASO 2: Actualizar mensajes_chat para usar asesor de contrataciones
-- ============================================
-- Crear trigger para auto-llenar asesor_id en mensajes desde contrataciones
CREATE OR REPLACE FUNCTION fn_sync_asesor_to_mensaje()
RETURNS TRIGGER AS $$
BEGIN
  -- Si asesor_id no está especificado, tomar del contrato
  IF NEW.asesor_id IS NULL THEN
    SELECT asesor_id INTO NEW.asesor_id
    FROM contrataciones
    WHERE id = NEW.contratacion_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger
DROP TRIGGER IF EXISTS tr_sync_asesor_to_mensaje ON mensajes_chat;
CREATE TRIGGER tr_sync_asesor_to_mensaje
BEFORE INSERT ON mensajes_chat
FOR EACH ROW
EXECUTE FUNCTION fn_sync_asesor_to_mensaje();

-- ============================================
-- PASO 3: Función RPC para que asesores carguen mensajes
-- ============================================
CREATE OR REPLACE FUNCTION obtener_mensajes_como_asesor()
RETURNS TABLE (
  id UUID,
  contratacion_id UUID,
  usuario_id UUID,
  asesor_id UUID,
  mensaje TEXT,
  leido BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  usuario_nombre TEXT,
  estado_contrato VARCHAR(50)
) AS $$
BEGIN
  -- El asesor solo ve mensajes de sus contrataciones
  RETURN QUERY
  SELECT 
    m.id,
    m.contratacion_id,
    m.usuario_id,
    m.asesor_id,
    m.mensaje,
    m.leido,
    m.created_at,
    p.full_name as usuario_nombre,
    c.estado as estado_contrato
  FROM mensajes_chat m
  JOIN contrataciones c ON m.contratacion_id = c.id
  JOIN perfiles p ON m.usuario_id = p.user_id
  WHERE c.asesor_id = auth.uid()
    OR m.asesor_id = auth.uid()
  ORDER BY m.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Dar permisos
GRANT EXECUTE ON FUNCTION obtener_mensajes_como_asesor() TO authenticated;

-- ============================================
-- PASO 4: Función para obtener conversaciones del asesor
-- ============================================
CREATE OR REPLACE FUNCTION obtener_conversaciones_asesor()
RETURNS TABLE (
  contratacion_id UUID,
  usuario_id UUID,
  usuario_nombre TEXT,
  plan_nombre TEXT,
  ultimo_mensaje TEXT,
  timestamp_ultimo TIMESTAMP WITH TIME ZONE,
  no_leidos BIGINT,
  asesor_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as contratacion_id,
    c.usuario_id,
    p.full_name as usuario_nombre,
    pm.nombre as plan_nombre,
    (SELECT m.mensaje FROM mensajes_chat m 
     WHERE m.contratacion_id = c.id 
     ORDER BY m.created_at DESC LIMIT 1) as ultimo_mensaje,
    (SELECT m.created_at FROM mensajes_chat m 
     WHERE m.contratacion_id = c.id 
     ORDER BY m.created_at DESC LIMIT 1) as timestamp_ultimo,
    (SELECT COUNT(*) FROM mensajes_chat 
     WHERE contratacion_id = c.id AND leido = FALSE) as no_leidos,
    c.asesor_id
  FROM contrataciones c
  LEFT JOIN perfiles p ON c.usuario_id = p.user_id
  LEFT JOIN planes_moviles pm ON c.plan_id = pm.id
  WHERE c.asesor_id = auth.uid()
  ORDER BY timestamp_ultimo DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Dar permisos
GRANT EXECUTE ON FUNCTION obtener_conversaciones_asesor() TO authenticated;

-- ============================================
-- PASO 5: Actualizar RLS para mensajes_chat
-- ============================================
-- Los asesores pueden ver mensajes de sus contrataciones
DROP POLICY IF EXISTS "Asesores ven mensajes de sus contrataciones" ON mensajes_chat;
CREATE POLICY "Asesores ven mensajes de sus contrataciones"
ON mensajes_chat FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM contrataciones c
    WHERE c.id = contratacion_id AND c.asesor_id = auth.uid()
  )
  OR
  asesor_id = auth.uid()
);

-- Los usuarios ven mensajes de sus contrataciones
DROP POLICY IF EXISTS "Usuarios ven mensajes de sus contrataciones" ON mensajes_chat;
CREATE POLICY "Usuarios ven mensajes de sus contrataciones"
ON mensajes_chat FOR SELECT
USING (usuario_id = auth.uid());

-- Cualquiera puede insertar mensajes en sus contrataciones
DROP POLICY IF EXISTS "Insertar mensajes en contrataciones propias" ON mensajes_chat;
CREATE POLICY "Insertar mensajes en contrataciones propias"
ON mensajes_chat FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM contrataciones c
    WHERE c.id = contratacion_id 
      AND (c.usuario_id = auth.uid() OR c.asesor_id = auth.uid())
  )
);

-- ============================================
-- Verificación
-- ============================================
-- Para verificar:
-- 1. Que la columna existe:
--    SELECT column_name, is_nullable FROM information_schema.columns 
--    WHERE table_name = 'contrataciones' AND column_name = 'asesor_id';
--
-- 2. Que las funciones existen:
--    SELECT routine_name FROM information_schema.routines 
--    WHERE routine_schema = 'public' AND routine_type = 'FUNCTION';
