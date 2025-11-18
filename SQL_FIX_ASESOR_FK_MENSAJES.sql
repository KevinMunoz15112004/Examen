-- Corregir la tabla mensajes_chat para que asesor_id apunte a la tabla asesores
-- en lugar de auth.users

-- Paso 1: Eliminar la restricción FK actual de asesor_id
ALTER TABLE mensajes_chat
DROP CONSTRAINT IF EXISTS mensajes_chat_asesor_id_fkey;

-- Paso 2: Agregar la nueva restricción FK que apunte a asesores
ALTER TABLE mensajes_chat
ADD CONSTRAINT mensajes_chat_asesor_id_fkey
FOREIGN KEY (asesor_id) 
REFERENCES asesores(id)
ON DELETE CASCADE;

-- Paso 3: Verificar que el cambio se aplicó
SELECT 
  tc.constraint_name, 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name 
JOIN information_schema.constraint_column_usage AS ccu 
  ON ccu.constraint_name = tc.constraint_name 
WHERE tc.table_name='mensajes_chat' AND kcu.column_name = 'asesor_id';
