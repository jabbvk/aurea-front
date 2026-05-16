import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Register } from './register/register';
import { Dashboard } from './dashboard/dashboard';
import { ErrorPage } from './error/error';

import { AssetDashboard } from './asset/asset-dashboard';
import { EmergencyFund } from './emergency-fund/emergency-fund';
import { CashDashboard } from './cash/cash-dashboard';
import { LegalComponent } from './legal/legal';
import { authGuard, publicGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Public routes (accessible only if NOT logged in)
  { 
    path: '', 
    component: Login, 
    canActivate: [publicGuard] 
  },
  { 
    path: 'register', 
    component: Register, 
    canActivate: [publicGuard] 
  },

  // Private routes (accessible only if logged in)
  { 
    path: 'dashboard', 
    component: Dashboard, 
    canActivate: [authGuard] 
  },
  { 
    path: 'assets', 
    component: AssetDashboard, 
    canActivate: [authGuard] 
  },
  { 
    path: 'emergency-fund', 
    component: EmergencyFund, 
    canActivate: [authGuard] 
  },
  { 
    path: 'cash', 
    component: CashDashboard, 
    canActivate: [authGuard] 
  },

  // Routes accessible by everyone
  { path: 'help', component: LegalComponent },
  { path: 'privacy', component: LegalComponent },
  { path: 'terms', component: LegalComponent },
  { path: 'error', component: ErrorPage },

  // Catch-all
  { path: '**', redirectTo: '' },
];
