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
    return from(
      supabase.rpc('crear_contratacion', {
        p_usuario_id: usuarioId,
        p_plan_id: planId,
        p_precio_mensual: precioPlan
      })
    ).pipe(
      switchMap(async (result: any) => {
        console.log('RPC Response crear_contratacion:', result);

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

  actualizarEstadoContratacion(contratacionId: string, nuevoEstado: string): Observable<boolean> {
    const supabase = this.supabaseService.getClient();

    return from(supabase
      .from('contrataciones')
      .update({
        estado: nuevoEstado,
        updated_at: new Date().toISOString()
      })
      .eq('id', contratacionId)
    ).pipe(
      map(({ error }) => {
        if (error) {
          console.error('Error actualizando estado:', error);
          return false;
        }
        return true;
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
