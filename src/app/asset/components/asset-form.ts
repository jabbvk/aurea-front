import { Component, inject, signal, OnInit, OnDestroy, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ReactiveFormsModule, NonNullableFormBuilder, Validators, FormControl } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, switchMap, takeUntil, of, tap, catchError } from 'rxjs';
import { AssetService } from '../services/asset.service';
import { AssetClass } from '../models/asset.model';
import { CashService, CashAccount } from '../../cash/services/cash.service';
import { AppSelect, SelectOption } from '../../shared/app-select/app-select';
import { OverlayModule } from '@angular/cdk/overlay';

@Component({
  selector: 'app-asset-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AppSelect, OverlayModule],
  providers: [CurrencyPipe],
  templateUrl: './asset-form.html',
  styleUrl: './asset-form.css',
})
export class AssetForm implements OnInit, OnDestroy {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly assetService = inject(AssetService);
  private readonly cashService = inject(CashService);
  private readonly currencyPipe = inject(CurrencyPipe);
  private readonly destroy$ = new Subject<void>();

  readonly searchControl = new FormControl('');
  readonly searchResults = signal<any[]>([]);
  readonly accounts = signal<CashAccount[]>([]);
  readonly isSearching = signal(false);
  readonly showDropdown = signal(false);
  readonly searchError = signal<string | null>(null);
  readonly selectedResult = signal<any | null>(null);
  readonly AssetClass = AssetClass;

  readonly assetClassOptions: SelectOption[] = [
    { value: AssetClass.STOCK, label: 'Acciones / ETFs', icon: 'show_chart' },
    { value: AssetClass.CRYPTO, label: 'Criptomonedas', icon: 'currency_bitcoin' },
    { value: AssetClass.REAL_ESTATE, label: 'Inmuebles', icon: 'home' },
  ];

  accountOptions = computed(() => {
    return this.accounts().map(acc => ({
      label: acc.name,
      value: acc.id,
      icon: 'account_balance',
      sublabel: `Saldo: ${this.currencyPipe.transform(acc.balance, acc.currency)}`
    }));
  });

  readonly form = this.fb.group({
    name: ['', [Validators.required]],
    assetClass: [AssetClass.STOCK],
    ticker: [''],
    purchasePrice: [null as number | null, [Validators.required, Validators.min(0.01)]],
    quantity: [null as number | null, [Validators.required, Validators.min(0.0001)]],
    balanceSource: ['ACCOUNT'],
    cashAccountId: [''],
    payFromAccount: [true],
  });

  get isSearchable(): boolean {
    const cls = this.form.get('assetClass')?.value;
    return [AssetClass.STOCK, AssetClass.CRYPTO].includes(cls ?? AssetClass.STOCK);
  }

  get isRealEstate(): boolean {
    return this.form.get('assetClass')?.value === AssetClass.REAL_ESTATE;
  }

  get priceLabel(): string {
    if (this.isRealEstate) return 'Precio del inmueble';
    return 'Precio por unidad';
  }

  get showQuantity(): boolean {
    return !this.isRealEstate;
  }

  ngOnInit(): void {
    this.cashService.getAccounts().subscribe(accs => {
      this.accounts.set(accs);
      if (accs.length === 0) return;

      // Identificar cuenta de fondo (por flag o por nombre)
      let fundAcc = accs.find(a => a.isEmergencyFund);
      if (!fundAcc) {
        fundAcc = accs.find(a =>
          a.name.toLowerCase().includes('fondo') ||
          a.name.toLowerCase().includes('emergencia')
        );
      }

      // Identificar cuenta de efectivo (la primera que no sea el fondo)
      const cashAcc = accs.find(a => a.id !== fundAcc?.id) || accs[0];

      if (cashAcc && !this.form.get('cashAccountId')?.value) {
        this.form.patchValue({ cashAccountId: cashAcc.id });
      }
    });

    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(query => {
        if (!query || query.length < 2) {
          this.searchResults.set([]);
          this.showDropdown.set(false);
          this.searchError.set(null);
          return;
        }
        this.isSearching.set(true);
        this.searchError.set(null);
      }),
      switchMap(query => {
        if (!query || query.length < 2) return of([]);
        const type = this.form.get('assetClass')?.value ?? 'STOCK';
        return this.assetService.searchMarket(query, type as AssetClass).pipe(
          catchError(() => {
            this.searchError.set('Error al buscar activos. Inténtalo de nuevo.');
            return of([]);
          }),
        );
      }),
      takeUntil(this.destroy$),
    ).subscribe(results => {
      this.searchResults.set(results);
      this.showDropdown.set(results.length > 0 || !!this.searchError());
      this.isSearching.set(false);
    });

    // Reset search when asset class changes
    this.form.get('assetClass')?.valueChanges.pipe(
      takeUntil(this.destroy$),
    ).subscribe(() => {
      this.clearSearch();
      if (this.isRealEstate) {
        this.form.patchValue({ ticker: '', quantity: 1 });
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  selectResult(result: any): void {
    this.selectedResult.set(result);
    this.form.patchValue({
      name: result.name,
      ticker: result.symbol,
    });
    this.searchControl.setValue(result.name, { emitEvent: false });
    this.showDropdown.set(false);
  }

  clearSearch(): void {
    this.searchControl.setValue('', { emitEvent: false });
    this.selectedResult.set(null);
    this.searchResults.set([]);
    this.showDropdown.set(false);
    this.form.patchValue({ name: '', ticker: '' });
  }

  onSearchBlur(): void {
    setTimeout(() => this.showDropdown.set(false), 200);
  }

  onSearchFocus(): void {
    if (this.searchResults().length > 0) {
      this.showDropdown.set(true);
    }
  }

  isValid(): boolean {
    this.form.markAllAsTouched();
    return this.form.valid;
  }

  getFormData() {
    const data = this.form.getRawValue();
    if (this.isRealEstate) {
      data.quantity = 1;
    }
    if (!data.payFromAccount) {
      data.balanceSource = null as any;
      data.cashAccountId = null as any;
    }
    // Rename assetClass to type to match Asset interface if needed by backend
    return {
      ...data,
      type: data.assetClass
    };
  }

  reset(): void {
    this.form.reset({
      name: '',
      assetClass: AssetClass.STOCK,
      ticker: '',
      purchasePrice: null,
      quantity: null,
      balanceSource: 'ACCOUNT',
      cashAccountId: this.accounts().length > 0 ? this.accounts()[0].id : '',
      payFromAccount: true,
    });
    this.clearSearch();
  }
}
