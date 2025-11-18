import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ContratacionesService } from '../../../services/contrataciones.service';
import { ContratacionDetalle } from '../../../models';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-active-contracts',
  templateUrl: './active-contracts.page.html',
  styleUrls: ['./active-contracts.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class ActiveContractsPage implements OnInit {
  contratacionesActivas$: Observable<ContratacionDetalle[]>;
  isLoading = true;

  constructor(
    private contratacionesService: ContratacionesService,
    private router: Router
  ) {
    this.contratacionesActivas$ = this.contratacionesService.getTodasLasContrataciones().pipe(
      map(contratos => contratos.filter(c => c.estado === 'activa'))
    );
  }

  ngOnInit() {
    this.isLoading = false;
  }

  goBack() {
    this.router.navigate(['/advisor/dashboard']);
  }
}
