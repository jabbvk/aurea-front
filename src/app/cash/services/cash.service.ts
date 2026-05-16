import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { Observable, of } from 'rxjs';

import { CashAccount, CashMovement, CashTransferRequest, CashHistoryPageResponse } from '../models/cash.model';

export * from '../models/cash.model';

@Injectable({
  providedIn: 'root',
})
export class CashService {
  private readonly api = inject(ApiService);

  getAccounts(): Observable<CashAccount[]> {
    return this.api.get<CashAccount[]>('/aurea/cash');
  }

  getHistory(page: number = 0, size: number = 10, query: string = ''): Observable<CashHistoryPageResponse> {
    const params: any = {
      page: page.toString(),
      size: size.toString(),
      sort: 'date,desc'
    };

    if (query && query.trim() !== '') {
      params.query = query.trim();
    }

    return this.api.get<CashHistoryPageResponse>('/aurea/cash/history', params);
  }

  transfer(request: CashTransferRequest): Observable<void> {
    return this.api.post<void>('/aurea/cash/transfer', request);
  }
}
