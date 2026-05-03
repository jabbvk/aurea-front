import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { DashboardData, DashboardPeriod } from '../models/dashboard.model';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private readonly api = inject(ApiService);
  private readonly endpoint = '/aurea/dashboard';

  getDashboard(period: DashboardPeriod = DashboardPeriod.LAST_MONTH): Observable<DashboardData> {
    return this.api.get<DashboardData>(this.endpoint, { period });
  }
}
