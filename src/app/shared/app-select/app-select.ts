import { Component, Input, Output, EventEmitter, signal, ElementRef, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OverlayModule } from '@angular/cdk/overlay';

export interface SelectOption {
  label: string;
  value: any;
  icon?: string;
  sublabel?: string;
}

@Component({
  selector: 'app-select',
  standalone: true,
  imports: [CommonModule, OverlayModule],
  template: `
    <div class="relative w-full" (click)="$event.stopPropagation()">
      @if (label) {
        <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">{{ label }}</label>
      }
      
      <!-- Trigger -->
      <button type="button" (click)="toggle()"
        cdkOverlayOrigin #trigger="cdkOverlayOrigin"
        #triggerBtn
        [disabled]="disabled"
        class="relative w-full flex items-center justify-between pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-left cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary group shadow-sm hover:border-primary/30 disabled:opacity-50 disabled:cursor-not-allowed">
        
        <div class="flex flex-col truncate pr-2">
          <span class="block truncate text-sm font-bold text-slate-900">{{ selectedOption?.label || placeholder }}</span>
          @if (selectedOption?.sublabel) {
            <span class="block truncate text-[10px] text-slate-400 font-bold uppercase tracking-tight">{{ selectedOption?.sublabel }}</span>
          }
        </div>
        
        <span class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <span class="material-symbols-outlined text-slate-300 group-hover:text-slate-500 transition-all duration-300"
            [class.rotate-180]="isOpen()">expand_more</span>
        </span>
      </button>

      <!-- Dropdown -->
      <ng-template
        cdkConnectedOverlay
        [cdkConnectedOverlayOrigin]="trigger"
        [cdkConnectedOverlayOpen]="isOpen()"
        [cdkConnectedOverlayWidth]="dropdownWidth"
        (backdropClick)="isOpen.set(false)"
        [cdkConnectedOverlayHasBackdrop]="true"
        cdkConnectedOverlayBackdropClass="cdk-overlay-transparent-backdrop">
        
        <div class="w-full mt-2 bg-white rounded-2xl shadow-2xl shadow-slate-200 border border-slate-100 py-2 max-h-64 overflow-auto animate-in fade-in zoom-in duration-200 origin-top">
          @for (option of options; track option.value) {
            <button type="button" (click)="select(option)"
              class="relative w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 transition-colors group">
              
              <div class="flex flex-col flex-1 truncate pr-2">
                <span class="truncate text-sm font-bold text-slate-900 group-hover:text-primary transition-colors">{{ option.label }}</span>
                @if (option.sublabel) {
                  <span class="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{{ option.sublabel }}</span>
                }
              </div>

              @if (option.value === value) {
                <span class="material-symbols-outlined text-primary text-[20px]">check_circle</span>
              }
            </button>
          } @empty {
            <div class="px-4 py-6 text-center">
              <p class="text-xs text-slate-400 font-medium italic">No hay opciones disponibles</p>
            </div>
          }
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; }
  `]
})
export class AppSelect {
  @Input() label: string = '';
  @Input() placeholder: string = 'Seleccionar opción';
  @Input() options: SelectOption[] = [];
  @Input() value: any = null;
  @Input() disabled: boolean = false;
  
  @Output() valueChange = new EventEmitter<any>();

  isOpen = signal(false);

  @ViewChild('triggerBtn') triggerBtn!: ElementRef<HTMLButtonElement>;
  dropdownWidth: number = 0;
  private readonly elementRef = inject(ElementRef);

  get selectedOption() {
    return this.options.find(opt => opt.value === this.value);
  }

  toggle() {
    if (!this.disabled) {
      if (!this.isOpen()) {
        this.dropdownWidth = this.triggerBtn ? this.triggerBtn.nativeElement.getBoundingClientRect().width : this.elementRef.nativeElement.getBoundingClientRect().width;
      }
      this.isOpen.set(!this.isOpen());
    }
  }

  select(option: SelectOption) {
    this.value = option.value;
    this.valueChange.emit(this.value);
    this.isOpen.set(false);
  }
}
