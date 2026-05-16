import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-error-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
      <div class="flex items-center gap-3 mb-2">
        <span class="material-symbols-outlined text-3xl text-red-500">{{ icon }}</span>
        <h3 class="text-xl font-bold text-slate-900">{{ title }}</h3>
      </div>
      @if (message) {
        <p class="text-slate-500 max-w-md mx-auto leading-relaxed">
          {{ message }}
        </p>
      }
      @if (showRetry) {
        <button 
          (click)="retry.emit()"
          class="mt-6 px-6 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-bold transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2">
          <span class="material-symbols-outlined text-[18px]">refresh</span>
          Reintentar
                </button>
            }
        </div>
    `,
    styles: [`
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
            animation: fadeIn 0.4s ease-out forwards;
        }
    `]
})
export class ErrorState {
    @Input() title: string = 'Ha ocurrido un error';
    @Input() message: string = '';
    @Input() icon: string = 'cloud_off';
    @Input() showRetry: boolean = true;
    @Output() retry = new EventEmitter<void>();
}
