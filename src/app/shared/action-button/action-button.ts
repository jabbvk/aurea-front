import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-action-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button 
      [disabled]="disabled"
      (click)="!disabled && action.emit()" 
      [ngClass]="{
        'opacity-50 grayscale cursor-not-allowed pointer-events-none shadow-none': disabled,
        'hover:scale-105 active:scale-95 shadow-lg shadow-primary/30 hover:bg-primary-hover': !disabled
      }"
      class="flex items-center gap-2 bg-primary text-white font-bold py-2.5 px-5 rounded-lg transition-all transform text-sm">
      <span class="material-symbols-outlined text-[20px]">{{ icon }}</span>
      <span>{{ label }}</span>
    </button>
  `
})
export class ActionButton {
  @Input() label: string = '';
  @Input() icon: string = 'add';
  @Input() disabled: boolean = false;
  @Output() action = new EventEmitter<void>();
}
