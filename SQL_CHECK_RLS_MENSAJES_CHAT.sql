-- Verificar y corregir acceso a mensajes_chat

-- 1. Ver el estado de RLS en la tabla
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'mensajes_chat';

-- 2. Ver todas las políticas RLS actuales
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

-- 3. Si RLS está bloqueando, ejecuta esto para deshabilitarlo temporalmente:
-- ALTER TABLE mensajes_chat DISABLE ROW LEVEL SECURITY;

-- 4. Después de deshabilitarlo, prueba la app. Si funciona, los datos están ahí.
-- Entonces podemos crear políticas RLS apropiadas.

-- 5. Para reactivar RLS cuando tengas las políticas:
-- ALTER TABLE mensajes_chat ENABLE ROW LEVEL SECURITY;
