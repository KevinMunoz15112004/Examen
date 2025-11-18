-- Insertar algunos mensajes de prueba para verificar que el chat funciona
-- Primero, obtener los IDs de una contratación existente y sus usuarios relacionados

-- Ver contrataciones existentes
SELECT id, usuario_id, asesor_id FROM contrataciones LIMIT 5;

-- Insertar mensajes de prueba (ajusta los IDs según lo que veas arriba)
-- Reemplaza los valores de contratacion_id, usuario_id y asesor_id con IDs reales

INSERT INTO mensajes_chat (contratacion_id, usuario_id, asesor_id, mensaje, leido, es_asesor, created_at)
VALUES 
  ('REPLACE_WITH_CONTRATACION_ID', 'REPLACE_WITH_USUARIO_ID', NULL, 'Hola, quisiera saber más sobre este plan', FALSE, FALSE, NOW()),
  ('REPLACE_WITH_CONTRATACION_ID', NULL, 'REPLACE_WITH_ASESOR_ID', 'Claro, con gusto te ayudo. ¿Qué necesitas saber?', FALSE, TRUE, NOW() + INTERVAL '1 minute'),
  ('REPLACE_WITH_CONTRATACION_ID', 'REPLACE_WITH_USUARIO_ID', NULL, '¿Cuál es el costo mensual?', FALSE, FALSE, NOW() + INTERVAL '2 minutes'),
  ('REPLACE_WITH_CONTRATACION_ID', NULL, 'REPLACE_WITH_ASESOR_ID', 'El costo es de $50 mensuales', FALSE, TRUE, NOW() + INTERVAL '3 minutes');

-- Verificar que los mensajes se insertaron
SELECT * FROM mensajes_chat WHERE contratacion_id = 'REPLACE_WITH_CONTRATACION_ID' ORDER BY created_at ASC;
