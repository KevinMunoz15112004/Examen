import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';
import { MensajeChat, ConversacionChat } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private mensajes$ = new BehaviorSubject<MensajeChat[]>([]);
  private conversaciones$ = new BehaviorSubject<ConversacionChat[]>([]);

  constructor(private supabaseService: SupabaseService) {}

  private subscriptions: Map<string, any> = new Map();

  subscribeToConversacion(contratacionId: string): Observable<MensajeChat[]> {
    const supabase = this.supabaseService.getClient();

    // Validar que contratacionId no esté vacío
    if (!contratacionId || contratacionId.trim() === '') {
      console.warn('⚠️ No hay contratacionId válido');
      return this.mensajes$.asObservable();
    }

    console.log('🔔 Suscribiendo a conversación:', contratacionId);

    // Cargar mensajes iniciales
    this.loadMensajes(contratacionId);

    // Suscribirse a cambios en tiempo real
    if (!this.subscriptions.has(contratacionId)) {
      const subscription = supabase
        .channel(`mensajes:${contratacionId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'mensajes_chat',
            filter: `contratacion_id=eq.${contratacionId}`
          },
          () => {
            console.log('🔄 Cambio detectado en chat, recargando mensajes...');
            this.loadMensajes(contratacionId);
          }
        )
        .subscribe();

      this.subscriptions.set(contratacionId, subscription);
    }

    return this.mensajes$.asObservable();
  }

  private loadMensajes(contratacionId: string): void {
    const supabase = this.supabaseService.getClient();

    // Validar que contratacionId no esté vacío
    if (!contratacionId || contratacionId.trim() === '') {
      console.warn('⚠️ No hay contratacionId válido para cargar mensajes');
      this.mensajes$.next([]);
      return;
    }

    console.log('📥 Cargando mensajes para contratación:', contratacionId);

    from(supabase
      .from('mensajes_chat')
      .select('*')
      .eq('contratacion_id', contratacionId)
      .order('created_at', { ascending: true })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('❌ Error cargando mensajes:', error);
          return [];
        }
        console.log('✅ Mensajes cargados:', data?.length || 0);
        return data as MensajeChat[];
      })
    ).subscribe(mensajes => {
      this.mensajes$.next(mensajes);
      // Marcar como leídos
      this.markAsRead(contratacionId);
    });
  }

  sendMessage(contratacionId: string, usuarioId: string, asesorId: string, mensaje: string): Observable<MensajeChat | null> {
    const supabase = this.supabaseService.getClient();

    console.log('📝 Enviando mensaje - Contratación:', contratacionId, 'Usuario:', usuarioId, 'Asesor:', asesorId);

    // Validar que los IDs no estén vacíos
    if (!contratacionId || contratacionId.trim() === '') {
      console.error('❌ contratacion_id es requerido');
      return from(Promise.resolve(null));
    }

    if (!usuarioId || usuarioId.trim() === '') {
      console.error('❌ usuario_id es requerido');
      return from(Promise.resolve(null));
    }

    return from(supabase
      .from('mensajes_chat')
      .insert([{
        contratacion_id: contratacionId,
        usuario_id: usuarioId,
        asesor_id: asesorId && asesorId.trim() !== '' ? asesorId : null,  // null si está vacío
        mensaje: mensaje,
        leido: false,
        created_at: new Date().toISOString()
      }])
      .select()
      .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('❌ Error enviando mensaje:', error);
          return null;
        }
        console.log('✅ Mensaje enviado exitosamente');
        return data as MensajeChat;
      })
    );
  }

  private markAsRead(contratacionId: string): void {
    const supabase = this.supabaseService.getClient();
    
    // Validar que contratacionId no esté vacío
    if (!contratacionId || contratacionId.trim() === '') {
      console.warn('⚠️ No hay contratacionId válido para marcar como leído');
      return;
    }

    console.log('📝 Marcando mensajes como leídos para contratación:', contratacionId);
    
    supabase
      .from('mensajes_chat')
      .update({ leido: true })
      .eq('contratacion_id', contratacionId)
      .then(
        ({ data, error }) => {
          if (error) {
            console.error('❌ Error marcando como leído:', error);
          } else {
            console.log('✅ Mensajes marcados como leídos');
          }
        }
      );
  }

  getConversaciones(userId: string, isAdvisor: boolean): Observable<ConversacionChat[]> {
    const supabase = this.supabaseService.getClient();

    console.log('📬 Cargando conversaciones para', isAdvisor ? 'asesor' : 'usuario');

    // Si es asesor, usar función RPC que respeta RLS
    if (isAdvisor) {
      return from(supabase.rpc('obtener_conversaciones_asesor')).pipe(
        map((result: any) => {
          console.log('📬 Resultado RPC asesor:', result);
          if (result.error) {
            console.error('❌ Error cargando conversaciones asesor:', result.error);
            return [];
          }
          return (result.data || []) as ConversacionChat[];
        })
      );
    }

    // Si es usuario, usar query normal con RLS
    return from(supabase
      .from('vw_conversaciones_chat')
      .select('*')
      .eq('usuario_id', userId)
      .order('timestamp_ultimo', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('❌ Error cargando conversaciones usuario:', error);
          return [];
        }
        console.log('✅ Conversaciones usuario cargadas:', data?.length || 0);
        return data as ConversacionChat[];
      })
    );
  }

  unsubscribeFromConversacion(contratacionId: string): void {
    const subscription = this.subscriptions.get(contratacionId);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(contratacionId);
    }
  }
}
