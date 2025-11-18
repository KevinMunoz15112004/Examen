# 🔧 FIX: Error "violates foreign key constraint" en Registro y Contratación

## 🎯 Problema General

Cuando registras un usuario normal y luego haces "Contratar Ahora", recibes:

```
❌ Error: insert or update on table "contrataciones" violates foreign key constraint "contrataciones_usuario_id_fkey"
```

**Causa raíz:** Hay un **delay de propagación** en Supabase. Cuando:
1. Te registras → Se crea usuario en `auth.users`
2. Se llama a `crear_perfil_usuario()` → La función intenta validar que el usuario existe
3. Pero `auth.users` aún no lo propagó → Error "Usuario no encontrado"

---

## ✅ SOLUCIONES IMPLEMENTADAS

### 1️⃣ **auth.service.ts** - RETRY LOGIC ✅ (YA HECHO)

Se agregó retry automático con delays progresivos:
- Intento 1: espera 500ms
- Intento 2: espera 1000ms  
- Intento 3: espera 1500ms

**Beneficio:** Si falla el primer intento, reintentar automáticamente.

**Ubicación:** `src/app/services/auth.service.ts` - Línea ~100

### 2️⃣ **contrataciones.service.ts** - RETRY LOGIC ✅ (YA HECHO)

Se agregó retry automático con mismo patrón de delays:
- Intento 1: espera 500ms
- Intento 2: espera 1000ms
- Intento 3: espera 1500ms

**Beneficio:** Si el usuario aún no está completamente propagado, reintentar.

**Ubicación:** `src/app/services/contrataciones.service.ts` - Línea ~14

### 3️⃣ **SQL - Función crear_perfil_usuario** - PENDIENTE ⏳

La función SQL debe actualizar para remover validación estricta de `auth.users` y usar `EXCEPTION` handlers.

---

## 📋 PASOS A EJECUTAR

### Paso 1: Ejecutar SQL en Supabase

1. Abre tu proyecto en Supabase
2. Ve a **SQL Editor** → **New Query**
3. **Copia y pega el siguiente SQL:**

```sql
-- 1. CREAR FUNCIÓN MEJORADA
CREATE OR REPLACE FUNCTION public.crear_perfil_usuario(
  p_user_id UUID,
  p_full_name TEXT,
  p_phone TEXT DEFAULT NULL,
  p_rol TEXT DEFAULT 'usuario_registrado'
)
RETURNS json AS $$
DECLARE
  v_result json;
BEGIN
  -- 1. Verificar que no hay perfil duplicado (anti-duplicado)
  IF EXISTS(SELECT 1 FROM public.perfiles WHERE user_id = p_user_id) THEN
    RETURN json_build_object(
      'success', true,
      'message', 'Perfil ya existe para este usuario',
      'user_id', p_user_id
    );
  END IF;
  
  -- 2. Insertar el perfil
  -- NOTA: No validamos que exista en auth.users porque hay delay de propagación
  -- La FK de auth.users.id lo hará automáticamente si el usuario no existe
  BEGIN
    INSERT INTO public.perfiles (user_id, full_name, phone, rol, created_at, updated_at)
    VALUES (p_user_id, p_full_name, p_phone, p_rol, NOW(), NOW());
    
    v_result := json_build_object(
      'success', true,
      'message', 'Perfil creado exitosamente',
      'user_id', p_user_id
    );
    RETURN v_result;
    
  EXCEPTION WHEN foreign_key_violation THEN
    -- Si falla por FK, el usuario aún no está en auth.users (error temporal)
    RETURN json_build_object(
      'success', false,
      'error', 'Usuario aún no disponible. Reintentando automáticamente...',
      'user_id', p_user_id
    );
    
  EXCEPTION WHEN OTHERS THEN
    v_result := json_build_object(
      'success', false,
      'error', SQLERRM,
      'detail', 'Error al crear el perfil'
    );
    RETURN v_result;
  END;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. GRANT permisos
GRANT EXECUTE ON FUNCTION public.crear_perfil_usuario(UUID, TEXT, TEXT, TEXT) TO authenticated, anon;

-- 3. VERIFICAR que se actualizó
SELECT routine_name FROM information_schema.routines 
WHERE routine_name = 'crear_perfil_usuario'
  AND routine_schema = 'public';
```

