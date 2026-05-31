import { Component, inject, ChangeDetectorRef, OnInit, DestroyRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SellAssetModalService } from './sell-asset-modal.service';
import { AppSelect, SelectOption } from '../app-select/app-select';
import { AssetService } from '../../asset/services/asset.service';
import { CashService, CashAccount } from '../../cash/services/cash.service';
import { ToastService } from '../toast/toast.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-sell-asset-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AppSelect],
  templateUrl: './sell-asset-modal.html',
  styles: [`
    .modal-backdrop {
      @apply fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm transition-all duration-300;
      animation: fadeIn 0.2s ease-out;
    }
    .modal-panel {
      @apply w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden;
      animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px) scale(0.95); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
  `]
})
export class SellAssetModal implements OnInit {
  readonly modalService = inject(SellAssetModalService);
  private readonly assetService = inject(AssetService);
  private readonly cashService = inject(CashService);
  private readonly toastService = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  cashAccounts: CashAccount[] = [];
  isSubmitting = false;

  sellForm = this.fb.group({
    cashAccountId: [''],
    quantity: [null as number | null, [Validators.min(0.000001)]],
    sellPrice: [null as number | null, [Validators.min(0.01)]]
  });

  get accountOptions(): SelectOption[] {
    return [
      { label: 'Operación externa (sin cuenta)', value: '' },
      ...this.cashAccounts.map(acc => ({
        label: acc.name,
        value: acc.id,
        sublabel: acc.currency,
        icon: 'account_balance'
      }))
    ];
  }

  constructor() {
    effect(() => {
      if (this.modalService.isOpen()) {
        this.loadAccounts();
        const asset = this.modalService.selectedAsset();
        if (asset) {
          this.sellForm.get('quantity')?.setValidators([Validators.min(0.000001), Validators.max(asset.quantity)]);
          this.sellForm.get('quantity')?.updateValueAndValidity();
        }
      }
    });
  }

  ngOnInit() {
    // Initialization if needed
  }

  private loadAccounts(): void {
    this.cashService.getAccounts()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (accounts) => {
          this.cashAccounts = accounts;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error fetching cash accounts', err);
          this.toastService.error('Error al cargar cuentas de liquidez');
        }
      });
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.close();
    }
  }

  close(): void {
    if (this.isSubmitting) return;
    this.sellForm.reset();
    this.modalService.close();
  }

  onSubmit(): void {
    if (this.sellForm.invalid || this.isSubmitting) return;
    const asset = this.modalService.selectedAsset();
    if (!asset) return;

    // Validate that quantity does not exceed owned quantity
    const formVals = this.sellForm.value;
    if (formVals.quantity && formVals.quantity > asset.quantity) {
      this.toastService.error(`No puedes vender más de ${asset.quantity} unidades.`);
      return;
    }

    this.isSubmitting = true;

    const request = {
      cashAccountId: formVals.cashAccountId || null,
      quantity: formVals.quantity || null,
      sellPrice: formVals.sellPrice || null
    };

    this.assetService.sellAsset(asset.id, request).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.toastService.success(`Activo ${asset.name} vendido con éxito.`);
        this.modalService.notifyAssetSold();
        this.close();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('Error selling asset:', err);
        const msg = err.error?.message || 'Error al vender el activo.';
        this.toastService.error(msg);
        this.cdr.markForCheck();
      }
    });
  }
}
