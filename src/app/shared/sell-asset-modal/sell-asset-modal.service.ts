import { Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { Asset } from '../../asset/models/asset.model';

@Injectable({
  providedIn: 'root'
})
export class SellAssetModalService {
  readonly isOpen = signal(false);
  readonly selectedAsset = signal<Asset | null>(null);
  
  // Emits when a sale is successfully completed
  readonly assetSold$ = new Subject<void>();

  open(asset: Asset) {
    this.selectedAsset.set(asset);
    this.isOpen.set(true);
  }

  close() {
    this.isOpen.set(false);
    this.selectedAsset.set(null);
  }

  notifyAssetSold() {
    this.assetSold$.next();
  }
}
