import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './shared/toast/toast';
import { RegisterMovementModal } from './shared/register-movement-modal/register-movement-modal';
import { ComingSoonModal } from './shared/coming-soon-modal/coming-soon-modal';
import { InfoModal } from './shared/info-modal/info-modal';
import { SellAssetModal } from './shared/sell-asset-modal/sell-asset-modal';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastComponent, RegisterMovementModal, ComingSoonModal, InfoModal, SellAssetModal],
  template: `
    <router-outlet></router-outlet>
    <app-register-movement-modal></app-register-movement-modal>
    <app-coming-soon-modal></app-coming-soon-modal>
    <app-info-modal></app-info-modal>
    <app-sell-asset-modal></app-sell-asset-modal>
    <app-toast></app-toast>
  `
})
export class App {
  protected readonly title = signal('aurea');
}
