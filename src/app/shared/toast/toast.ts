import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from './toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="toast"
          [class.toast-success]="toast.type === 'success'"
          [class.toast-error]="toast.type === 'error'"
          [class.toast-warning]="toast.type === 'warning'"
          [class.toast-info]="toast.type === 'info'"
          (click)="toastService.dismiss(toast.id)">
          <div class="toast-icon">
            <span class="material-symbols-outlined">
              @switch (toast.type) {
                @case ('success') { check_circle }
                @case ('error') { error }
                @case ('warning') { warning }
                @case ('info') { info }
              }
            </span>
          </div>
          <p class="toast-message">{{ toast.message }}</p>
          <button class="toast-close" (click)="toastService.dismiss(toast.id)">
            <span class="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 1.25rem;
      right: 1.25rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.625rem;
      pointer-events: none;
    }

    .toast {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      min-width: 320px;
      max-width: 440px;
      padding: 0.875rem 1rem;
      border-radius: 0.75rem;
      border: 1px solid;
      backdrop-filter: blur(12px);
      box-shadow:
        0 8px 32px rgba(0, 0, 0, 0.12),
        0 2px 8px rgba(0, 0, 0, 0.08);
      pointer-events: auto;
      cursor: pointer;
      animation: toast-in 0.35s cubic-bezier(0.21, 1.02, 0.73, 1) forwards;
      transition: opacity 0.2s, transform 0.2s;
    }

    .toast:hover {
      transform: translateY(-1px);
      box-shadow:
        0 12px 40px rgba(0, 0, 0, 0.16),
        0 4px 12px rgba(0, 0, 0, 0.1);
    }

    @keyframes toast-in {
      from {
        opacity: 0;
        transform: translateX(100%) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateX(0) scale(1);
      }
    }

    .toast-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2rem;
      height: 2rem;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .toast-icon .material-symbols-outlined {
      font-size: 1.125rem;
    }

    .toast-message {
      flex: 1;
      font-size: 0.8125rem;
      font-weight: 500;
      line-height: 1.4;
      margin: 0;
    }

    .toast-close {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 1.5rem;
      height: 1.5rem;
      border-radius: 50%;
      border: none;
      background: transparent;
      cursor: pointer;
      opacity: 0.5;
      transition: opacity 0.15s, background 0.15s;
      flex-shrink: 0;
      padding: 0;
    }

    .toast-close:hover {
      opacity: 1;
      background: rgba(0, 0, 0, 0.08);
    }

    /* ── Success ── */
    .toast-success {
      background: rgba(236, 253, 245, 0.95);
      border-color: rgba(16, 185, 129, 0.2);
      color: #065f46;
    }
    .toast-success .toast-icon {
      background: rgba(16, 185, 129, 0.12);
      color: #059669;
    }

    /* ── Error ── */
    .toast-error {
      background: rgba(254, 242, 242, 0.95);
      border-color: rgba(239, 68, 68, 0.2);
      color: #991b1b;
    }
    .toast-error .toast-icon {
      background: rgba(239, 68, 68, 0.12);
      color: #dc2626;
    }

    /* ── Warning ── */
    .toast-warning {
      background: rgba(255, 251, 235, 0.95);
      border-color: rgba(245, 158, 11, 0.2);
      color: #92400e;
    }
    .toast-warning .toast-icon {
      background: rgba(245, 158, 11, 0.12);
      color: #d97706;
    }

    /* ── Info ── */
    .toast-info {
      background: rgba(239, 246, 255, 0.95);
      border-color: rgba(59, 130, 246, 0.2);
      color: #1e40af;
    }
    .toast-info .toast-icon {
      background: rgba(59, 130, 246, 0.12);
      color: #2563eb;
    }
  `],
})
export class ToastComponent {
  readonly toastService = inject(ToastService);
}
