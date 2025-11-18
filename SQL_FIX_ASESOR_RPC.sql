-- ============================================
-- FIX: Obtener conversaciones para asesor sin usar auth.uid()
-- ============================================
-- El problema: El asesor se autentica desde tabla custom 'asesores', no desde auth.users
-- Por lo que auth.uid() siempre es NULL

-- Solución: Pasar el asesor_id como parámetro en lugar de usar auth.uid()

DROP FUNCTION IF EXISTS obtener_conversaciones_asesor(UUID);

CREATE OR REPLACE FUNCTION obtener_conversaciones_asesor(p_asesor_id UUID)
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
    c.id,
    c.usuario_id,
    COALESCE(p.full_name, 'Sin nombre')::TEXT,
    COALESCE(pm.nombre, 'Sin plan')::TEXT,
    (SELECT m.mensaje FROM mensajes_chat m 
     WHERE m.contratacion_id = c.id 
     ORDER BY m.created_at DESC LIMIT 1)::TEXT,
    (SELECT m.created_at FROM mensajes_chat m 
     WHERE m.contratacion_id = c.id 
     ORDER BY m.created_at DESC LIMIT 1),
    COALESCE((SELECT COUNT(*)::BIGINT FROM mensajes_chat m2
     WHERE m2.contratacion_id = c.id AND m2.leido = FALSE), 0),
    c.asesor_id
  FROM contrataciones c
  LEFT JOIN perfiles p ON c.usuario_id = p.user_id
  LEFT JOIN planes_moviles pm ON c.plan_id = pm.id
  WHERE c.asesor_id = p_asesor_id
  ORDER BY (SELECT m.created_at FROM mensajes_chat m 
     WHERE m.contratacion_id = c.id 
     ORDER BY m.created_at DESC LIMIT 1) DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION obtener_conversaciones_asesor(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION obtener_conversaciones_asesor(UUID) TO anon;
