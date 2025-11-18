import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ContratacionesService } from '../../../services/contrataciones.service';
import { ContratacionDetalle } from '../../../models';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-cancelled-contracts',
  templateUrl: './cancelled-contracts.page.html',
  styleUrls: ['./cancelled-contracts.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class CancelledContractsPage implements OnInit {
  contratacionesCanceladas$: Observable<ContratacionDetalle[]>;
  isLoading = true;

  constructor(
    private contratacionesService: ContratacionesService,
    private router: Router
  ) {
    this.contratacionesCanceladas$ = this.contratacionesService.getTodasLasContrataciones().pipe(
      map(contratos => contratos.filter(c => c.estado === 'cancelada'))
    );
  }

  ngOnInit() {
    this.isLoading = false;
  }

  goBack() {
    this.router.navigate(['/advisor/dashboard']);
  }
}