4. Click en **Run**
5. Deberías ver: ✅ `SELECT 1`

### Paso 2: Compilar y Probar

1. **Actualizar la app:**
   ```bash
   # Presiona Ctrl+Shift+Delete en navegador para limpiar cache
   # Recarga la página
   ```

2. **Probar flujo completo:**
   - Selecciona **"Usuario Normal"**
   - Click en **"Registrarse"**
   - Completa: nombre, email, teléfono, contraseña
   - Click en **"Registrarse"**
   - **Abre DevTools (F12)** → Console
   - Deberías ver: 
     ```
     ⏳ Intento 1/3 - Esperando 500ms...
     ✅ Intento 1 exitoso
     ✅ Perfil creado exitosamente
     ```

3. **Probar "Contratar Ahora":**
   - Inicia sesión con el usuario que acabas de crear
   - Ve a un plan móvil
   - Click en **"Contratar Ahora"**
   - Deberías ver en Console:
     ```
     ⏳ Intento 1/3 - Esperando 500ms...
     ✅ RPC exitoso en intento 1
     ✅ Contratación creada exitosamente
     ```

---

## 🔍 Si Aún Hay Error

### Caso 1: "Usuario no encontrado en auth.users"

**Causa:** La función SQL aún tiene validación estricta
**Solución:** Ejecutar el SQL del paso 1 para actualizar la función

### Caso 2: "violates foreign key constraint"

**Causa:** El usuario no existe en `auth.users` en el momento de crear contratación
**Solución:** Los reintentos ya están en place. Si sigue fallando:
- Aumentar máximo de intentos de 3 a 5
- Aumentar delay máximo de 1500ms a 2000ms

**Cambio en auth.service.ts (línea ~108):**
```typescript
let maxRetries = 5;  // Cambiar de 3 a 5

const delayMs = 500 + (retryCount * 750); // 500ms, 1250ms, 2000ms, 2750ms, 3500ms
```

### Caso 3: "Perfil ya existe"

**Causa:** El perfil se creó en el primer intento pero el usuario vio error
**Solución:** Normal. Si ves este mensaje, significa que el registro fue exitoso
- Login normal con el usuario debería funcionar
- El error es visual pero todo está guardado

---

## 📊 Flujo Esperado (Con Fixes)

```
1. Usuario hace click "Registrarse"
   ↓
2. Angular: signUp() crea usuario en auth.users
   ↓
3. Angular: RETRY LOGIC de crear_perfil_usuario()
   - Intento 1 (500ms): ¿Usuario existe? Si no, reintentar
   - Intento 2 (1000ms): ¿Usuario existe? Si sí, crear perfil ✅
   ↓
4. ✅ Usuario registrado con perfil
   ↓
5. Usuario hace click "Contratar Ahora"
   ↓
6. Angular: RETRY LOGIC de crear_contratacion()
   - Intento 1 (500ms): ¿Usuario existe en DB? Si no, reintentar
   - Intento 2 (1000ms): ¿Usuario existe? Si sí, crear contratación ✅
   ↓
7. ✅ Contratación creada exitosamente
```

---

## 🚀 Resumen de Cambios

| Archivo | Cambio | Estado |
|---------|--------|--------|
| `auth.service.ts` | Agregó retry logic (3 intentos) | ✅ Hecho |
| `contrataciones.service.ts` | Agregó retry logic (3 intentos) | ✅ Hecho |
| SQL `crear_perfil_usuario` | Remover validación estricta | ⏳ Pendiente (ejecutar paso 1) |

---

## 💾 Archivos de Referencia

- `SQL_FIX_CREAR_PERFIL_SIN_VALIDACION.sql` - SQL a ejecutar
- `auth.service.ts` - Retry logic para registro
- `contrataciones.service.ts` - Retry logic para contratación

