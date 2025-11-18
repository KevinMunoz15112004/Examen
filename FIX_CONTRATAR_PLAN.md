# 🚀 FIX: Contratación de Planes No Funciona

## ❌ El Problema

El usuario presiona "Contratar Ahora" pero:
- ✗ No sucede nada
- ✗ No aparece en "Mis Contrataciones"
- ✗ Sin errores visibles en la consola

## 🔍 Causa Raíz

La tabla `contrataciones` tiene **RLS (Row Level Security)** con una política muy restrictiva:

```sql
CREATE POLICY "Usuarios pueden crear contrataciones"
ON contrataciones FOR INSERT
WITH CHECK (usuario_id = auth.uid());
```

**El problema:** Esta política falla silenciosamente cuando se llama directamente desde el cliente Angular, aunque técnicamente `usuario_id` sea igual a `auth.uid()`.

## ✅ La Solución

Crear una función **SECURITY DEFINER** que bypass la RLS:
- Función: `crear_contratacion(p_usuario_id, p_plan_id, p_precio_mensual)`
- Bypassea RLS (se ejecuta con permisos del propietario)
- Retorna respuesta JSON con manejo de errores completo
- La llamamos via RPC desde Angular

---

## 📋 Pasos para Aplicar el Fix

### PASO 1: Ejecutar SQL en Supabase

1. Ve a tu proyecto en [supabase.com](https://supabase.com)
2. Click en **SQL Editor** → **New Query**
3. Copia **TODO ESTO**:

```sql
-- Crear función SECURITY DEFINER para crear contrataciones
CREATE OR REPLACE FUNCTION crear_contratacion(
  p_usuario_id UUID,
  p_plan_id UUID,
  p_precio_mensual DECIMAL
) RETURNS json AS $$
DECLARE
  v_contratacion_id UUID;
  v_error_msg TEXT;
BEGIN
  IF p_usuario_id IS NULL OR p_plan_id IS NULL OR p_precio_mensual IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Parámetros incompletos',
      'data', NULL
    );
  END IF;

  RAISE NOTICE 'Creando contratación para usuario_id: %, plan_id: %, precio: %', 
    p_usuario_id, p_plan_id, p_precio_mensual;

  INSERT INTO contrataciones (
    usuario_id,
    plan_id,
    estado,
    fecha_inicio,
    precio_mensual,
    created_at,
    updated_at
  ) VALUES (
    p_usuario_id,
    p_plan_id,
    'pendiente',
    NOW(),
    p_precio_mensual,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_contratacion_id;

  RETURN json_build_object(
    'success', true,
    'contratacion_id', v_contratacion_id,
    'message', 'Contratación creada exitosamente',
    'data', json_build_object(
      'id', v_contratacion_id,
      'usuario_id', p_usuario_id,
      'plan_id', p_plan_id,
      'estado', 'pendiente',
      'fecha_inicio', NOW(),
      'precio_mensual', p_precio_mensual
    )
  );

EXCEPTION WHEN OTHERS THEN
  v_error_msg := SQLERRM;
  RETURN json_build_object(
    'success', false,
    'error', v_error_msg,
    'data', NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Dar permiso a usuarios autenticados
GRANT EXECUTE ON FUNCTION crear_contratacion(UUID, UUID, DECIMAL) TO authenticated;
```

4. Ejecuta con **Ctrl + Enter**
5. Debes ver: ✅ **"Query executed successfully"**

### PASO 2: Limpiar Cache del Navegador

1. Presiona **Ctrl + Shift + Delete**
2. Selecciona "Borrar TODO"
3. Cierra y reabre el navegador

### PASO 3: Recargar Aplicación

- Presiona **Ctrl + F5** (fuerza recarga sin cache)

### PASO 4: Probar la Contratación

1. Login como usuario regular (no asesor)
2. Navega a un plan
3. Click **"Contratar Ahora"**
4. Confirma la contratación

### PASO 5: Verificar en Consola (F12)

Debes ver en Console:

```
📝 Creando contratación para usuario_id: [UUID del usuario]
RPC Response crear_contratacion: {error: null, data: {success: true, ...}, status: 200}
✅ Contratación creada exitosamente (Supabase wrapper)
```

### PASO 6: Verificar en la App

- ✅ Toast verde: "¡Contratación completada!"
- ✅ Redirige a "Mis Contrataciones"
- ✅ El plan aparece en la lista

---

## 🧪 Pruebas Adicionales

### Si aún falla, verifica:

1. **¿Existe el usuario en auth.users?**
   ```sql
   SELECT id, email FROM auth.users WHERE email LIKE '%@%';
   ```

2. **¿Existe el plan?**
   ```sql
   SELECT id, nombre, activo FROM planes_moviles 
   WHERE id = '[plan-id-que-intentas-contratar]';
   ```

3. **¿Se creó la función?**
   ```sql
   SELECT routine_name FROM information_schema.routines
   WHERE routine_name = 'crear_contratacion';
   ```

4. **¿Hay contrataciones en la BD?**
   ```sql
   SELECT * FROM contrataciones ORDER BY created_at DESC LIMIT 5;
   ```

---

## 📊 Flujo Completo (Visualizado)

```
USUARIO PRESIONA "CONTRATAR AHORA"
        ↓
plan-detail.page.ts: contratarPlan()
        ↓
contratacionesService.createContratacion()
        ↓
supabase.rpc('crear_contratacion', {...})
        ↓
SECURITY DEFINER function bypassea RLS
        ↓
INSERT en tabla contrataciones (SIN RLS blocks)
        ↓
Retorna JSON {success: true, contratacion_id: ...}
        ↓
Toast: "¡Contratación completada!"
        ↓
Navega a /mis-contrataciones
        ↓
contratacionesService.getContratacionesByUsuario()
        ↓
MOSTRAR CONTRATACIÓN EN LA LISTA ✅
```

---

## ⚠️ Si Recibís Errores

### Error: "function crear_contratacion does not exist"
- Asegúrate de ejecutar el SQL en Supabase
- Verifica que escribiste bien el nombre de la función

### Error: "insert or update on table contrataciones violates foreign key constraint"
- El plan_id no existe o el usuario_id no es válido
- Verifica que el plan existe y que el usuario está autenticado

### Error: "new row violates row-level security policy"
- La función no se ejecutó como SECURITY DEFINER
- Intenta crear la función de nuevo

---

## 🎯 Próximos Pasos

Después de confirmar que funciona la contratación:

1. ✅ Verify contrataciones appear en "Mis Contrataciones"
2. ⏭️ Test que asesores ven las contrataciones pendientes
3. ⏭️ Test que asesores pueden aprobar/rechazar
4. ⏭️ Test chat con asesor después de contratación

¡Avísame si el fix funcionó! 🚀
