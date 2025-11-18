import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AdvisorChatPageRoutingModule } from './advisor-chat-routing.module'
import { AdvisorChatPage } from './advisor-chat.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AdvisorChatPageRoutingModule,
    AdvisorChatPage
  ]
})
export class AdvisorChatPageModule { }
