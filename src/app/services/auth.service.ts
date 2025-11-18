import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';
import { User, UserProfile, AuthResponse, UserRole } from '../models';
import * as bcryptjs from 'bcryptjs';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private currentUser$ = new BehaviorSubject<User | null>(null);
    private isAuthenticated$ = new BehaviorSubject<boolean>(false);

    constructor(private supabaseService: SupabaseService) {
        this.initializeAuth();
    }

    private initializeAuth(): void {
        const supabase = this.supabaseService.getClient();

        // Verificar sesión existente
        supabase.auth.getSession().then(({ data }) => {
            if (data.session?.user) {
                this.loadUserProfile(data.session.user.id);
            }
        });

        // Escuchar cambios de autenticación
        supabase.auth.onAuthStateChange((event, session) => {
            if (session?.user) {
                this.loadUserProfile(session.user.id);
                this.isAuthenticated$.next(true);
            } else {
                this.currentUser$.next(null);
                this.isAuthenticated$.next(false);
            }
        });
    }

    private loadUserProfile(userId: string): void {
        const supabase = this.supabaseService.getClient();

        // Primero, obtener el email del usuario autenticado
        supabase.auth.getUser().then(({ data: { user }, error: userError }) => {
            if (userError || !user) {
                console.error('Error getting user:', userError);
                return;
            }

            // Luego, obtener el perfil del usuario
            from(supabase
                .from('perfiles')
                .select('*')
                .match({ user_id: userId })
                .single()
            ).pipe(
                map(({ data, error }) => {
                    if (error || !data) return null;
                    return {
                        id: data.user_id,
                        email: user.email || '', // Usar el email del usuario autenticado
                        full_name: data.full_name,
                        phone: data.phone,
                        role: data.rol as UserRole,
                        avatar_url: data.avatar_url,
                        created_at: data.created_at,
                        updated_at: data.updated_at
                    } as User;
                })
            ).subscribe(user => {
                if (user) {
                    this.currentUser$.next(user);
                }
            });
        });
    }

    register(email: string, password: string, fullName: string, phone?: string): Observable<AuthResponse> {
        const supabase = this.supabaseService.getClient();

        return from(
            supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`
                }
            })
        ).pipe(
            switchMap(async ({ data, error }) => {
                if (error) {
                    return { error: error.message || 'Error en el registro' } as AuthResponse;
                }

                if (!data.user) {
                    return { error: 'Usuario no creado' } as AuthResponse;
                }

                const userId = data.user.id;

                try {
                    // IMPORTANTE: Esperar 500ms para que el usuario se propague en la BD
                    // Supabase necesita tiempo para sincronizar auth.users entre servidores
                    await new Promise(resolve => setTimeout(resolve, 500));

                    // Llamar función SQL segura que bypassa RLS
                    // Esta función usa SECURITY DEFINER y crea el perfil sin problemas
                    const { error: funcError, data: funcResult } = await supabase
                        .rpc('crear_perfil_usuario', {
                            p_user_id: userId,
                            p_full_name: fullName,
                            p_phone: phone || null,
                            p_rol: 'usuario_registrado'
                        });

                    if (funcError) {
                        console.error('Error en función crear_perfil_usuario:', funcError);
                        return {
                            error: `Error al crear perfil: ${funcError.message}`,
                            user: null
                        } as AuthResponse;
                    }

                    console.log('Perfil creado exitosamente:', funcResult);

                    // 🔥 MAPEO CORRECTO AL MODELO User
                    const mappedUser: User = {
                        id: data.user.id,
                        email: data.user.email ?? '',
                        full_name: fullName,
                        phone: phone || undefined,
                        role: 'usuario_registrado',
                        avatar_url: undefined,
                        created_at: data.user.created_at ?? '',
                        updated_at: data.user.updated_at ?? ''
                    };

                    this.currentUser$.next(mappedUser);
                    this.isAuthenticated$.next(true);

                    return {
                        user: mappedUser,
                        session: data.session ?? null,
                        error: null
                    } as AuthResponse;
                } catch (err: any) {
                    console.error('Error en registro:', err);
                    return {
                        error: err?.message || 'Error desconocido en registro',
                        user: null
                    } as AuthResponse;
                }
            })
        );
    }

    login(email: string, password: string): Observable<AuthResponse> {
        const supabase = this.supabaseService.getClient();

        return from(supabase.auth.signInWithPassword({
            email,
            password
        })).pipe(
            switchMap(({ data, error }) => {
                if (error) {
                    // Manejar errores de lock manager
                    if (error.message && error.message.includes('NavigatorLock')) {
                        console.warn('Lock manager error, retrying...', error);
                        // Reintentar después de un pequeño delay
                        return Promise.resolve({ error: 'Intenta nuevamente. Error de sincronización.' } as AuthResponse);
                    }
                    return Promise.resolve({ error: error.message } as AuthResponse);
                }

                if (data.user) {
                    this.loadUserProfile(data.user.id);
                }

                return Promise.resolve({ user: data.user as any } as AuthResponse);
            }),
            catchError((err: any) => {
                console.error('Login error:', err);
                const errorMessage = err?.message || 'Error al iniciar sesión';

                // Manejar errores de lock manager
                if (errorMessage.includes('NavigatorLock') || errorMessage.includes('lock')) {
                    return Promise.resolve({ error: 'Intenta nuevamente. Por favor espera un momento.' } as AuthResponse);
                }

                return Promise.resolve({ error: errorMessage } as AuthResponse);
            })
        );
    }

    loginAdvisor(email: string, password: string): Observable<AuthResponse> {
        const supabase = this.supabaseService.getClient();

        // Primero, cerrar cualquier sesión activa para evitar conflictos
        return from(supabase.auth.signOut()).pipe(
            switchMap(() => {
                // Luego, buscar en la tabla de asesores
                return from(supabase
                    .from('asesores')
                    .select('*')
                    .eq('email', email)
                    .single()
                );
            }),
            switchMap(async ({ data: advisor, error: advisorError }) => {
                if (advisorError || !advisor) {
                    return { error: 'Credenciales de asesor no válidas' } as AuthResponse;
                }

                try {
                    // Obtener el campo de contraseña (puede ser password o password_hash)
                    const passwordField = advisor.password || advisor.password_hash;

                    if (!passwordField) {
                        console.error('No hay campo de contraseña en el registro del asesor');
                        return { error: 'Error en configuración de asesor' } as AuthResponse;
                    }

                    let isPasswordValid = false;

                    // Si la contraseña parece estar hasheada (comienza con $2a$ o $2b$), usar bcryptjs
                    if (passwordField.startsWith('$2a$') || passwordField.startsWith('$2b$')) {
                        isPasswordValid = await bcryptjs.compare(password, passwordField);
                    } else {
                        // Si no está hasheada, comparar directamente (para pruebas)
                        isPasswordValid = password === passwordField;
                    }

                    if (!isPasswordValid) {
                        return { error: 'Contraseña incorrecta' } as AuthResponse;
                    }

                    // Validar que el asesor está activo
                    if (advisor.activo === false) {
                        return { error: 'Asesor inactivo' } as AuthResponse;
                    }

                    // Crear objeto de usuario para el asesor
                    const asesorUser: User = {
                        id: advisor.id,
                        email: advisor.email,
                        full_name: advisor.nombre || advisor.full_name,
                        phone: advisor.telefono,
                        role: 'asesor_comercial',
                        avatar_url: advisor.foto_perfil,
                        created_at: advisor.created_at,
                        updated_at: advisor.updated_at
                    };

                    // Actualizar estado global del usuario
                    this.currentUser$.next(asesorUser);
                    this.isAuthenticated$.next(true);

                    // Retornar datos del asesor
                    return {
                        user: asesorUser
                    } as AuthResponse;
                } catch (error) {
                    console.error('Error en validación de contraseña:', error);
                    return { error: 'Error al validar credenciales' } as AuthResponse;
                }
            })
        );
    }

    logout(): Observable<void> {
        const supabase = this.supabaseService.getClient();
        return from(supabase.auth.signOut()).pipe(
            map(() => {
                this.currentUser$.next(null);
                this.isAuthenticated$.next(false);

                // Limpiar almacenamiento
                localStorage.clear();
                sessionStorage.clear();
                
                // Forzar recarga de página para limpiar completamente
                setTimeout(() => {
                    window.location.reload();
                }, 300);
            })
        );
    }

    getCurrentUser(): Observable<User | null> {
        return this.currentUser$.asObservable();
    }

    isAuthenticated(): Observable<boolean> {
        return this.isAuthenticated$.asObservable();
    }

    getUserRole(): Observable<UserRole | null> {
        return this.currentUser$.pipe(
            map(user => user?.role || null)
        );
    }

    isAdvisor(): Observable<boolean> {
        return this.currentUser$.pipe(
            map(user => user?.role === 'asesor_comercial')
        );
    }
}
