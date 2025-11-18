import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CancelledContractsPage } from './cancelled-contracts.page';

const routes: Routes = [
  {
    path: '',
    component: CancelledContractsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CancelledContractsPageRoutingModule { }
