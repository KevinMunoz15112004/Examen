-- Insertar mensajes de prueba con los asesores correctos

-- Primero, obtener un asesor existente
SELECT id, email, nombre FROM asesores LIMIT 1;

-- Obtener una contratación existente con asesor asignado
SELECT id, usuario_id, asesor_id FROM contrataciones WHERE asesor_id IS NOT NULL LIMIT 1;

-- Si los IDs anteriores no existen, puedes usar estos valores de ejemplo:
-- Reemplaza los valores entre comillas con los IDs reales de tu BD

-- OPCIÓN 1: Si tienes una contratación con asesor asignado
INSERT INTO mensajes_chat (contratacion_id, usuario_id, asesor_id, mensaje, leido, created_at)
VALUES 
  ('CONTRATACION_ID_AQUI', 'USUARIO_ID_AQUI', NULL, 'Hola, me interesa este plan de datos', FALSE, NOW()),
  ('CONTRATACION_ID_AQUI', NULL, 'ASESOR_ID_AQUI', 'Perfecto, te explico los detalles del plan', FALSE, NOW() + INTERVAL '1 minute'),
  ('CONTRATACION_ID_AQUI', 'USUARIO_ID_AQUI', NULL, '¿Cuál es el precio?', FALSE, NOW() + INTERVAL '2 minutes'),
  ('CONTRATACION_ID_AQUI', NULL, 'ASESOR_ID_AQUI', 'Es $50 mensuales con 10GB de datos', FALSE, NOW() + INTERVAL '3 minutes');

-- Verificar los mensajes insertados
SELECT 
  id,
  contratacion_id,
  usuario_id,
  asesor_id,
  SUBSTRING(mensaje, 1, 50) as mensaje_preview,
  created_at
FROM mensajes_chat
WHERE contratacion_id = 'CONTRATACION_ID_AQUI'
ORDER BY created_at ASC;
