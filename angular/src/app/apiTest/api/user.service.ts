import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  userType: 'candidate' | 'recruiter';
  avatar?: string;
  phone?: string;
  address?: string;
  bio?: string;
  skills?: string[];
  experience?: string;
  education?: string;
  cvUrl?: string;
  companyName?: string; // For recruiters
  companySize?: string; // For recruiters
  companyDescription?: string; // For recruiters
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private mockProfile: UserProfile = {
    id: '1',
    email: 'user@example.com',
    fullName: 'Nguyễn Văn A',
    userType: 'candidate',
    avatar: 'assets/images/avatars/default-avatar.png',
    phone: '0123456789',
    address: 'Hồ Chí Minh, Việt Nam',
    bio: 'Frontend Developer với 3 năm kinh nghiệm...',
    skills: ['React', 'TypeScript', 'Angular', 'Vue.js'],
    experience: '3 năm',
    education: 'Đại học Bách Khoa TP.HCM',
    cvUrl: 'assets/cv/nguyen-van-a-cv.pdf'
  };

  constructor() {}

  getProfile(): Observable<UserProfile> {
    return of(this.mockProfile).pipe(delay(300));
  }

  updateProfile(profileData: Partial<UserProfile>): Observable<UserProfile> {
    this.mockProfile = { ...this.mockProfile, ...profileData };
    return of(this.mockProfile).pipe(delay(500));
  }

  uploadAvatar(file: File): Observable<{ avatarUrl: string }> {
    // Simulate file upload
    const avatarUrl = `assets/images/avatars/avatar-${Date.now()}.jpg`;
    this.mockProfile.avatar = avatarUrl;
    return of({ avatarUrl }).pipe(delay(1000));
  }

  uploadCV(file: File): Observable<{ cvUrl: string }> {
    // Simulate file upload
    const cvUrl = `assets/cv/cv-${Date.now()}.pdf`;
    this.mockProfile.cvUrl = cvUrl;
    return of({ cvUrl }).pipe(delay(1500));
  }

  deleteProfile(): Observable<{ success: boolean }> {
    // Reset to default
    this.mockProfile = {
      id: '1',
      email: 'user@example.com',
      fullName: 'Nguyễn Văn A',
      userType: 'candidate',
      avatar: 'assets/images/avatars/default-avatar.png'
    };
    return of({ success: true }).pipe(delay(500));
  }

  getBookmarkedJobs(): Observable<any[]> {
    // Return bookmarked jobs
    return of([
      {
        id: 1,
        title: 'Senior Frontend Developer',
        company: 'TechCorp Vietnam',
        location: 'Hồ Chí Minh',
        salary: '25-35 triệu',
        bookmarkedAt: '2024-01-15'
      }
    ]).pipe(delay(300));
  }

  getAppliedJobs(): Observable<any[]> {
    // Return applied jobs
    return of([
      {
        id: 2,
        title: 'Marketing Manager',
        company: 'Digital Agency',
        location: 'Hà Nội',
        appliedAt: '2024-01-14',
        status: 'pending'
      }
    ]).pipe(delay(300));
  }
}
