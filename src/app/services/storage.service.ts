import { Injectable } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private supabase: SupabaseClient;
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; 
  private readonly ALLOWED_FORMATS = ['image/jpeg', 'image/png'];

  constructor(supabaseService: SupabaseService) {
    this.supabase = supabaseService.getClient();
  }

  async uploadPlanImage(file: File, planId: string): Promise<string | null> {
    try {
      if (!this.validateFile(file)) {
        throw new Error('Archivo no válido. Solo se aceptan JPG/PNG con máximo 5MB');
      }

      const fileName = `plan-${planId}-${Date.now()}.${file.name.split('.').pop()}`;
      const filePath = `planes/${fileName}`;

      const arrayBuffer = await file.arrayBuffer();
      
      const { error, data } = await this.supabase.storage
        .from('planes-imagenes')
        .upload(filePath, arrayBuffer, {
          cacheControl: '3600',
          contentType: file.type,
          upsert: false
        });

      if (error) {
        console.error('Error subiendo imagen:', error);
        console.error('Detalles del error:', {
          message: error.message,
          status: (error as any).status,
          statusCode: (error as any).statusCode
        });
        return null;
      }

      const { data: publicUrl } = this.supabase.storage
        .from('planes-imagenes')
        .getPublicUrl(filePath);

      return publicUrl.publicUrl;
    } catch (error) {
      console.error('Error en uploadPlanImage:', error);
      return null;
    }
  }

  async deleteImage(filePath: string): Promise<boolean> {
    try {
      if (!filePath) return false;

      let path = filePath;
      if (filePath.includes('planes-imagenes')) {
        const parts = filePath.split('planes-imagenes/');
        if (parts.length > 1) {
          path = parts[1];
        }
      }

      const { error } = await this.supabase.storage
        .from('planes-imagenes')
        .remove([path]);

      if (error) {
        console.error('Error eliminando imagen:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error en deleteImage:', error);
      return false;
    }
  }

  async uploadAvatar(file: File, userId: string): Promise<string | null> {
    try {
      if (!this.validateFile(file)) {
        throw new Error('Archivo no válido');
      }

      const fileName = `avatar-${userId}-${Date.now()}.${file.name.split('.').pop()}`;
      const filePath = `avatars/${fileName}`;

      const { error, data } = await this.supabase.storage
        .from('planes-imagenes')
        .upload(filePath, file, {
          cacheControl: '3600',
          contentType: file.type,
          upsert: false
        });

      if (error) {
        console.error('Error subiendo avatar:', error);
        return null;
      }

      const { data: publicUrl } = this.supabase.storage
        .from('planes-imagenes')
        .getPublicUrl(filePath);

      return publicUrl.publicUrl;
    } catch (error) {
      console.error('Error en uploadAvatar:', error);
      return null;
    }
  }

  private validateFile(file: File): boolean {
    if (!file) return false;
    if (file.size > this.MAX_FILE_SIZE) return false;
    if (!this.ALLOWED_FORMATS.includes(file.type)) return false;
    return true;
  }

  getPublicUrl(bucket: string, filePath: string): string {
    const { data } = this.supabase.storage.from(bucket).getPublicUrl(filePath);
    return data.publicUrl;
  }
}
