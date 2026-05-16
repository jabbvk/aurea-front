import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { 
  AssetDashboardResponse, 
  AssetPageResponse, 
  Asset, 
  AssetClass 
} from '../models/asset.model';

@Injectable({
  providedIn: 'root',
})
export class AssetService {
  private readonly api = inject(ApiService);
  private readonly apiUrl = '/aurea/assets';

  // Paleta de 15 colores Premium (vibrantes pero elegantes para modo oscuro)
  private readonly PALETTE = [
    '#3b82f6', // Azul
    '#10b981', // Esmeralda
    '#f59e0b', // Ámbar
    '#ef4444', // Rojo
    '#8b5cf6', // Violeta
    '#ec4899', // Rosa
    '#06b6d4', // Cian
    '#f97316', // Naranja
    '#14b8a6', // Teal
    '#6366f1', // Índigo
    '#84cc16', // Lima
    '#a855f7', // Púrpura
    '#d946ef', // Fuchsia
    '#f43f5e', // Rosa Intenso
    '#22d3ee'  // Cielo
  ];

  /**
   * Genera un color consistente basado en el ticker del activo.
   * El mismo ticker siempre devolverá el mismo color.
   */
  getAssetColor(ticker: string): string {
    if (!ticker) return this.PALETTE[0];
    
    let hash = 0;
    for (let i = 0; i < ticker.length; i++) {
      hash = ticker.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const index = Math.abs(hash) % this.PALETTE.length;
    return this.PALETTE[index];
  }

  getDashboard(): Observable<AssetDashboardResponse> {
    return this.api.get<AssetDashboardResponse>(`${this.apiUrl}/dashboard`);
  }

  getAssetsPage(
    page: number = 0, 
    size: number = 10, 
    query: string = ''
  ): Observable<AssetPageResponse> {
    return this.api.get<AssetPageResponse>(this.apiUrl, {
      page: page.toString(), 
      size: size.toString(), 
      query, 
      sort: 'purchaseDate,desc' 
    });
  }

  searchMarket(query: string, type: AssetClass): Observable<any[]> {
    return this.api.get<any[]>(`${this.apiUrl}/search`, { query, type });
  }

  updateValue(assetId: string, newValue: number): Observable<Asset> {
    return this.api.patch<Asset>(`${this.apiUrl}/${assetId}/value`, { 
      currentValue: newValue 
    });
  }

  sellAsset(assetId: string, cashAccountId: string): Observable<void> {
    return this.api.post<void>(`${this.apiUrl}/${assetId}/sell`, { 
      cashAccountId 
    });
  }

  createAsset(data: any): Observable<Asset> {
    return this.api.post<Asset>(this.apiUrl, data);
  }
}
