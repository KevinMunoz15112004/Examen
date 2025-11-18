import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ActiveContractsPage } from './active-contracts.page';

const routes: Routes = [
  {
    path: '',
    component: ActiveContractsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ActiveContractsPageRoutingModule { }
