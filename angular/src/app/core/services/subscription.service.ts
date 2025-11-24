import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface SubscriptionServiceDto {
  id: string;
  title: string;
  description: string;
  originalPrice: number;
  isActive: boolean;
  isLimited: boolean;
  isBuyLimited: boolean;
  isLifeTime: boolean;
  dayDuration?: number;
  target: number; // SubcriptorTarget enum
  status: number; // SubcriptionStatus enum
}

@Injectable({
  providedIn: 'root'
})
export class SubscriptionService {
  private apiUrl = environment.apis.default.url || 'https://localhost:44385';

  constructor(private http: HttpClient) {}

  /**
   * Get all active subscription services
   * Uses ABP auto-generated controller: /api/app/subcription-service_/active-subscription-services
   */
  getActiveSubscriptionServices(target?: number): Observable<SubscriptionServiceDto[]> {
    const params = target !== undefined ? `?target=${target}` : '';
    return this.http.get<SubscriptionServiceDto[]>(`${this.apiUrl}/api/app/subcription-service_/active-subscription-services${params}`);
  }

  /**
   * Get subscription service by ID
   */
  getSubscriptionServiceById(id: string): Observable<SubscriptionServiceDto> {
    return this.http.get<SubscriptionServiceDto>(`${this.apiUrl}/api/subscription-services/${id}`);
  }
}

