import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { Observable, of } from 'rxjs';

export interface CashSummary {
  walletBalance: number;
  emergencyFundBalance: number;
  totalLiquidCash: number;
  monthlyChange: number;
  monthlyChangePercentage: number;
}

@Injectable({
  providedIn: 'root',
})
export class CashService {
  private readonly api = inject(ApiService);

  getCashSummary(): Observable<CashSummary> {
    // For now, return mock data since we are building the UI
    return of({
      walletBalance: 12500.50,
      emergencyFundBalance: 45000.00,
      totalLiquidCash: 57500.50,
      monthlyChange: 1250.75,
      monthlyChangePercentage: 2.3
    });
  }
}
