-- SOLUCIÓN RECOMENDADA: Usar RPC con SECURITY DEFINER para bypass de RLS
-- Esto es más seguro y flexible que las políticas RLS directas

-- 1. Primero, deshabilita RLS si la habilitaste antes
ALTER TABLE mensajes_chat DISABLE ROW LEVEL SECURITY;

-- 2. Crear función RPC para obtener mensajes de una contratación (para todos)
CREATE OR REPLACE FUNCTION obtener_mensajes_contratacion(p_contratacion_id UUID)
RETURNS TABLE (
  id UUID,
  contratacion_id UUID,
  usuario_id UUID,
  asesor_id UUID,
  mensaje TEXT,
  leido BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id,
    contratacion_id,
    usuario_id,
    asesor_id,
    mensaje,
    leido,
    created_at
  FROM mensajes_chat
  WHERE contratacion_id = p_contratacion_id
  ORDER BY created_at ASC;
$$;

-- 3. Dar permisos de ejecución
GRANT EXECUTE ON FUNCTION obtener_mensajes_contratacion(UUID) TO anon, authenticated;

-- 4. Crear función RPC para insertar mensajes (para usuarios)
CREATE OR REPLACE FUNCTION insertar_mensaje_usuario(
  p_contratacion_id UUID,
  p_usuario_id UUID,
  p_mensaje TEXT
)
RETURNS TABLE (
  id UUID,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO mensajes_chat (
    contratacion_id,
    usuario_id,
    asesor_id,
    mensaje,
    leido,
    created_at
  )
  VALUES (
    p_contratacion_id,
    p_usuario_id,
    NULL,
    p_mensaje,
    FALSE,
    NOW()
  )
  RETURNING id, created_at;
$$;

GRANT EXECUTE ON FUNCTION insertar_mensaje_usuario(UUID, UUID, TEXT) TO anon, authenticated;

-- 5. Crear función RPC para insertar mensajes (para asesores)
CREATE OR REPLACE FUNCTION insertar_mensaje_asesor(
  p_contratacion_id UUID,
  p_asesor_id UUID,
  p_mensaje TEXT
)
RETURNS TABLE (
  id UUID,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO mensajes_chat (
    contratacion_id,
    usuario_id,
    asesor_id,
    mensaje,
    leido,
    created_at
  )
  VALUES (
    p_contratacion_id,
    NULL,
    p_asesor_id,
    p_mensaje,
    FALSE,
    NOW()
  )
  RETURNING id, created_at;
$$;

GRANT EXECUTE ON FUNCTION insertar_mensaje_asesor(UUID, UUID, TEXT) TO anon, authenticated;

-- Verificar que las funciones fueron creadas
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public' 
AND routine_name LIKE 'obtener_mensajes%'
OR routine_name LIKE 'insertar_mensaje%'
ORDER BY routine_name;
