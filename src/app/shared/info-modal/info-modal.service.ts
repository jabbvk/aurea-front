import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class InfoModalService {
  readonly isOpen = signal(false);
  readonly title = signal('');
  readonly message = signal('');

  open(title: string, message: string) {
    this.title.set(title);
    this.message.set(message);
    this.isOpen.set(true);
  }

  close() {
    this.isOpen.set(false);
    this.title.set('');
    this.message.set('');
  }
}
