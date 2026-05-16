import { Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';

export type MovementTab = 'income' | 'expense' | 'asset' | 'debt' | 'cash' | 'emergency-fund';

export interface MovementTabOption {
  label: string;
  value: MovementTab;
  icon: string;
}

export const MOVEMENT_TABS: MovementTabOption[] = [
  { label: 'Ingreso', value: 'income', icon: 'trending_up' },
  { label: 'Gasto', value: 'expense', icon: 'trending_down' },
  { label: 'Activo', value: 'asset', icon: 'savings' },
  { label: 'Deuda', value: 'debt', icon: 'credit_card' },
  { label: 'Traspasar', value: 'cash', icon: 'swap_horiz' },
];

export type ModalOrigin = 'income' | 'expense' | 'asset' | 'debt' | 'cash' | 'emergency-fund' | null;

@Injectable({
  providedIn: 'root',
})
export class RegisterMovementModalService {
  readonly isOpen = signal(false);
  readonly activeTab = signal<MovementTab>('income');
  readonly hideTabs = signal(false);
  readonly origin = signal<ModalOrigin>(null);
  readonly movementRegistered$ = new Subject<void>();

  open(tab: MovementTab = 'income', hideTabs: boolean = false, origin: ModalOrigin = null): void {
    this.activeTab.set(tab);
    this.hideTabs.set(hideTabs);
    this.origin.set(origin);
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }

  setTab(tab: MovementTab): void {
    this.activeTab.set(tab);
  }

  notifyMovementRegistered(): void {
    this.movementRegistered$.next();
  }
}
