-- Diagnóstico de la tabla mensajes_chat

-- 1. Ver estructura de la tabla
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'mensajes_chat'
ORDER BY ordinal_position;

-- 2. Contar mensajes totales y por estado
SELECT 
  'Total mensajes' as descripcion,
  COUNT(*) as cantidad
FROM mensajes_chat
UNION ALL
SELECT 
  'Mensajes con asesor_id NULL',
  COUNT(*) 
FROM mensajes_chat 
WHERE asesor_id IS NULL
UNION ALL
SELECT 
  'Mensajes con asesor_id NO NULL',
  COUNT(*) 
FROM mensajes_chat 
WHERE asesor_id IS NOT NULL
UNION ALL
SELECT 
  'Mensajes con es_asesor = TRUE',
  COUNT(*) 
FROM mensajes_chat 
WHERE es_asesor = TRUE
UNION ALL
SELECT 
  'Mensajes con es_asesor = FALSE',
  COUNT(*) 
FROM mensajes_chat 
WHERE es_asesor = FALSE;

-- 3. Ver detalle de todos los mensajes
SELECT 
  id,
  contratacion_id,
  usuario_id,
  asesor_id,
  es_asesor,
  SUBSTRING(mensaje, 1, 50) as mensaje_preview,
  created_at
FROM mensajes_chat
ORDER BY created_at DESC
LIMIT 20;

-- 4. Ver contrataciones y si tienen asesor asignado
SELECT 
  c.id,
  c.usuario_id,
  c.asesor_id,
  COUNT(m.id) as cantidad_mensajes
FROM contrataciones c
LEFT JOIN mensajes_chat m ON c.id = m.contratacion_id
GROUP BY c.id, c.usuario_id, c.asesor_id
LIMIT 10;
