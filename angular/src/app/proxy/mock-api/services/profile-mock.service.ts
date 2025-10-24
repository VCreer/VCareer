import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

/**
 * Mock Profile Service - Xử lý các API liên quan đến hồ sơ
 * Bao gồm: Get Profile, Update Profile, Upload Avatar, Upload CV
 */
@Injectable({
  providedIn: 'root'
})
export class ProfileMockService {

  private mockProfile = {
    id: 1,
    email: 'candidate@example.com',
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

  /**
   * Mock get profile - Lấy thông tin hồ sơ
   */
  mockGetProfile(): Observable<any> {
    return of({
      success: true,
      data: this.mockProfile
    }).pipe(delay(500));
  }

  /**
   * Mock update profile - Cập nhật thông tin hồ sơ
   */
  mockUpdateProfile(profileData: any): Observable<any> {
    this.mockProfile = { ...this.mockProfile, ...profileData };
    
    return of({
      success: true,
      data: this.mockProfile,
      message: 'Hồ sơ đã được cập nhật thành công'
    }).pipe(delay(800));
  }

  /**
   * Mock upload avatar - Tải lên ảnh đại diện
   */
  mockUploadAvatar(file: File): Observable<any> {
    const avatarUrl = `assets/images/avatars/avatar-${Date.now()}.jpg`;
    this.mockProfile.avatar = avatarUrl;
    
    return of({
      success: true,
      data: { avatarUrl },
      message: 'Ảnh đại diện đã được tải lên thành công'
    }).pipe(delay(1500));
  }

  /**
   * Mock upload CV - Tải lên CV
   */
  mockUploadCV(file: File): Observable<any> {
    const cvUrl = `assets/cv/cv-${Date.now()}.pdf`;
    this.mockProfile.cvUrl = cvUrl;
    
    return of({
      success: true,
      data: { cvUrl },
      message: 'CV đã được tải lên thành công'
    }).pipe(delay(2000));
  }
}
