import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { CancelledContractsPageRoutingModule } from './cancelled-contracts-routing.module';
import { CancelledContractsPage } from './cancelled-contracts.page';

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    CancelledContractsPageRoutingModule
  ],
  declarations: [CancelledContractsPage]
})
export class CancelledContractsPageModule { }
