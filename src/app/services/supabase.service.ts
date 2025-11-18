import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });

    this.initializeLockErrorHandler();
  }

  private initializeLockErrorHandler(): void {
    if (window && typeof window !== 'undefined') {
      window.addEventListener('error', (event: ErrorEvent) => {
        if (event.message && event.message.includes('NavigatorLock')) {
          console.warn('Lock Manager error detected:', event.message);
          event.preventDefault();
        }
      });

      window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
        if (event.reason && typeof event.reason === 'object' && 
            event.reason.message && event.reason.message.includes('NavigatorLock')) {
          console.warn('Unhandled Lock Manager rejection:', event.reason);
          event.preventDefault();
        }
      });
    }
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }
}
