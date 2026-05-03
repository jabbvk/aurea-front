import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/services/api.service';

export interface AssetSearchResult {
  symbol: string;
  name: string;
  type: string;
  region: string;
  currency: string;
}

@Injectable({
  providedIn: 'root',
})
export class AssetSearchService {
  private readonly api = inject(ApiService);

  search(query: string, type: string): Observable<AssetSearchResult[]> {
    return this.api.get<AssetSearchResult[]>('/aurea/assets/search', { query, type });
  }
}
