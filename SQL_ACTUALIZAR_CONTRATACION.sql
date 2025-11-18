-- Función RPC para actualizar el estado de una contratación
-- Con SECURITY DEFINER para bypassear RLS

CREATE OR REPLACE FUNCTION actualizar_estado_contratacion(
  p_contratacion_id UUID,
  p_nuevo_estado VARCHAR
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated_count INT;
BEGIN
  -- Actualizar el estado de la contratación
  UPDATE public.contrataciones
  SET 
    estado = p_nuevo_estado,
    updated_at = NOW()
  WHERE id = p_contratacion_id;
  
  -- Obtener el número de filas afectadas
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  -- Retornar resultado
  RETURN json_build_object(
    'success', true,
    'message', 'Contratación actualizada correctamente',
    'rows_affected', v_updated_count,
    'contratacion_id', p_contratacion_id,
    'nuevo_estado', p_nuevo_estado
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM,
    'contratacion_id', p_contratacion_id
  );
END;
$$;

-- Dar permisos al rol de servicio
GRANT EXECUTE ON FUNCTION actualizar_estado_contratacion(UUID, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION actualizar_estado_contratacion(UUID, VARCHAR) TO anon;
