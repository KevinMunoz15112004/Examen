-- ============================================
-- FIX: Hacer asesor_id NULLABLE en mensajes_chat
-- ============================================
-- Problema: Cuando el usuario inicia un chat y no hay asesor asignado,
-- asesor_id es NULL, pero la columna tiene constraint NOT NULL
-- 
-- Solución: Permitir NULL en asesor_id para soportar mensajes sin asesor asignado

-- 1. Modificar la columna para permitir NULL
ALTER TABLE mensajes_chat
ALTER COLUMN asesor_id DROP NOT NULL;

-- 2. (Opcional) Agregar un comentario explicativo
COMMENT ON COLUMN mensajes_chat.asesor_id IS 'UUID del asesor. NULL si el asesor aún no está asignado.';

-- ============================================
-- Verificación
-- ============================================
-- Para verificar que se aplicó correctamente, ejecuta:
-- SELECT column_name, is_nullable, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'mensajes_chat' AND column_name = 'asesor_id';
-- Debe mostrar: is_nullable = 'YES'
