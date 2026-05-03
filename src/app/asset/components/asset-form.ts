import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, NonNullableFormBuilder, Validators, FormControl } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, switchMap, takeUntil, of, tap, catchError } from 'rxjs';
import { AssetSearchService, AssetSearchResult } from '../services/asset-search.service';

interface AssetClassOption {
  value: string;
  label: string;
  searchable: boolean;
}

const ASSET_CLASSES: AssetClassOption[] = [
  { value: 'STOCK', label: 'Acción', searchable: true },
  { value: 'ETF', label: 'ETF', searchable: true },
  { value: 'FUND', label: 'Fondo', searchable: true },
  { value: 'CRYPTO', label: 'Criptomoneda', searchable: true },
  { value: 'COMMODITY', label: 'Materia Prima', searchable: true },
  { value: 'REAL_ESTATE', label: 'Inmueble', searchable: false },
  { value: 'CASH', label: 'Efectivo', searchable: false },
];

@Component({
  selector: 'app-asset-form',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './asset-form.html',
  styleUrl: './asset-form.css',
})
export class AssetForm implements OnInit, OnDestroy {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly searchService = inject(AssetSearchService);
  private readonly destroy$ = new Subject<void>();

  readonly assetClasses = ASSET_CLASSES;
  readonly searchControl = new FormControl('');
  readonly searchResults = signal<AssetSearchResult[]>([]);
  readonly isSearching = signal(false);
  readonly showDropdown = signal(false);
  readonly selectedResult = signal<AssetSearchResult | null>(null);

  readonly form = this.fb.group({
    name: ['', [Validators.required]],
    assetClass: ['STOCK'],
    ticker: [''],
    purchasePrice: [null as number | null, [Validators.required, Validators.min(0.01)]],
    quantity: [null as number | null, [Validators.required, Validators.min(0.0001)]],
    payFromWallet: [true],
  });

  get isSearchable(): boolean {
    const cls = this.form.get('assetClass')?.value;
    return ASSET_CLASSES.find(c => c.value === cls)?.searchable ?? false;
  }

  get isRealEstate(): boolean {
    return this.form.get('assetClass')?.value === 'REAL_ESTATE';
  }

  get isCash(): boolean {
    return this.form.get('assetClass')?.value === 'CASH';
  }

  get priceLabel(): string {
    if (this.isRealEstate) return 'Precio del inmueble';
    if (this.isCash) return 'Importe';
    return 'Precio por unidad';
  }

  get showQuantity(): boolean {
    return !this.isRealEstate && !this.isCash;
  }

  ngOnInit(): void {
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(query => {
        if (!query || query.length < 2) {
          this.searchResults.set([]);
          this.showDropdown.set(false);
          return;
        }
        this.isSearching.set(true);
      }),
      switchMap(query => {
        if (!query || query.length < 2) return of([]);
        const type = this.form.get('assetClass')?.value ?? 'STOCK';
        return this.searchService.search(query, type).pipe(
          catchError(() => of([])),
        );
      }),
      takeUntil(this.destroy$),
    ).subscribe(results => {
      this.searchResults.set(results);
      this.showDropdown.set(results.length > 0);
      this.isSearching.set(false);
    });

    // Reset search when asset class changes
    this.form.get('assetClass')?.valueChanges.pipe(
      takeUntil(this.destroy$),
    ).subscribe(() => {
      this.clearSearch();
      if (this.isRealEstate || this.isCash) {
        this.form.patchValue({ ticker: '', quantity: 1 });
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  selectResult(result: AssetSearchResult): void {
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
    // Delay to allow click on dropdown item
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
    // For non-searchable types, quantity is always 1
    if (this.isRealEstate || this.isCash) {
      data.quantity = 1;
    }
    return data;
  }

  reset(): void {
    this.form.reset({
      name: '',
      assetClass: 'STOCK',
      ticker: '',
      purchasePrice: null,
      quantity: null,
      payFromWallet: true,
    });
    this.clearSearch();
  }
}
