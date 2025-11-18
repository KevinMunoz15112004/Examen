# Solución: Mensajes de Chat no Cargan para Asesores

## Problema Identificado
El componente `advisor-chat` no está mostrando mensajes. El log muestra:
- "Cargando chat para contratación: [id]"
- "Mensajes obtenidos: 0"

## Causa Probable
1. No hay mensajes en la tabla `mensajes_chat` para esa contratación
2. Las políticas RLS (Row Level Security) podrían estar bloqueando la lectura
3. El asesor está intentando acceder a una contratación que no tiene asignada

## Solución Aplicada

### Paso 1: Ejecutar el RPC SQL ✅ HACER ESTO AHORA
Abre tu consola Supabase SQL Editor y ejecuta el contenido de:
```
SQL_CREATE_OBTENER_MENSAJES.sql
```

Este crea la función RPC `obtener_mensajes_contratacion()` que bypassa las políticas RLS.

### Paso 2: Verificar que hay mensajes en la BD
En la consola SQL de Supabase, ejecuta:
```sql
-- Ver contrataciones asignadas a asesores
SELECT id, usuario_id, asesor_id FROM contrataciones WHERE asesor_id IS NOT NULL LIMIT 5;

-- Ver mensajes existentes
SELECT * FROM mensajes_chat LIMIT 10;
```

### Paso 3: Si no hay mensajes, insertar de prueba
Si el paso 2 no muestra mensajes, usa:
```
SQL_INSERT_TEST_MESSAGES.sql
```

Abre ese archivo, reemplaza los valores de `REPLACE_WITH_*` con IDs reales de:
- Una contratación existente
- El usuario asociado
- El asesor asignado

Luego ejecuta el SQL.

### Paso 4: Probar en la app
1. Recarga la aplicación (F5 o Ctrl+Shift+R)
2. Inicia sesión como asesor
3. Ve a "Conversaciones"
4. Haz clic en una conversación
5. Deberías ver los mensajes ahora

## Archivos Modificados
- ✅ `src/app/services/chat.service.ts` - Actualizado para usar RPC en lugar de consulta directa
- ✅ `SQL_CREATE_OBTENER_MENSAJES.sql` - Nueva función RPC (EJECUTAR EN SUPABASE)
- ✅ `SQL_INSERT_TEST_MESSAGES.sql` - Script de prueba para insertar datos

## Si Aún No Funciona
1. Verifica que `obtener_mensajes_contratacion` está listado en Functions en Supabase
2. Comprueba en el navegador (F12) los logs de error exactos
3. Asegúrate de que el ID de contratación existe en la BD
4. Verifica que el asesor está autenticado (revisa el token JWT)

## Próximos Pasos
Una vez que los mensajes carguen:
1. Prueba enviar un mensaje como asesor
2. Verifica que aparece en la lista
3. Revisa si el usuario puede ver la respuesta del asesor
