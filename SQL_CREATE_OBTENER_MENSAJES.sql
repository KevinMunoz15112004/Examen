-- Crear función RPC para obtener mensajes de una contratación
-- Esta función bypassa las políticas RLS para que ambos usuarios y asesores puedan ver los mensajes

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

-- Dar permisos de ejecución a usuarios anónimos y autenticados
GRANT EXECUTE ON FUNCTION obtener_mensajes_contratacion(UUID) TO anon, authenticated;
