-- ============================================
-- DIAGNÓSTICO: Verificar estado de contrataciones
-- ============================================

-- Primero, verificar cuántos asesores hay
SELECT 'Asesores en tabla asesores:' as diagnostic;
SELECT id, nombre, email, activo FROM asesores LIMIT 10;

-- Verificar el asesor específico
SELECT 'Asesor específico:' as diagnostic;
SELECT id, nombre, email, activo FROM asesores 
WHERE id = '288a2743-12b2-4c5f-bb0c-17792e07c346';

-- Verificar contrataciones del asesor
SELECT 'Contrataciones asignadas al asesor:' as diagnostic;
SELECT 
  c.id,
  c.usuario_id,
  c.plan_id,
  c.estado,
  c.asesor_id,
  c.created_at
FROM contrataciones c
WHERE c.asesor_id = '288a2743-12b2-4c5f-bb0c-17792e07c346';

-- Verificar todas las contrataciones para ver cuáles tienen asesor
SELECT 'Todas las contrataciones con estado y asesor:' as diagnostic;
SELECT 
  id,
  usuario_id,
  plan_id,
  estado,
  asesor_id,
  created_at
FROM contrataciones
ORDER BY created_at DESC LIMIT 20;

-- Verificar total de contrataciones sin asesor
SELECT 'Contrataciones SIN asesor asignado:' as diagnostic;
SELECT COUNT(*) as sin_asesor
FROM contrataciones
WHERE asesor_id IS NULL;

-- Verificar total de contrataciones CON asesor
SELECT 'Contrataciones CON asesor asignado:' as diagnostic;
SELECT COUNT(*) as con_asesor
FROM contrataciones
WHERE asesor_id IS NOT NULL;
