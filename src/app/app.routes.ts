import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Dashboard } from './dashboard/dashboard';
import { ErrorPage } from './error/error';

import { AssetDashboard } from './asset/asset-dashboard';
import { LegalComponent } from './legal/legal';

export const routes: Routes = [
  { path: '', component: Login },
  { path: 'dashboard', component: Dashboard },
  { path: 'assets', component: AssetDashboard },
  { path: 'help', component: LegalComponent },
  { path: 'privacy', component: LegalComponent },
  { path: 'terms', component: LegalComponent },
  { path: 'error', component: ErrorPage },
  { path: '**', redirectTo: '' },
];
