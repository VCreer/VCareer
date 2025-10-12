import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpResponse } from '@angular/common/http';

/**
 * Mock Profile Service - Xử lý các API liên quan đến profile
 * Bao gồm: Get Profile, Update Profile, Upload Avatar, Upload CV
 */
@Injectable({
  providedIn: 'root'
})
export class ProfileMockService {

  /**
   * Mock get profile - Lấy thông tin profile
   * @returns Observable của profile response
   */
  mockGetProfile(): Observable<HttpResponse<any>> {
    return new Observable(observer => {
      setTimeout(() => {
        const mockProfile = {
          id: 1,
          fullName: 'Uông Hoàng Duy',
          email: 'duyuong0273@gmail.com',
          phone: '0966211316',
          dateOfBirth: '1995-03-15',
          gender: 'male',
          address: '123 Đường ABC, Quận 1, TP. Hồ Chí Minh',
          city: 'TP. Hồ Chí Minh',
          country: 'Việt Nam',
          bio: 'Tôi là một developer có kinh nghiệm với 5 năm làm việc trong lĩnh vực công nghệ thông tin. Tôi có đam mê với việc phát triển các ứng dụng web hiện đại và luôn tìm kiếm những thách thức mới.',
          website: 'https://nguyenvana.com',
          linkedin: 'https://linkedin.com/in/nguyenvana',
          github: 'https://github.com/nguyenvana',
          avatarUrl: '',
          cvFileName: '',
          topConnectEnabled: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T10:30:00Z'
        };

        observer.next(new HttpResponse({
          status: 200,
          body: {
            success: true,
            data: mockProfile
          }
        }));
        observer.complete();
      }, 1000);
    });
  }

  /**
   * Mock update profile - Cập nhật thông tin profile
   * @param profileData - Thông tin profile mới
   * @returns Observable của update profile response
   */
  mockUpdateProfile(profileData: any): Observable<HttpResponse<any>> {
    return new Observable(observer => {
      setTimeout(() => {
        // Validate required fields
        const errors: any = {};
        
        if (!profileData.fullName?.trim()) {
          errors.fullName = 'Họ và tên là bắt buộc';
        }
        
        if (!profileData.phone?.trim()) {
          errors.phone = 'Số điện thoại là bắt buộc';
        } else if (!/^[0-9]{10,11}$/.test(profileData.phone)) {
          errors.phone = 'Số điện thoại phải có 10-11 chữ số';
        }
        
        if (!profileData.address?.trim()) {
          errors.address = 'Địa chỉ là bắt buộc';
        }
        
        if (!profileData.dateOfBirth) {
          errors.dateOfBirth = 'Ngày sinh là bắt buộc';
        }
        
        if (!profileData.gender) {
          errors.gender = 'Giới tính là bắt buộc';
        }

        // Nếu có lỗi validation
        if (Object.keys(errors).length > 0) {
          observer.next(new HttpResponse({
            status: 400,
            body: {
              success: false,
              message: 'Dữ liệu không hợp lệ',
              errors: errors
            }
          }));
        } else {
          // Cập nhật thành công
          const updatedProfile = {
            ...profileData,
            updatedAt: new Date().toISOString()
          };

          observer.next(new HttpResponse({
            status: 200,
            body: {
              success: true,
              message: 'Thông tin profile đã được cập nhật thành công',
              data: updatedProfile
            }
          }));
        }
        observer.complete();
      }, 2000);
    });
  }

  /**
   * Mock upload avatar - Upload ảnh đại diện
   * @param avatarData - Dữ liệu ảnh đại diện
   * @returns Observable của upload avatar response
   */
  mockUploadAvatar(avatarData: any): Observable<HttpResponse<any>> {
    return new Observable(observer => {
      setTimeout(() => {
        const avatarUrl = `https://via.placeholder.com/200x200/0F83BA/FFFFFF?text=${encodeURIComponent(avatarData.name || 'Avatar')}`;
        
        observer.next(new HttpResponse({
          status: 200,
          body: {
            success: true,
            message: 'Ảnh đại diện đã được cập nhật thành công',
            data: {
              avatarUrl: avatarUrl,
              uploadedAt: new Date().toISOString()
            }
          }
        }));
        observer.complete();
      }, 1500);
    });
  }

  /**
   * Mock upload CV - Upload CV
   * @param cvData - Dữ liệu CV
   * @returns Observable của upload CV response
   */
  mockUploadCV(cvData: any): Observable<HttpResponse<any>> {
    return new Observable(observer => {
      setTimeout(() => {
        const cvFileName = cvData.name || 'CV_' + Date.now() + '.pdf';
        
        observer.next(new HttpResponse({
          status: 200,
          body: {
            success: true,
            message: 'CV đã được tải lên thành công',
            data: {
              fileName: cvFileName,
              fileSize: cvData.size || '2.5MB',
              uploadedAt: new Date().toISOString()
            }
          }
        }));
        observer.complete();
      }, 1500);
    });
  }
}
