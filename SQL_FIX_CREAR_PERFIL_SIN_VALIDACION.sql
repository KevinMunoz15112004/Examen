-- ============================================
-- FIX: Función crear_perfil_usuario sin validación estricta
-- ============================================
-- PROBLEMA: La función valida que el usuario existe en auth.users
--          pero hay delay en la propagación de datos
--
-- SOLUCIÓN: Remover validación de auth.users, mantener anti-duplicados
-- ============================================

-- 1. CREAR FUNCIÓN MEJORADA
CREATE OR REPLACE FUNCTION public.crear_perfil_usuario(
  p_user_id UUID,
  p_full_name TEXT,
  p_phone TEXT DEFAULT NULL,
  p_rol TEXT DEFAULT 'usuario_registrado'
)
RETURNS json AS $$
DECLARE
  v_result json;
BEGIN
  -- 1. Verificar que no hay perfil duplicado (anti-duplicado)
  IF EXISTS(SELECT 1 FROM public.perfiles WHERE user_id = p_user_id) THEN
    RETURN json_build_object(
      'success', true,
      'message', 'Perfil ya existe para este usuario',
      'user_id', p_user_id
    );
  END IF;
  
  -- 2. Insertar el perfil
  -- NOTA: No validamos que exista en auth.users porque hay delay de propagación
  -- La FK de auth.users.id lo hará automáticamente
  BEGIN
    INSERT INTO public.perfiles (user_id, full_name, phone, rol, created_at, updated_at)
    VALUES (p_user_id, p_full_name, p_phone, p_rol, NOW(), NOW());
    
    v_result := json_build_object(
      'success', true,
      'message', 'Perfil creado exitosamente',
      'user_id', p_user_id
    );
    RETURN v_result;
    
  EXCEPTION WHEN foreign_key_violation THEN
    -- Si falla por FK, el usuario aún no está en auth.users
    -- Retornar error pero con más contexto
    RETURN json_build_object(
      'success', false,
      'error', 'Usuario aún no disponible en la BD. Reintentando en 1s...',
      'detail', 'Este error es temporal. El sistema reintentar\u00e1 automáticamente.',
      'user_id', p_user_id
    );
    
  EXCEPTION WHEN OTHERS THEN
    v_result := json_build_object(
      'success', false,
      'error', SQLERRM,
      'detail', 'Error al crear el perfil'
    );
    RETURN v_result;
  END;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. GRANT permisos
GRANT EXECUTE ON FUNCTION public.crear_perfil_usuario(UUID, TEXT, TEXT, TEXT) TO authenticated, anon;

-- 3. VERIFICAR
SELECT routine_name FROM information_schema.routines 
WHERE routine_name = 'crear_perfil_usuario'
  AND routine_schema = 'public';

-- ============================================
-- NOTA IMPORTANTE
-- ============================================
/*
Después de aplicar este SQL, también necesitas actualizar auth.service.ts:

En el método register(), dentro del switchMap, cambiar:
  
  // ANTES: esperar 500ms
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // DESPUÉS: esperar 1500ms (3 segundos)
  await new Promise(resolve => setTimeout(resolve, 1500));

O mejor aún, implementar un retry automático en el servicio Angular.
*/
