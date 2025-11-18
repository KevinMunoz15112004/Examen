# ⚡ ACCIONES INMEDIATAS - Contratar Plan No Funciona

## 🎯 TODO en 5 Minutos

### 1️⃣ EJECUTAR SQL (2 min)

Abre: https://supabase.com → Tu Proyecto → SQL Editor → New Query

Copia y pega TODO esto:

```sql
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

GRANT EXECUTE ON FUNCTION crear_contratacion(UUID, UUID, DECIMAL) TO authenticated;
```

Click: **RUN** o **Ctrl + Enter**

Resultado esperado: ✅ **Query executed successfully**

---

### 2️⃣ LIMPIAR CACHE (1 min)

- Presiona: **Ctrl + Shift + Delete**
- Selecciona: "Borrar TODO"
- Cierra navegador completamente
- Reabre navegador

---

### 3️⃣ RECARGAR APP (1 min)

- Abre tu app Ionic
- Presiona: **Ctrl + F5** (fuerza recarga)

---

### 4️⃣ PROBAR (1 min)

1. Login como usuario normal (no asesor)
2. Navega a un plan
3. Click: **"Contratar Ahora"**
4. Confirma el diálogo
5. ✅ Deberías ver Toast verde: "¡Contratación completada!"
6. ✅ Te redirige a "Mis Contrataciones"

---

### 5️⃣ VERIFICAR EN CONSOLA (30 seg)

Abre: **F12** → **Console**

Busca este log:
```
📝 Creando contratación para usuario_id: ...
RPC Response crear_contratacion: {error: null, data: {success: true, ...}, status: 200}
✅ Contratación creada exitosamente (Supabase wrapper)
```

Si lo ves, ¡funciona! 🎉

---

## ✅ Si Funciona

- ✅ El plan aparece en "Mis Contrataciones"
- ✅ Estado es "pendiente"
- ✅ Puedes ver detalles (precio, plan, etc)

**SIGUIENTE PASO:** Asegúrate que:
- Asesor puede ver contrataciones pendientes
- Asesor puede aprobar/rechazar
- Usuario puede chatear con asesor

---

## ❌ Si NO Funciona

### Verifica que ejecutaste SQL correctamente:

En Supabase → SQL Editor:
```sql
SELECT routine_name FROM information_schema.routines
WHERE routine_name = 'crear_contratacion';
```

Debes ver **1 fila** con `crear_contratacion`

---

### Si ves error en consola:

Captura el **error exacto** de F12 → Console y comparte:
```
❌ [Error message aquí]
```

---

## 📚 Para Más Detalles

Lee estos archivos en orden:

1. `FIX_CONTRATAR_PLAN.md` - Explicación completa
2. `RESUMEN_FIX_CONTRATACION.md` - Diagrama y análisis
3. `SQL_FIX_CREAR_CONTRATACION.sql` - Script SQL puro

---

¡Éxito! 🚀
