import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { AssetDashboardResponse, AssetPageResponse } from '../models/asset-dashboard.model';

@Injectable({
  providedIn: 'root',
})
export class AssetService {
  private readonly api = inject(ApiService);
  private readonly dashboardEndpoint = '/aurea/assets/dashboard';
  private readonly assetsEndpoint = '/aurea/assets';

  getAssetsDashboard(): Observable<AssetDashboardResponse> {
    return this.api.get<AssetDashboardResponse>(this.dashboardEndpoint);
  }

  getAssets(
    query: string = '',
    page: number = 0,
    size: number = 10,
    sort: string = 'value,desc'
  ): Observable<AssetPageResponse> {
    return this.api.get<AssetPageResponse>(this.assetsEndpoint, {
      query,
      page,
      size,
      sort
    });
  }
}
