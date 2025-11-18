import { Injectable } from '@angular/core';
import { Observable, from, of, Subject } from 'rxjs';
import { map, switchMap, catchError, tap } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';
import { Contratacion, ContratacionDetalle } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ContratacionesService {
  private contratacionActualizadaSubject = new Subject<{ id: string; nuevoEstado: string }>();
  contratacionActualizada$ = this.contratacionActualizadaSubject.asObservable();

  constructor(private supabaseService: SupabaseService) {}

  createContratacion(usuarioId: string, planId: string, precioPlan: number): Observable<Contratacion | null> {
    const supabase = this.supabaseService.getClient();

    console.log('Creando contratación para usuario_id:', usuarioId);

    return from(
      (async () => {
        let maxRetries = 3;
        let retryCount = 0;
        let lastError: any = null;
        let lastResult: any = null;

        while (retryCount < maxRetries) {
          try {
            const delayMs = 500 + (retryCount * 500); 
            console.log(`⏳ Intento ${retryCount + 1}/${maxRetries} - Esperando ${delayMs}ms para crear contratación...`);
            await new Promise(resolve => setTimeout(resolve, delayMs));

            const result = await supabase.rpc('crear_contratacion', {
              p_usuario_id: usuarioId,
              p_plan_id: planId,
              p_precio_mensual: precioPlan
            });

            console.log(`RPC Response intento ${retryCount + 1}:`, result);
            lastResult = result;

            if (!result.error) {
              console.log(`✅ RPC exitoso en intento ${retryCount + 1}`);
              return result;
            }

            if (result.error?.message?.includes('foreign key')) {
              console.log(`Error FK en intento ${retryCount + 1}. Reintentando...`);
              lastError = result.error;
              retryCount++;
            } else {
              console.error(`Error no recuperable en intento ${retryCount + 1}:`, result.error);
              return result;
            }
          } catch (err: any) {
            console.error(`Error en intento ${retryCount + 1}:`, err);
            lastError = err;
            retryCount++;
          }
        }

        console.error('Se agotaron los reintentos. Último error:', lastError);
        return { error: lastError || new Error('Error al crear contratación después de reintentos') };
      })()
    ).pipe(
      switchMap(async (result: any) => {
        console.log('RPC Response crear_contratacion (después de reintentos):', result);

        if (!result) {
          console.error('RPC retornó null/undefined');
          return null;
        }

        if (result.status !== undefined && result.status === 200) {
          if (result.data?.success === false) {
            console.error('Función retornó error:', result.data.error);
            return null;
          }

          console.log('Contratación creada exitosamente (Supabase wrapper)');
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

        if (typeof result === 'object' && result.success === true) {
          console.log('Contratación creada exitosamente (JSON function):', result.data);
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

        if (typeof result === 'object' && result.success === false) {
          console.error('Función retornó error:', result.error);
          return null;
        }

        if (result.error) {
          console.error('Error de Supabase:', result.error);
          return null;
        }

        console.warn('Formato de respuesta inesperado pero sin error - asumiendo éxito:', result);
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

    return from(supabase.rpc('actualizar_estado_contratacion', {
      p_contratacion_id: contratacionId,
      p_nuevo_estado: nuevoEstado
    })).pipe(
      switchMap(async (result: any) => {
        console.log('Respuesta bruta de RPC:', result);
        
        if (!result) {
          console.error('RPC retornó null/undefined');
          return false;
        }

        let responseData = result;

        if (result.data !== undefined && result.status !== undefined) {
          responseData = result.data;
          console.log('Datos extraídos de respuesta Supabase:', responseData);
        }
        
        if (typeof responseData === 'string') {
          try {
            responseData = JSON.parse(responseData);
            console.log('JSON parseado:', responseData);
          } catch (e) {
            console.error('Error parseando JSON:', e);
            return false;
          }
        }

        console.log('Datos finales a verificar:', responseData);

        if (responseData && responseData.success === true) {
          console.log('Estado actualizado correctamente. Filas afectadas:', responseData.rows_affected);
          this.contratacionActualizadaSubject.next({ id: contratacionId, nuevoEstado });
          return true;
        } else {
          console.error('Error en RPC:', responseData?.error || 'sin error detallado');
          return false;
        }
      }),
      catchError((err: any) => {
        console.error('Error en RPC de actualización:', err);
        return of(false);
      })
    );
  }

  getContratacionById(id: string): Observable<Contratacion | null> {
    const supabase = this.supabaseService.getClient();

    console.log('Obteniendo contratación:', id);

    return from(supabase
      .rpc('obtener_contratacion_por_id', {
        p_contratacion_id: id
      })
    ).pipe(
      map((result: any) => {
        console.log('Response obtener_contratacion_por_id:', result);

        if (!result) {
          console.error('RPC retornó null/undefined');
          return null;
        }

        if (result.status === 200 && result.data) {
          let parsedData = result.data;
          
          if (typeof parsedData === 'string') {
            try {
              parsedData = JSON.parse(parsedData);
            } catch (e) {
              console.error('Error parseando JSON:', e);
              return null;
            }
          }

          if (parsedData.success === true && parsedData.data) {
            console.log('Contratación obtenida (wrapper Supabase):', parsedData.data);
            return parsedData.data as Contratacion;
          }

          if (parsedData.success === false) {
            console.error('Función retornó error:', parsedData.error);
            return null;
          }

          if (parsedData.id) {
            console.log('Contratación obtenida (datos directos):', parsedData);
            return parsedData as Contratacion;
          }
        }

        if (result.success === true && result.data) {
          console.log('Contratación obtenida:', result.data);
          return result.data as Contratacion;
        }

        if (result.success === false) {
          console.error('RPC retornó error:', result.error);
          return null;
        }

        if (result.id) {
          console.log('Contratación obtenida (respuesta directa):', result);
          return result as Contratacion;
        }

        console.warn('Formato de respuesta inesperado:', result);
        return null;
      }),
      catchError((error: any) => {
        console.error('Error en RPC obtener_contratacion_por_id:', error);
        return of(null);
      })
    );
  }
}
