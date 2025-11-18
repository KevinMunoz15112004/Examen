-- Hacer que usuario_id sea nullable en mensajes_chat
-- Esto permite que los asesores envíen mensajes sin usuario_id

-- 1. Modificar la columna usuario_id para que sea nullable
ALTER TABLE mensajes_chat
ALTER COLUMN usuario_id DROP NOT NULL;

-- 2. Verificar el cambio
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'mensajes_chat'
ORDER BY ordinal_position;

-- Ahora deberías poder insertar mensajes con usuario_id = NULL
