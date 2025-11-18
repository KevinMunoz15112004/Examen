import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ContratacionesService } from '../../../services/contrataciones.service';
import { ContratacionDetalle } from '../../../models';
import { Observable, BehaviorSubject, switchMap  } from 'rxjs';
import { ToastController, AlertController, IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-pending-contracts',
  templateUrl: './pending-contracts.page.html',
  styleUrls: ['./pending-contracts.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class PendingContractsPage implements OnInit {
  private refreshSubject = new BehaviorSubject<void>(undefined);
  contratacionesPendientes$: Observable<ContratacionDetalle[]>;
  isLoading = true;

  constructor(
    private contratacionesService: ContratacionesService,
    private router: Router,
    private toastController: ToastController,
    private alertController: AlertController
  ) {
    this.contratacionesPendientes$ = this.refreshSubject.pipe(
      switchMap(() => this.contratacionesService.getContratacionesPendientes())
    );
  }

  ngOnInit() {
    this.isLoading = false;
    this.refreshSubject.next(undefined);
  }

  goBack() {
    this.router.navigate(['/advisor/dashboard']);
  }

  async aprobarContratacion(contratacionId: string) {
    const alert = await this.alertController.create({
      header: 'Aprobar Contratación',
      message: '¿Deseas aprobar esta contratación?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Aprobar',
          handler: () => {
            console.log('Aprobando contratación:', contratacionId);
            this.contratacionesService.actualizarEstadoContratacion(contratacionId, 'activa').subscribe(
              async success => {
                console.log('Resultado de aprobación:', success);
                if (success) {
                  await this.presentToast('¡Contratación aprobada!', 'success');

                  setTimeout(() => {
                    this.refreshSubject.next(undefined);
                  }, 500);
                } else {
                  await this.presentToast('Error al aprobar', 'danger');
                }
              },
              error => {
                console.error('Error en aprobación:', error);
                this.presentToast('Error al aprobar la contratación', 'danger');
              }
            );
          },
        },
      ],
    });

    await alert.present();
  }

  async rechazarContratacion(contratacionId: string) {
    const alert = await this.alertController.create({
      header: 'Rechazar Contratación',
      message: '¿Deseas rechazar esta contratación?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Rechazar',
          handler: () => {
            console.log('Rechazando contratación:', contratacionId);
            this.contratacionesService.actualizarEstadoContratacion(contratacionId, 'cancelada').subscribe(
              async success => {
                console.log('Resultado de rechazo:', success);
                if (success) {
                  await this.presentToast('¡Contratación rechazada!', 'success');

                  setTimeout(() => {
                    this.refreshSubject.next(undefined);
                  }, 500);
                } else {
                  await this.presentToast('Error al rechazar', 'danger');
                }
              },
              error => {
                console.error('Error en rechazo:', error);
                this.presentToast('Error al rechazar la contratación', 'danger');
              }
            );
          },
        },
      ],
    });

    await alert.present();
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
