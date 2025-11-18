import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../../../services/auth.service';
import { PlanesService } from '../../../services/planes.service';
import { ContratacionesService } from '../../../services/contrataciones.service';
import { User, Plan, ContratacionDetalle } from '../../../models';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class DashboardPage implements OnInit {
  currentUser$: Observable<User | null>;
  planes$: Observable<Plan[]>;
  todasLasContrataciones$: Observable<ContratacionDetalle[]>;
  stats$: Observable<any>;

  constructor(
    private authService: AuthService,
    private planesService: PlanesService,
    private contratacionesService: ContratacionesService,
    private router: Router
  ) {
    this.currentUser$ = this.authService.getCurrentUser();
    this.planes$ = this.planesService.getPlanes();
    this.todasLasContrataciones$ = this.contratacionesService.getTodasLasContrataciones();

    this.stats$ = combineLatest([
      this.planes$,
      this.todasLasContrataciones$
    ]).pipe(
      map(([planes, contratos]) => {
        console.log('📊 Stats calculados:');
        console.log('  - Planes:', planes.length);
        console.log('  - Contratos totales recibidos:', contratos.length);
        console.log('  - Contratos estado:', contratos.map(c => ({ id: c.id, estado: c.estado })));
        
        const pendientes = contratos.filter(c => c.estado === 'pendiente');
        const activas = contratos.filter(c => c.estado === 'activa');
        const canceladas = contratos.filter(c => c.estado === 'cancelada');
        
        console.log('  - Pendientes filtrados:', pendientes.length);
        console.log('  - Activas filtradas:', activas.length);
        console.log('  - Canceladas filtradas:', canceladas.length);
        
        return {
          totalPlanes: planes.length,
          contratacionesPendientes: pendientes.length,
          contratacionesActivas: activas.length,
          contratacionesCanceladas: canceladas.length
        };
      })
    );
  }

  ngOnInit() {}

  goToCreatePlan() {
    this.router.navigate(['/advisor/plan-form']);
  }

  goToEditPlan(planId: string) {
    this.router.navigate(['/advisor/plan-form', planId]);
  }

  goToPendingContracts() {
    this.router.navigate(['/advisor/pending-contracts']);
  }

  goToActiveContracts() {
    this.router.navigate(['/advisor/active-contracts']);
  }

  goToCancelledContracts() {
    this.router.navigate(['/advisor/cancelled-contracts']);
  }

  goToChatList() {
    this.router.navigate(['/advisor/chat-list']);
  }

  goToProfile() {
    this.router.navigate(['/advisor/profile']);
  }

  logout() {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/catalog']);
    });
  }
}
