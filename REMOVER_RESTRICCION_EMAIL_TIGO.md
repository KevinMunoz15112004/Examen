# 🔓 Remover Restricción de Email @tigo.com en Registro

## 🎯 Problema
No puedes registrarte como usuario normal con emails que no sean `@tigo.com`. Solo aceptados:
- ✅ usuario@tigo.com
- ❌ usuario@gmail.com
- ❌ usuario@yahoo.com

## 🔍 Dónde Está la Restricción

La restricción **NO está en el código de Angular** (`auth.service.ts` ni `auth.page.ts`).

Está configurada en **Supabase → Authentication → Email Templates** o en **Allow List** de dominios autorizados.

---

## ✅ SOLUCIÓN: Pasos en Supabase

### 1️⃣ Abre tu Proyecto Supabase
1. Ve a: https://supabase.com
2. Selecciona tu proyecto: **Examen**
3. En el panel izquierdo, click en **Authentication**

### 2️⃣ Busca Configuración de Dominios
Hay varias formas donde se puede configurar la restricción:

#### **Opción A: Email Redirect URLs (Más Probable)**
1. Click en **URL Configuration** (en el panel izquierdo de Authentication)
2. Busca sección **"Redirect URLs"** o **"Allowed Domains"**
3. Si ves `*.tigo.com` o restricción similar, **elimínalo**
4. Save

#### **Opción B: Email Provider Settings**
1. Click en **Providers** (en Authentication)
2. Click en **Email** (debe estar habilitado)
3. Busca opción **"Email Domain Restrictions"** o **"Allowed Domains"**
4. Si ves `@tigo.com`, elimínalo o deja vacío
5. Save

#### **Opción C: Custom SMTP (Si está configurado)**
1. Click en **Providers**
2. Si está habilitado **Custom SMTP**:
   - Revisa que no tenga restricción de dominio en la configuración
   - Contact: Si tiene restricción, se debe modificar en el servidor SMTP

---

## 📋 Configuración Recomendada

Para permitir **CUALQUIER EMAIL** en el registro:

```
✅ Email Provider: ENABLED
✅ Redirect URLs: (Sin restricciones de dominio)
✅ Email Domain Restrictions: (VACÍO o DESACTIVADO)
✅ Confirm Email: OFF (para desarrollo)
✅ Email Auto Confirm: ON (para permitir login inmediato)
```

---

## 🧪 Prueba Después de Cambios

1. **Actualiza la aplicación** (Ctrl+Shift+Delete en navegador para limpiar cache)
2. Abre: `http://localhost:8100`
3. Selecciona: **"Usuario Normal"**
4. Click en: **"Registrarse"**
5. Completa el formulario con:
   - Email: `prueba@gmail.com` (o cualquier dominio)
   - Nombre: `Usuario Prueba`
   - Teléfono: `0987654321`
   - Contraseña: `prueba123456`
6. Click en **"Registrarse"**

**Resultado esperado**: ✅ Registro exitoso con cualquier email

---

## 🔧 Comando SQL para Verificar (Opcional)

Si quieres ver los usuarios registrados en Supabase:

```sql
-- En Supabase SQL Editor
SELECT id, email, email_confirmed_at, created_at 
FROM auth.users 
ORDER BY created_at DESC;
```

---

## ⚠️ Si Aún No Funciona

1. **Borra datos locales**:
   - Abre DevTools (F12)
   - Ve a Application → LocalStorage
   - Elimina todo relacionado a `supabase`

2. **Recarga la app**: Presiona `Ctrl+Shift+Delete` (limpiar cache)

3. **Contacta Soporte Supabase**: Si la restricción persiste, puede ser:
   - RLS policies en auth.users (poco probable)
   - Configuración a nivel de organización
   - Webhook o trigger personalizados

---

## 📝 Notas

- El código Angular **YA ESTÁ LISTO** para aceptar cualquier email
- No necesitas cambiar `auth.service.ts` ni `auth.page.ts`
- Solo necesitas actualizar la configuración de **Supabase Authentication**
- Los cambios en Supabase son inmediatos (no requiere recompilación)

