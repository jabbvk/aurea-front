import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-action-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button 
      (click)="action.emit()" 
      class="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-bold py-2.5 px-5 rounded-lg shadow-lg shadow-primary/30 transition-all transform hover:scale-105 active:scale-95 text-sm">
      <span class="material-symbols-outlined text-[20px]">{{ icon }}</span>
      <span>{{ label }}</span>
    </button>
  `
})
export class ActionButton {
  @Input() label: string = '';
  @Input() icon: string = 'add';
  @Output() action = new EventEmitter<void>();
}
