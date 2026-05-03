import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ComingSoonService {
  readonly isOpen = signal(false);
  readonly title = signal('Próximamente');
  readonly featureName = signal('');

  open(featureName: string = '', title: string = 'Próximamente'): void {
    this.featureName.set(featureName);
    this.title.set(title);
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }
}
