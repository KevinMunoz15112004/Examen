import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ActiveContractsPageRoutingModule } from './active-contracts-routing.module';
import { ActiveContractsPage } from './active-contracts.page';

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    ActiveContractsPageRoutingModule
  ],
  declarations: [ActiveContractsPage]
})
export class ActiveContractsPageModule { }
