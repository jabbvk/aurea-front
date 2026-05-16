import { Component, Input, OnChanges, SimpleChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-rolling-number',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-baseline overflow-hidden h-[1.2em] leading-[1.2em] tabular-nums"
         [style.font-weight]="fontWeight">
      @for (char of characters(); track $index) {
        @if (isDigit(char)) {
          <div class="relative w-[0.6em] h-full flex flex-col transition-transform duration-700"
               [style.transition-delay]="$index * 30 + 'ms'"
               [style.transition-timing-function]="'cubic-bezier(0.34, 1.56, 0.64, 1)'"
               [style.transform]="getTransform(char)">
            @for (num of [0,1,2,3,4,5,6,7,8,9]; track num) {
              <span class="h-[1.2em] flex items-center justify-center">{{ num }}</span>
            }
          </div>
        } @else {
          <span class="px-0.5">{{ char }}</span>
        }
      }
    </div>
  `,
  styles: [`
    :host {
      display: inline-block;
      vertical-align: baseline;
    }
  `]
})
export class RollingNumber implements OnChanges {
  @Input({ required: true }) value: number = 0;
  @Input() prefix: string = '';
  @Input() suffix: string = '';
  @Input() decimals: number = 2;
  @Input() fontWeight: string | number = 'inherit';

  readonly characters = signal<string[]>([]);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value']) {
      this.updateCharacters();
    }
  }

  private updateCharacters(): void {
    // Format number with dots for thousands and comma for decimals (European style)
    const formatted = new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: this.decimals,
      maximumFractionDigits: this.decimals,
    }).format(this.value);
    
    const fullString = `${this.prefix}${formatted}${this.suffix}`;
    this.characters.set(fullString.split(''));
  }

  isDigit(char: string): boolean {
    return /^\d$/.test(char);
  }

  getTransform(char: string): string {
    const digit = parseInt(char, 10);
    return `translateY(-${digit * 1.2}em)`;
  }
}
