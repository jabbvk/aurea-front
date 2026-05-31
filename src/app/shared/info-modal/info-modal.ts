import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InfoModalService } from './info-modal.service';

@Component({
  selector: 'app-info-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './info-modal.html',
  styles: [`
    .modal-backdrop {
      @apply fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm transition-all duration-300;
      animation: fadeIn 0.2s ease-out;
    }
    .modal-panel {
      @apply w-full max-w-sm mx-4 bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden;
      animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px) scale(0.95); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
  `]
})
export class InfoModal {
  readonly modalService = inject(InfoModalService);

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.close();
    }
  }

  close(): void {
    this.modalService.close();
  }
}
