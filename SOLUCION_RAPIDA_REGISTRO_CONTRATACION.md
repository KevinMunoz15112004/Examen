# ✅ SOLUCION: Errores en Registro y Contratación - Guía Rápida

## 🎯 Problema
- ❌ Al registrarse: "Usuario no encontrado en auth.users"
- ❌ Al contratar: "violates foreign key constraint"

## 🔧 Causa
**Delay de propagación en Supabase:** El usuario se crea en `auth.users` pero tarda milisegundos en propagarse a través de los servidores.

---

## ✅ SOLUCIÓN (2 Pasos)

### PASO 1: Actualizar SQL (1 minuto) ⏳

1. Ve a Supabase → SQL Editor → New Query
2. **Copia este SQL completo:**

```sql
-- ACTUALIZAR FUNCIÓN crear_perfil_usuario
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
  -- Verificar que no hay perfil duplicado
  IF EXISTS(SELECT 1 FROM public.perfiles WHERE user_id = p_user_id) THEN
    RETURN json_build_object(
      'success', true,
      'message', 'Perfil ya existe',
      'user_id', p_user_id
    );
  END IF;
  
  -- Insertar perfil (sin validar auth.users por delay de propagación)
  BEGIN
    INSERT INTO public.perfiles (user_id, full_name, phone, rol, created_at, updated_at)
    VALUES (p_user_id, p_full_name, p_phone, p_rol, NOW(), NOW());
    
    RETURN json_build_object(
      'success', true,
      'message', 'Perfil creado',
      'user_id', p_user_id
    );
    
  EXCEPTION WHEN foreign_key_violation THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Usuario no disponible aún',
      'user_id', p_user_id
    );
    
  EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
  END;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.crear_perfil_usuario(UUID, TEXT, TEXT, TEXT) 
  TO authenticated, anon;
```

3. Click **Run** → Deberías ver ✅ sin errores
4. **Listo!** El código Angular ya tiene los reintentos implementados

---

### PASO 2: Probar (2 minutos) 🧪

1. **Limpiar cache:**
   - F12 (DevTools) → Network → click checkbox "Disable cache"
   - Ctrl+Shift+Delete → Clear site data
   - Recarga la página

2. **Registrar usuario nuevo:**
   - Selecciona: **"Usuario Normal"**
   - Click: **"Registrarse"**
   - Completa: nombre, email @gmail.com (o cualquier), teléfono, contraseña
   - Click: **"Registrarse"**
   - **Abre Console (F12 → Console)**
   - Deberías ver:
     ```
     ⏳ Intento 1/3 - Esperando 500ms...
     ✅ Intento 1 exitoso
     ✅ Perfil creado exitosamente
     ```

3. **Contratar un plan:**
   - Inicia sesión con el usuario que creaste
   - Selecciona un plan → **"Contratar Ahora"**
   - **Console debería mostrar:**
     ```
     ⏳ Intento 1/3 - Esperando 500ms...
     ✅ RPC exitoso en intento 1
     ✅ Contratación creada exitosamente
     ```

---

## 📝 Qué Se Cambió en el Código

### 1. **auth.service.ts** (Registro de Usuarios)
```typescript
// ANTES: Un solo intento, espera 500ms
await new Promise(resolve => setTimeout(resolve, 500));
const { error, data } = await supabase.rpc('crear_perfil_usuario', ...);

// DESPUÉS: Reintentos automáticos (500ms → 1000ms → 1500ms)
let maxRetries = 3;
let retryCount = 0;
while (retryCount < maxRetries) {
  const delayMs = 500 + (retryCount * 500);
  await new Promise(resolve => setTimeout(resolve, delayMs));
  const response = await supabase.rpc('crear_perfil_usuario', ...);
  if (!response.error) break; // Exitoso, salir
  retryCount++;
}
```

### 2. **contrataciones.service.ts** (Crear Contratación)
```typescript
// ANTES: Un solo intento
const result = await supabase.rpc('crear_contratacion', ...);

// DESPUÉS: Reintentos automáticos (mismo patrón)
let maxRetries = 3;
while (retryCount < maxRetries) {
  const delayMs = 500 + (retryCount * 500);
  await new Promise(resolve => setTimeout(resolve, delayMs));
  const result = await supabase.rpc('crear_contratacion', ...);
  if (!result.error) break; // Exitoso, salir
  retryCount++;
}
```

### 3. **SQL - Función crear_perfil_usuario**
```sql
-- ANTES: Validaba que el usuario existe en auth.users (fallaría por delay)
SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = p_user_id) INTO v_user_exists;
IF NOT v_user_exists THEN RETURN error END;

-- DESPUÉS: No valida (deja que la FK lo maneje, con EXCEPTION)
BEGIN
  INSERT INTO public.perfiles (user_id, ...)
  EXCEPTION WHEN foreign_key_violation THEN
    -- Si el usuario no existe, la FK lo detecta automáticamente
END;
```

---

## 🎯 Resultado Esperado

| Acción | Antes | Después |
|--------|-------|---------|
| Registrarse | ❌ "Usuario no encontrado" | ✅ Automático retry, éxito |
| Contratar | ❌ "violates foreign key" | ✅ Automático retry, éxito |
| Velocidad | Rápido pero falla | Más lento pero confiable |

---

## 🚨 Si Aún Hay Error

### Error: "Perfil ya existe"
✅ **NORMAL** - Significa que el perfil se creó en el primer intento pero hubo error visual. 
→ Intenta login normal

### Error: "Usuario no disponible aún" (después de 3 reintentos)
⚠️ Problema más profundo. Opciones:
1. Ejecutar SQL de nuevo (copiar y ejecutar el bloque completo)
2. Aumentar `maxRetries` de 3 a 5 en los servicios
3. Contactar soporte de Supabase

### Error: "violates foreign key" (en contratación)
→ Los reintentos ya están en place
→ Si aún falla, probablemente el usuario no se registró bien (paso 1)

---

## ✅ Checklist

- [ ] Ejecuté el SQL en Supabase
- [ ] Limpié cache del navegador
- [ ] Probé registrarse con email no @tigo.com
- [ ] Vi los "⏳ Intento" en la consola
- [ ] Probé "Contratar Ahora"
- [ ] Contratación fue creada exitosamente

---

## 📚 Más Información

- Detalles técnicos: `FIX_FOREIGN_KEY_RETRY_LOGIC.md`
- SQL original: `SQL_FIX_CREAR_PERFIL_SIN_VALIDACION.sql`
- Código Angular: `src/app/services/auth.service.ts` y `contrataciones.service.ts`

