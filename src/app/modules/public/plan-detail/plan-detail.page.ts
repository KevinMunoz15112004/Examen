import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PlanesService } from '../../../services/planes.service';
import { AuthService } from '../../../services/auth.service';
import { ContratacionesService } from '../../../services/contrataciones.service';
import { Plan } from '../../../models';
import { Observable } from 'rxjs';
import { ToastController, AlertController, IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-plan-detail',
  templateUrl: './plan-detail.page.html',
  styleUrls: ['./plan-detail.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class PlanDetailPage implements OnInit {
  plan: Plan | null = null;
  isAuthenticated$: Observable<boolean>;
  isLoading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private planesService: PlanesService,
    private authService: AuthService,
    private contratacionesService: ContratacionesService,
    private toastController: ToastController,
    private alertController: AlertController
  ) {
    this.isAuthenticated$ = this.authService.isAuthenticated();
  }

  ngOnInit() {
    const planId = this.route.snapshot.paramMap.get('id');
    if (planId) {
      this.planesService.getPlanById(planId).subscribe(
        plan => {
          this.plan = plan;
          this.isLoading = false;
        },
        error => {
          console.error('Error cargando plan:', error);
          this.isLoading = false;
        }
      );
    }
  }

  contratarPlan() {
    console.log('🔍 contratarPlan() - Iniciando...');
    
    try {
      // Obtener usuario actual usando Observable
      this.authService.getCurrentUser().subscribe(
        async (user) => {
          console.log('👤 Usuario obtenido:', user?.id);

          if (!user) {
            console.warn('⚠️ No hay usuario autenticado');
            await this.presentToast('Debes estar autenticado para contratar', 'warning');
            await this.router.navigate(['/login']);
            return;
          }

          if (!this.plan) {
            console.error('❌ Plan no disponible');
            await this.presentToast('Error: Plan no disponible', 'danger');
            return;
          }

          console.log('📋 Plan a contratar:', this.plan.id, this.plan.nombre);

          const alert = await this.alertController.create({
            header: 'Confirmar Contratación',
            message: `¿Deseas contratar el plan <strong>${this.plan.nombre}</strong> por $${this.plan.precio}/mes?`,
            buttons: [
              {
                text: 'Cancelar',
                role: 'cancel',
              },
              {
                text: 'Confirmar',
                handler: async () => {
                  console.log('✅ Usuario confirmó - Creando contratación...');
                  this.contratacionesService.createContratacion(user.id, this.plan!.id, this.plan!.precio).subscribe(
                    async (contratacion) => {
                      console.log('📢 Respuesta del service:', contratacion);
                      if (contratacion) {
                        await this.presentToast('¡Contratación completada!', 'success');
                        await this.router.navigate(['/mis-contrataciones']);
                      } else {
                        await this.presentToast('Error al crear contratación', 'danger');
                      }
                    },
                    async (error) => {
                      console.error('❌ Error en contratación:', error);
                      await this.presentToast('Error en la contratación', 'danger');
                    }
                  );
                },
              },
            ],
          });

          console.log('📣 Mostrando alerta...');
          await alert.present();
        },
        (error) => {
          console.error('💥 Error obteniendo usuario:', error);
          this.presentToast('Error al obtener usuario', 'danger');
        }
      );
    } catch (error) {
      console.error('💥 Error en contratarPlan():', error);
      this.presentToast('Error al procesar contratación', 'danger');
    }
  }

  goBack() {
    this.router.navigate(['/catalog']);
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  private async presentToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'bottom',
    });
    await toast.present();
  }
}
