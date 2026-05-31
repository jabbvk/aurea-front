import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { DashboardData, DashboardPeriod } from '../models/dashboard.model';
import { AuthService } from '../../core/services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly endpoint = '/aurea/dashboard';

  getDashboard(period: DashboardPeriod = DashboardPeriod.LAST_MONTH): Observable<DashboardData> {
    return this.api.get<DashboardData>(this.endpoint, { period });
  }

  getDashboardStream(): Observable<any> {
    return new Observable(observer => {
      const token = this.auth.getToken();
      const eventSource = new EventSource(`${this.api.getBaseUrl()}/aurea/dashboard/stream?token=${token}`);
      
      eventSource.addEventListener('dashboard-update', (event: MessageEvent) => {
        observer.next(JSON.parse(event.data));
      });

      eventSource.onerror = (error) => {
        observer.error(error);
      };

      return () => {
        eventSource.close();
      };
    });
  }
}
