# Fix: Mensajes de Chat No Cargan - Problema con FK de asesor_id

## Problema Identificado
Tu tabla `mensajes_chat` tiene `asesor_id` que apunta a `auth.users`, pero los asesores NO están en `auth.users`, están en la tabla `asesores` personalizada. Por eso los mensajes no cargan.

## Solución: 3 Pasos en Supabase SQL Editor

### Paso 1: Corregir el Foreign Key ⚠️ CRÍTICO
Ejecuta el contenido de: **`SQL_FIX_ASESOR_FK_MENSAJES.sql`**

```sql
ALTER TABLE mensajes_chat
DROP CONSTRAINT IF EXISTS mensajes_chat_asesor_id_fkey;

ALTER TABLE mensajes_chat
ADD CONSTRAINT mensajes_chat_asesor_id_fkey
FOREIGN KEY (asesor_id) 
REFERENCES asesores(id)
ON DELETE CASCADE;
```

Esto cambia la referencia de `auth.users` a la tabla `asesores`.

### Paso 2: Crear la Función RPC
Ejecuta el contenido de: **`SQL_CREATE_OBTENER_MENSAJES.sql`**

Esta crea la función `obtener_mensajes_contratacion()` que bypassa RLS.

### Paso 3: Insertar Mensajes de Prueba
Primero obtén los IDs ejecutando estas consultas en Supabase:

```sql
-- Ver un asesor existente
SELECT id, email, nombre FROM asesores LIMIT 1;

-- Ver una contratación con asesor asignado
SELECT id, usuario_id, asesor_id FROM contrataciones WHERE asesor_id IS NOT NULL LIMIT 1;
```

Luego reemplaza en `SQL_INSERT_MENSAJES_CORRECTOS.sql`:
- `CONTRATACION_ID_AQUI` → ID de la contratación
- `USUARIO_ID_AQUI` → ID del usuario
- `ASESOR_ID_AQUI` → ID del asesor

Y ejecuta ese archivo.

## Archivos Actualizados en el Código ✅

- `chat.service.ts` - Removido campo `es_asesor` de `enviarMensajeAsesor()`
- `SQL_CREATE_OBTENER_MENSAJES.sql` - Actualizado RPC sin campo `es_asesor`

## Después de Ejecutar el SQL

1. Recarga la app (F5 o Ctrl+Shift+R)
2. Inicia sesión como asesor
3. Ve a "Conversaciones"
4. Haz clic en una conversación
5. **Ahora deberías ver los mensajes**

## ¿Qué Hace Que Funcione?

| Antes | Después |
|-------|---------|
| asesor_id → auth.users (asesores no están aquí) ❌ | asesor_id → asesores ✅ |
| Consulta directa a tabla (bloqueada por RLS) ❌ | RPC con SECURITY DEFINER ✅ |
| No había mensajes de prueba ❌ | Mensajes correctamente asociados ✅ |

## Si Aún No Funciona

1. **Verifica el error en F12 → Console** - ¿Qué dice exactamente?
2. **Confirma que la función RPC se creó**: En Supabase, va a Database → Functions
3. **Asegúrate de que hay asesores en la tabla `asesores`**
4. **Verifica que hay contrataciones con `asesor_id NOT NULL`**
