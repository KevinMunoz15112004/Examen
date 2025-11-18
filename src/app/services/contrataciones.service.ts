import { Injectable } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';
import { Contratacion, ContratacionDetalle } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ContratacionesService {
  constructor(private supabaseService: SupabaseService) {}

  createContratacion(usuarioId: string, planId: string, precioPlan: number): Observable<Contratacion | null> {
    const supabase = this.supabaseService.getClient();

    console.log('📝 Creando contratación para usuario_id:', usuarioId);

    // Usar RPC para bypassear RLS (SECURITY DEFINER)
    // Con RETRY LOGIC para manejar delays de propagación
    return from(
      (async () => {
        let maxRetries = 3;
        let retryCount = 0;
        let lastError: any = null;
        let lastResult: any = null;

        while (retryCount < maxRetries) {
          try {
            const delayMs = 500 + (retryCount * 500); // 500ms, 1000ms, 1500ms
            console.log(`⏳ Intento ${retryCount + 1}/${maxRetries} - Esperando ${delayMs}ms para crear contratación...`);
            await new Promise(resolve => setTimeout(resolve, delayMs));

            const result = await supabase.rpc('crear_contratacion', {
              p_usuario_id: usuarioId,
              p_plan_id: planId,
              p_precio_mensual: precioPlan
            });

            console.log(`RPC Response intento ${retryCount + 1}:`, result);
            lastResult = result;

            // Si no hay error y la función fue exitosa, retornar resultado
            if (!result.error) {
              console.log(`✅ RPC exitoso en intento ${retryCount + 1}`);
              return result;
            }

            // Si es error de FK (usuario no existe aún), reintentar
            if (result.error?.message?.includes('foreign key')) {
              console.log(`⚠️ Error FK en intento ${retryCount + 1}. Reintentando...`);
              lastError = result.error;
              retryCount++;
            } else {
              // Otros errores no recuperables
              console.error(`❌ Error no recuperable en intento ${retryCount + 1}:`, result.error);
              return result;
            }
          } catch (err: any) {
            console.error(`❌ Error en intento ${retryCount + 1}:`, err);
            lastError = err;
            retryCount++;
          }
        }

        // Si se agotaron los reintentos, retornar último error
        console.error('❌ Se agotaron los reintentos. Último error:', lastError);
        return { error: lastError || new Error('Error al crear contratación después de reintentos') };
      })()
    ).pipe(
      switchMap(async (result: any) => {
        console.log('RPC Response crear_contratacion (después de reintentos):', result);

        if (!result) {
          console.error('❌ RPC retornó null/undefined');
          return null;
        }

        // CASO 1: Respuesta de Supabase wrapper {error: null, data: {...}, status: 200}
        if (result.status !== undefined && result.status === 200) {
          if (result.data?.success === false) {
            console.error('❌ Función retornó error:', result.data.error);
            return null;
          }

          console.log('✅ Contratación creada exitosamente (Supabase wrapper)');
          return {
            id: result.data.data.id,
            usuario_id: usuarioId,
            plan_id: planId,
            estado: 'pendiente',
            fecha_inicio: new Date().toISOString(),
            precio_mensual: precioPlan,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          } as Contratacion;
        }

        // CASO 2: Respuesta JSON directa {success: true, ...}
        if (typeof result === 'object' && result.success === true) {
          console.log('✅ Contratación creada exitosamente (JSON function):', result.data);
          return {
            id: result.contratacion_id,
            usuario_id: usuarioId,
            plan_id: planId,
            estado: 'pendiente',
            fecha_inicio: new Date().toISOString(),
            precio_mensual: precioPlan,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          } as Contratacion;
        }

        // CASO 3: Error en respuesta JSON {success: false, error: '...'}
        if (typeof result === 'object' && result.success === false) {
          console.error('❌ Función retornó error:', result.error);
          return null;
        }

        // CASO 4: Error de Supabase {error: {...}}
        if (result.error) {
          console.error('❌ Error de Supabase:', result.error);
          return null;
        }

        console.warn('⚠️ Formato de respuesta inesperado pero sin error - asumiendo éxito:', result);
        return {
          id: 'temp-id',
          usuario_id: usuarioId,
          plan_id: planId,
          estado: 'pendiente',
          fecha_inicio: new Date().toISOString(),
          precio_mensual: precioPlan,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as Contratacion;
      })
    );
  }

  getContratacionesByUsuario(usuarioId: string): Observable<ContratacionDetalle[]> {
    const supabase = this.supabaseService.getClient();

    return from(supabase
      .from('vw_contrataciones_detalle')
      .select('*')
      .eq('usuario_id', usuarioId)
      .order('created_at', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('Error cargando contrataciones:', error);
          return [];
        }
        return data as ContratacionDetalle[];
      })
    );
  }

  getContratacionesPendientes(): Observable<ContratacionDetalle[]> {
    const supabase = this.supabaseService.getClient();

    return from(supabase
      .from('vw_contrataciones_detalle')
      .select('*')
      .eq('estado', 'pendiente')
      .order('created_at', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('Error cargando contrataciones pendientes:', error);
          return [];
        }
        return data as ContratacionDetalle[];
      })
    );
  }

  getTodasLasContrataciones(): Observable<ContratacionDetalle[]> {
    const supabase = this.supabaseService.getClient();

    return from(supabase
      .from('vw_contrataciones_detalle')
      .select('*')
      .order('created_at', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('Error cargando todas las contrataciones:', error);
          return [];
        }
        console.log('📊 Todas las contrataciones cargadas:', data?.length);
        console.log('   Estados:', data?.map(c => c.estado));
        return data as ContratacionDetalle[];
      })
    );
  }

  actualizarEstadoContratacion(contratacionId: string, nuevoEstado: string): Observable<boolean> {
    const supabase = this.supabaseService.getClient();

    console.log('🔄 Actualizando estado de contratación:', contratacionId, 'a', nuevoEstado);

    // Usar RPC en lugar de actualización directa para bypassear RLS
    return from(supabase.rpc('actualizar_estado_contratacion', {
      p_contratacion_id: contratacionId,
      p_nuevo_estado: nuevoEstado
    })).pipe(
      switchMap(async (result: any) => {
        console.log('📊 Respuesta bruta de RPC:', result);
        
        if (!result) {
          console.error('❌ RPC retornó null/undefined');
          return false;
        }

        // La respuesta viene en la estructura: {error: null, data: {...}, status: 200}
        // Necesitamos acceder a result.data si existe
        let responseData = result;
        
        // Si tenemos la estructura de Supabase, extraer el data
        if (result.data !== undefined && result.status !== undefined) {
          responseData = result.data;
          console.log('📦 Datos extraídos de respuesta Supabase:', responseData);
        }
        
        // Si es string, parsear como JSON
        if (typeof responseData === 'string') {
          try {
            responseData = JSON.parse(responseData);
            console.log('📦 JSON parseado:', responseData);
          } catch (e) {
            console.error('❌ Error parseando JSON:', e);
            return false;
          }
        }

        console.log('🔍 Datos finales a verificar:', responseData);

        // Verificar si la actualización fue exitosa
        if (responseData && responseData.success === true) {
          console.log('✅ Estado actualizado correctamente. Filas afectadas:', responseData.rows_affected);
          return true;
        } else {
          console.error('❌ Error en RPC:', responseData?.error || 'sin error detallado');
          return false;
        }
      }),
      catchError((err: any) => {
        console.error('❌ Error en RPC de actualización:', err);
        return of(false);
      })
    );
  }

  getContratacionById(id: string): Observable<Contratacion | null> {
    const supabase = this.supabaseService.getClient();

    console.log('🔍 Obteniendo contratación:', id);

    // Usar RPC para bypassear RLS (SECURITY DEFINER)
    return from(supabase
      .rpc('obtener_contratacion_por_id', {
        p_contratacion_id: id
      })
    ).pipe(
      map((result: any) => {
        console.log('🔍 Response obtener_contratacion_por_id:', result);

        if (!result) {
          console.error('❌ RPC retornó null/undefined');
          return null;
        }

        // CASO 1: Wrapper de Supabase {error: null, data: {...}, status: 200}
        // donde data contiene el JSON que retornó la función
        if (result.status === 200 && result.data) {
          let parsedData = result.data;
          
          // Si data es string, parsear como JSON
          if (typeof parsedData === 'string') {
            try {
              parsedData = JSON.parse(parsedData);
            } catch (e) {
              console.error('❌ Error parseando JSON:', e);
              return null;
            }
          }

          // Si tiene success: true, extraer la contratación
          if (parsedData.success === true && parsedData.data) {
            console.log('✅ Contratación obtenida (wrapper Supabase):', parsedData.data);
            return parsedData.data as Contratacion;
          }

          // Si tiene success: false, error
          if (parsedData.success === false) {
            console.error('❌ Función retornó error:', parsedData.error);
            return null;
          }

          // Si es directamente la contratación (sin success wrapper)
          if (parsedData.id) {
            console.log('✅ Contratación obtenida (datos directos):', parsedData);
            return parsedData as Contratacion;
          }
        }

        // CASO 2: Respuesta con estructura {success: true/false, data: {...}} sin wrapper
        if (result.success === true && result.data) {
          console.log('✅ Contratación obtenida:', result.data);
          return result.data as Contratacion;
        }

        // CASO 3: Error en la respuesta
        if (result.success === false) {
          console.error('❌ RPC retornó error:', result.error);
          return null;
        }

        // CASO 4: Respuesta directa sin wrapper (solo la contratación)
        if (result.id) {
          console.log('✅ Contratación obtenida (respuesta directa):', result);
          return result as Contratacion;
        }

        console.warn('⚠️ Formato de respuesta inesperado:', result);
        return null;
      }),
      catchError((error: any) => {
        console.error('❌ Error en RPC obtener_contratacion_por_id:', error);
        return of(null);
      })
    );
  }
}
