import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ComingSoonService } from '../coming-soon-modal/coming-soon-service';
import { filter } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  private readonly router = inject(Router);
  readonly comingSoonService = inject(ComingSoonService);

  readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ),
    { initialValue: { urlAfterRedirects: this.router.url } as any }
  );

  isActive(url: string): boolean {
    const current = this.currentUrl()?.urlAfterRedirects || this.router.url;
    return url === '/dashboard' ? current === url : current.startsWith(url);
  }
}
