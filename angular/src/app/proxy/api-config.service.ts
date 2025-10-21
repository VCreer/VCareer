import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

/**
 * API Configuration Service
 * Quản lý cấu hình API và chuyển đổi giữa mock/real API
 */
@Injectable({
  providedIn: 'root'
})
export class ApiConfigService {
  
  /**
   * Kiểm tra có sử dụng mock API không
   */
  get useMockApi(): boolean {
    return environment.useMockApi || false;
  }

  /**
   * Lấy base URL cho API
   */
  get apiUrl(): string {
    return environment.apiUrl || 'http://localhost:3000/api';
  }

  /**
   * Lấy delay cho mock responses
   */
  get mockDelay(): number {
    return environment.mockDelay || 1000;
  }

  /**
   * Kiểm tra có đang trong production không
   */
  get isProduction(): boolean {
    return environment.production;
  }

  /**
   * Lấy cấu hình debug
   */
  get debugMode(): boolean {
    return !this.isProduction && environment.debug || false;
  }

  /**
   * Log API calls nếu trong debug mode
   */
  logApiCall(method: string, url: string, data?: any): void {
    if (this.debugMode) {
      console.log(`🔗 API ${method}: ${url}`, data);
    }
  }

  /**
   * Log mock API calls
   */
  logMockCall(endpoint: string, data?: any): void {
    if (this.debugMode) {
      console.log(`🎭 Mock API: ${endpoint}`, data);
    }
  }
}
