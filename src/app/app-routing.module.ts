import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard, AdvisorGuard } from './guards';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'splash',
    pathMatch: 'full'
  },
  {
    path: 'splash',
    loadChildren: () => import('./modules/public/splash/splash.module').then(m => m.SplashPageModule)
  },
  {
    path: 'catalog',
    loadChildren: () => import('./modules/public/catalog/catalog.module').then(m => m.CatalogPageModule)
  },
  {
    path: 'plan-detail/:id',
    loadChildren: () => import('./modules/public/plan-detail/plan-detail.module').then(m => m.PlanDetailPageModule)
  },
  {
    path: 'login',
    loadChildren: () => import('./modules/public/auth/auth.module').then(m => m.AuthPageModule)
  },
  {
    path: 'home',
    loadChildren: () => import('./modules/user/home/home.module').then(m => m.HomePageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'mis-contrataciones',
    loadChildren: () => import('./modules/user/contratos/contratos.module').then(m => m.ContratosPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'chat/:contratacionId',
    loadChildren: () => import('./modules/user/chat/chat.module').then(m => m.ChatPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'profile',
    loadChildren: () => import('./modules/user/profile/profile.module').then(m => m.ProfilePageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'advisor/dashboard',
    loadChildren: () => import('./modules/advisor/dashboard/dashboard.module').then(m => m.DashboardPageModule),
    canActivate: [AuthGuard, AdvisorGuard]
  },
  {
    path: 'advisor/plan-form',
    loadChildren: () => import('./modules/advisor/plan-form/plan-form.module').then(m => m.PlanFormPageModule),
    canActivate: [AuthGuard, AdvisorGuard]
  },
  {
    path: 'advisor/plan-form/:id',
    loadChildren: () => import('./modules/advisor/plan-form/plan-form.module').then(m => m.PlanFormPageModule),
    canActivate: [AuthGuard, AdvisorGuard]
  },
  {
    path: 'advisor/pending-contracts',
    loadChildren: () => import('./modules/advisor/pending-contracts/pending-contracts.module').then(m => m.PendingContractsPageModule),
    canActivate: [AuthGuard, AdvisorGuard]
  },
  {
    path: 'advisor/active-contracts',
    loadComponent: () => import('./modules/advisor/active-contracts/active-contracts.page').then(m => m.ActiveContractsPage),
    canActivate: [AuthGuard, AdvisorGuard]
  },
  {
    path: 'advisor/cancelled-contracts',
    loadComponent: () => import('./modules/advisor/cancelled-contracts/cancelled-contracts.page').then(m => m.CancelledContractsPage),
    canActivate: [AuthGuard, AdvisorGuard]
  },
  {
    path: 'advisor/chat-list',
    loadChildren: () => import('./modules/advisor/chat-list/chat-list.module').then(m => m.ChatListPageModule),
    canActivate: [AuthGuard, AdvisorGuard]
  },
  {
    path: 'advisor/profile',
    loadChildren: () => import('./modules/advisor/profile/profile.module').then(m => m.ProfilePageModule),
    canActivate: [AuthGuard, AdvisorGuard]
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
