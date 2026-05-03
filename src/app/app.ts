import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './shared/toast/toast';
import { RegisterMovementModal } from './shared/register-movement-modal/register-movement-modal';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastComponent, RegisterMovementModal],
  template: `
    <router-outlet></router-outlet>
    <app-register-movement-modal></app-register-movement-modal>
    <app-toast></app-toast>
  `
})
export class App {
  protected readonly title = signal('aurea');
}
