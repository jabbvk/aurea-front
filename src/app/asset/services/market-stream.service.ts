import { Injectable, NgZone, inject } from '@angular/core';
import { Observable, retry, timer } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { AuthService } from '../../core/services/auth.service';

export interface PriceUpdate {
  symbol: string;
  price: number;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class MarketStreamService {
  private readonly zone = inject(NgZone);
  private readonly authService = inject(AuthService);
  private readonly streamUrl = `${environment.apiUrl}/aurea/assets/prices/stream`;

  /**
   * Returns an observable that emits price updates.
   * Connection is opened when subscribed and closed when unsubscribed.
   */
  getPriceUpdates(): Observable<PriceUpdate> {
    return new Observable<PriceUpdate>(observer => {
      const token = this.authService.getToken();
      const urlWithToken = `${this.streamUrl}?token=${token}`;
      
      console.log('Connecting to price stream...');
      const eventSource = new EventSource(urlWithToken);

      eventSource.addEventListener('price-update', (event: MessageEvent) => {
        this.zone.run(() => {
          try {
            const data: PriceUpdate = JSON.parse(event.data);
            observer.next(data);
          } catch (e) {
            console.error('Error parsing price update data', e);
          }
        });
      });

      eventSource.onerror = (error) => {
        this.zone.run(() => {
          console.error('SSE Connection Error:', error);
          observer.error(error);
        });
      };

      return () => {
        console.log('Closing price stream connection...');
        eventSource.close();
      };
    }).pipe(
      // Automatic retry with exponential backoff
      retry({
        delay: (error, retryCount) => {
          const backoffTime = Math.min(1000 * Math.pow(2, retryCount), 10000);
          console.log(`Retrying SSE connection in ${backoffTime}ms...`);
          return timer(backoffTime);
        }
      })
    );
  }
}
