import { Component, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComingSoonService } from './coming-soon-service';

@Component({
  selector: 'app-coming-soon-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (comingSoonService.isOpen()) {
    <div class="modal-backdrop" (click)="onBackdropClick($event)">
      <div class="modal-panel max-w-sm">
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 class="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span class="material-symbols-outlined text-primary">rocket_launch</span>
            {{ comingSoonService.title() }}
          </h3>
          <button (click)="close()"
            class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-full p-1 hover:bg-slate-100 dark:hover:bg-white/5">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <!-- Body -->
        <div class="p-8 flex flex-col items-center text-center">
          <div class="size-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
            <span class="material-symbols-outlined text-primary text-4xl">construction</span>
          </div>
          
          <h4 class="text-xl font-bold text-slate-900 dark:text-white mb-2">
            {{ comingSoonService.featureName() || 'Esta funcionalidad' }}
          </h4>
          <p class="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
            Estamos trabajando intensamente para traerte esta característica. Muy pronto estará disponible en tu panel de Aurea.
          </p>
        </div>

        <!-- Footer -->
        <div class="bg-slate-50 dark:bg-[#221010] px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-center">
          <button (click)="close()"
            class="w-full px-5 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white font-semibold shadow-lg shadow-primary/25 transition-all transform active:scale-95 focus:ring-2 focus:ring-offset-2 focus:ring-primary">
            Entendido
          </button>
        </div>
      </div>
    </div>
    }
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      inset: 0;
      z-index: 100;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(15, 23, 42, 0.45);
      backdrop-filter: blur(6px);
      padding: 1rem;
      animation: backdrop-in 0.2s ease-out;
    }

    .modal-panel {
      background: white;
      width: 100%;
      border-radius: 1rem;
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.15), 0 10px 20px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      border: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      animation: panel-in 0.3s cubic-bezier(0.21, 1.02, 0.73, 1);
    }

    :host-context(.dark) .modal-panel {
      background: #1a0c0c;
      border-color: #1e293b;
    }

    @keyframes backdrop-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes panel-in {
      from {
        opacity: 0;
        transform: scale(0.95) translateY(10px);
      }
      to {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }
  `]
})
export class ComingSoonModal {
  readonly comingSoonService = inject(ComingSoonService);

  @HostListener('window:keydown.escape')
  onEscape(): void {
    if (this.comingSoonService.isOpen()) {
      this.close();
    }
  }

  close(): void {
    this.comingSoonService.close();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.close();
    }
  }
}
