-- ============================================
-- FIX: Corregir errores de columnas ambiguas
-- ============================================
-- Este SQL reemplaza las funciones RPC con columnas calificadas correctamente

-- ============================================
-- Corregir: obtener_conversaciones_asesor
-- ============================================
DROP FUNCTION IF EXISTS obtener_conversaciones_asesor();

CREATE OR REPLACE FUNCTION obtener_conversaciones_asesor()
RETURNS TABLE (
  contratacion_id UUID,
  usuario_id UUID,
  usuario_nombre TEXT,
  plan_nombre VARCHAR(255),
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
    (SELECT COUNT(*)::BIGINT FROM mensajes_chat m2
     WHERE m2.contratacion_id = c.id AND m2.leido = FALSE) as no_leidos,
    c.asesor_id
  FROM contrataciones c
  LEFT JOIN perfiles p ON c.usuario_id = p.user_id
  LEFT JOIN planes_moviles pm ON c.plan_id = pm.id
  WHERE c.asesor_id = auth.uid()
  ORDER BY timestamp_ultimo DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION obtener_conversaciones_asesor() TO authenticated;

-- ============================================
-- Corregir: obtener_mensajes_como_asesor
-- ============================================
DROP FUNCTION IF EXISTS obtener_mensajes_como_asesor();

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
  estado_contrato TEXT
) AS $$
BEGIN
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

GRANT EXECUTE ON FUNCTION obtener_mensajes_como_asesor() TO authenticated;
