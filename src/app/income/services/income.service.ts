import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { Observable } from 'rxjs';
import {
  IncomePageResponse,
  IncomeSummaryResponse,
  RecurringIncomeResponse,
  IncomeResponse,
  IncomeRequest
} from '../models/income.model';

@Injectable({
  providedIn: 'root'
})
export class IncomeService {
  private readonly api = inject(ApiService);
  private readonly apiUrl = '/aurea/incomes';

  getHistory(page: number = 0, size: number = 10, query?: string, month?: number, year?: number): Observable<IncomePageResponse> {
    const params: any = {
      page: page.toString(),
      size: size.toString()
    };
    if (query) params.query = query;
    if (month !== undefined) params.month = month.toString();
    if (year !== undefined) params.year = year.toString();

    return this.api.get<IncomePageResponse>(this.apiUrl, params);
  }

  getSummary(month: number, year: number): Observable<IncomeSummaryResponse> {
    return this.api.get<IncomeSummaryResponse>(`${this.apiUrl}/summary`, {
      month: month.toString(),
      year: year.toString()
    });
  }

  getRecurring(): Observable<RecurringIncomeResponse[]> {
    return this.api.get<RecurringIncomeResponse[]>(`${this.apiUrl}/recurring`);
  }

  createIncome(request: IncomeRequest): Observable<IncomeResponse> {
    return this.api.post<IncomeResponse>(this.apiUrl, request);
  }

  updateRecurring(id: string, request: IncomeRequest): Observable<RecurringIncomeResponse> {
    return this.api.put<RecurringIncomeResponse>(`${this.apiUrl}/recurring/${id}`, request);
  }

  forceCollectRecurring(id: string): Observable<void> {
    return this.api.post<void>(`${this.apiUrl}/recurring/${id}/collect`, {});
  }
}
