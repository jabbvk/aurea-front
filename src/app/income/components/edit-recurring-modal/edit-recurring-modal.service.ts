import { Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { RecurringIncomeResponse } from '../../models/income.model';

@Injectable({
  providedIn: 'root'
})
export class EditRecurringModalService {
  readonly isOpen = signal(false);
  readonly selectedIncome = signal<RecurringIncomeResponse | null>(null);
  
  readonly incomeUpdated$ = new Subject<void>();

  open(income: RecurringIncomeResponse) {
    this.selectedIncome.set(income);
    this.isOpen.set(true);
  }

  close() {
    this.isOpen.set(false);
    this.selectedIncome.set(null);
  }

  notifyIncomeUpdated() {
    this.incomeUpdated$.next();
  }
}
