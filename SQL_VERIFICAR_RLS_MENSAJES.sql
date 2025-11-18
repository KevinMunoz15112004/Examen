-- Verificar y corregir políticas RLS en mensajes_chat

-- 1. Ver todas las políticas RLS actuales en mensajes_chat
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'mensajes_chat'
ORDER BY policyname;

-- 2. Si RLS está habilitado, deshabilitar temporalmente para pruebas
-- NOTA: Ejecuta esto solo si necesitas desactivar RLS
-- ALTER TABLE mensajes_chat DISABLE ROW LEVEL SECURITY;

-- 3. Si quieres reactivar RLS después:
-- ALTER TABLE mensajes_chat ENABLE ROW LEVEL SECURITY;

-- 4. Ver el estado de RLS en la tabla
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'mensajes_chat';
