import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdvisorChatPage } from './advisor-chat.page';

const routes: Routes = [
  {
    path: '',
    component: AdvisorChatPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdvisorChatPageRoutingModule { }
