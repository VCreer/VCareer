import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// Interfaces matching your backend DTOs
export interface UpdatePersonalInfoDto {
  name: string;
  surname: string;
  email: string;
  phoneNumber: string;
  bio?: string;
  dateOfBirth?: Date;
  gender?: boolean;
  location?: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ProfileDto {
  id: string;
  name: string;
  surname: string;
  email: string;
  phoneNumber: string;
  bio?: string;
  dateOfBirth?: Date;
  gender?: boolean;
  location?: string;
  address?: string;
  nationality?: string;
  maritalStatus?: string;
  userName: string;
  emailConfirmed: boolean;
  phoneNumberConfirmed: boolean;
  creationTime: Date;
  lastModificationTime?: Date;
  userType: string; // Candidate, Employee, Recruiter
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private baseUrl = environment.apis.default.url; // https://localhost:44385
  private apiEndpoint = '/api/profile';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    // Simple headers since auth is disabled
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  /**
   * Get current user profile
   */
  getCurrentUserProfile(): Observable<ProfileDto> {
    return this.http.get<ProfileDto>(`${this.baseUrl}${this.apiEndpoint}`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Update personal information
   */
  updatePersonalInfo(data: UpdatePersonalInfoDto): Observable<ProfileDto> {
    return this.http.put<ProfileDto>(`${this.baseUrl}${this.apiEndpoint}/personal-info`, data, {
      headers: this.getHeaders()
    });
  }

  /**
   * Change password
   */
  changePassword(data: ChangePasswordDto): Observable<any> {
    return this.http.put(`${this.baseUrl}${this.apiEndpoint}/change-password`, data, {
      headers: this.getHeaders()
    });
  }

  /**
   * Delete account (soft delete)
   */
  deleteAccount(): Observable<any> {
    return this.http.delete(`${this.baseUrl}${this.apiEndpoint}/account`, {
      headers: this.getHeaders()
    });
  }
}

