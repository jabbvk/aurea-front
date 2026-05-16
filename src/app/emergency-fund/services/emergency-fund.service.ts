import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { Observable } from 'rxjs';

export type CalculationMode = 'FIXED' | 'VARIABLE' | 'MANUAL';

export interface EmergencyFundStatus {
  currentSavings: number;      // Dinero real en el fondo (desde Wallet)
  monthlyExpenses: number;     // Gastos mensuales (calculados por el backend)
  desiredMonths: number;       // Objetivo de meses (3, 6, 12, etc.)
  calculationMode: CalculationMode;
  fundActive: boolean;
  lastMonthChange: number;     // Diferencia ahorrada el mes pasado
}

export interface EmergencyFundUpdate {
  desiredMonths?: number;
  calculationMode?: CalculationMode;
  fundActive?: boolean;
  manualMonthlyExpense?: number; 
}

@Injectable({
  providedIn: 'root',
})
export class EmergencyFundService {
  private readonly api = inject(ApiService);
  private readonly endpoint = '/aurea/emergency-fund';

  getFundStatus(): Observable<EmergencyFundStatus> {
    return this.api.get<EmergencyFundStatus>(this.endpoint);
  }

  updateConfig(config: EmergencyFundUpdate): Observable<EmergencyFundStatus> {
    return this.api.patch<EmergencyFundStatus>(`${this.endpoint}/config`, config);
  }
}
