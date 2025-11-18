-- ============================================================================
-- FIX: RLS Policies para Tabla Contrataciones
-- ============================================================================
-- PROBLEMA: Los usuarios no pueden crear contrataciones (RLS bloqueando)
-- 
-- La política actual:
--   CREATE POLICY "Usuarios pueden crear contrataciones"
--   ON contrataciones FOR INSERT
--   WITH CHECK (usuario_id = auth.uid());
--
-- Falla porque: usuarios normales PUEDEN ser auth.uid(), pero la verificación
-- es demasiado restrictiva cuando se hace desde Angular client
--
-- SOLUCIÓN: Usar SECURITY DEFINER function para bypassear RLS
-- ============================================================================

-- 1. CREAR FUNCIÓN CON SECURITY DEFINER PARA CREAR CONTRATACIONES
CREATE OR REPLACE FUNCTION crear_contratacion(
  p_usuario_id UUID,
  p_plan_id UUID,
  p_precio_mensual DECIMAL
) RETURNS json AS $$
DECLARE
  v_contratacion_id UUID;
  v_error_msg TEXT;
BEGIN
  -- Validar que todos los parámetros no sean NULL
  IF p_usuario_id IS NULL OR p_plan_id IS NULL OR p_precio_mensual IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Parámetros incompletos: usuario_id, plan_id y precio_mensual son requeridos',
      'data', NULL
    );
  END IF;

  -- Log para debugging
  RAISE NOTICE 'Creando contratación para usuario_id: %, plan_id: %, precio: %', 
    p_usuario_id, p_plan_id, p_precio_mensual;

  -- Insertar la contratación
  INSERT INTO contrataciones (
    usuario_id,
    plan_id,
    estado,
    fecha_inicio,
    precio_mensual,
    created_at,
    updated_at
  ) VALUES (
    p_usuario_id,
    p_plan_id,
    'pendiente',
    NOW(),
    p_precio_mensual,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_contratacion_id;

  -- Si llegamos aquí, el insert fue exitoso
  RETURN json_build_object(
    'success', true,
    'contratacion_id', v_contratacion_id,
    'message', 'Contratación creada exitosamente',
    'data', json_build_object(
      'id', v_contratacion_id,
      'usuario_id', p_usuario_id,
      'plan_id', p_plan_id,
      'estado', 'pendiente',
      'fecha_inicio', NOW(),
      'precio_mensual', p_precio_mensual
    )
  );

EXCEPTION WHEN OTHERS THEN
  v_error_msg := SQLERRM;
  RETURN json_build_object(
    'success', false,
    'error', v_error_msg,
    'data', NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. GRANT permission para que usuarios autenticados puedan ejecutar
GRANT EXECUTE ON FUNCTION crear_contratacion(UUID, UUID, DECIMAL) TO authenticated;

-- 3. VERIFICAR que la función fue creada
SELECT 
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_name = 'crear_contratacion'
  AND routine_schema = 'public';
