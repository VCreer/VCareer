import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';

/**
 * Mock API Interceptor - Xử lý các request giả lập cho VCareer project
 * Hỗ trợ Authentication, Job Management và User Management
 */
@Injectable()
export class MockApiInterceptor implements HttpInterceptor {
  constructor() {}

  /**
   * Intercept HTTP requests và xử lý mock API calls
   * @param req - HTTP request
   * @param next - Next handler
   * @returns Observable của HTTP event
   */
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Xử lý các request có chứa '/api/' hoặc '/auth/' hoặc '/candidate/' hoặc '/recruiter/' hoặc '/jobs'
    if (req.url.includes('/api/') || req.url.includes('/auth/') || 
        req.url.includes('/candidate/') || req.url.includes('/recruiter/') || 
        req.url.includes('/jobs')) {
      return this.handleMockRequest(req);
    }

    // Các request khác sẽ đi qua bình thường
    return next.handle(req);
  }

  /**
   * Xử lý các mock request dựa trên URL và method
   * @param req - HTTP request
   * @returns Observable của mock response
   */
  private handleMockRequest(req: HttpRequest<any>): Observable<HttpEvent<any>> {
    const url = req.url;
    const method = req.method;
    const body = req.body;


    // === FORGOT PASSWORD ENDPOINTS ===
    // Gửi OTP qua email
    if (url.includes('/auth/forgot-password') && method === 'POST') {
      return this.mockForgotPassword(body);
    }

    // Xác thực OTP
    if (url.includes('/auth/verify-otp') && method === 'POST') {
      return this.mockVerifyOtp(body);
    }

    // Reset password
    if (url.includes('/auth/reset-password') && method === 'POST') {
      return this.mockResetPassword(body);
    }

    // === CANDIDATE ENDPOINTS ===
    // Đăng ký candidate
    if (url.includes('/candidate/register') && method === 'POST') {
      return this.mockCandidateRegister(body);
    }

    // Đăng nhập candidate
    if (url.includes('/candidate/login') && method === 'POST') {
      return this.mockCandidateLogin(body);
    }

    // === RECRUITER ENDPOINTS ===
    // Đăng ký recruiter
    if (url.includes('/recruiter/register') && method === 'POST') {
      return this.mockRecruiterRegister(body);
    }

    // Đăng nhập recruiter
    if (url.includes('/recruiter/login') && method === 'POST') {
      return this.mockRecruiterLogin(body);
    }

    // === JOB POSTING ENDPOINTS ===
    // Lấy danh sách jobs
    if (url.includes('/jobs') && method === 'GET') {
      return this.mockGetJobs();
    }

    // Tạo job mới
    if (url.includes('/jobs') && method === 'POST') {
      return this.mockCreateJob(body);
    }

    // === PROFILE ENDPOINTS ===
    // Lấy thông tin profile
    if (url.includes('/profile') && method === 'GET') {
      return this.mockGetProfile();
    }

    // Cập nhật profile
    if (url.includes('/profile') && method === 'PUT') {
      return this.mockUpdateProfile(body);
    }

    // Upload avatar
    if (url.includes('/profile/avatar') && method === 'POST') {
      return this.mockUploadAvatar(body);
    }

    // Upload CV
    if (url.includes('/profile/cv') && method === 'POST') {
      return this.mockUploadCV(body);
    }


    // Trả về 404 nếu không tìm thấy endpoint
    return of(new HttpResponse({
      status: 404,
      body: { error: 'Mock endpoint not found' }
    }));
  }


  // === MOCK FORGOT PASSWORD METHODS ===
  
  /**
   * Mock forgot password - Gửi OTP qua email
   * @param emailData - Thông tin email {email}
   * @returns Observable của forgot password response
   */
  private mockForgotPassword(emailData: any): Observable<HttpEvent<any>> {
    return new Observable(observer => {
      setTimeout(() => {
        const { email } = emailData;
        
        // Lưu email vào localStorage để verify-otp sử dụng
        localStorage.setItem('forgot_password_email', email);
        
        observer.next(new HttpResponse({
          status: 200,
          body: {
            success: true,
            message: 'OTP đã được gửi đến email của bạn',
            email: email
          }
        }));
        observer.complete();
      }, 1500);
    });
  }

  /**
   * Mock verify OTP - Xác thực mã OTP
   * @param otpData - Thông tin OTP {otp}
   * @returns Observable của verify OTP response
   */
  private mockVerifyOtp(otpData: any): Observable<HttpEvent<any>> {
    return new Observable(observer => {
      setTimeout(() => {
        const { otp } = otpData;
        
        // Kiểm tra OTP (mock: chỉ chấp nhận '123456')
        if (otp === '123456') {
          observer.next(new HttpResponse({
            status: 200,
            body: {
              success: true,
              message: 'OTP xác thực thành công',
              verified: true
            }
          }));
        } else {
          observer.next(new HttpResponse({
            status: 400,
            body: {
              success: false,
              message: 'Mã OTP không đúng'
            }
          }));
        }
        observer.complete();
      }, 2000);
    });
  }

  /**
   * Mock reset password - Đặt lại mật khẩu mới
   * @param passwordData - Thông tin mật khẩu mới {password, confirmPassword}
   * @returns Observable của reset password response
   */
  private mockResetPassword(passwordData: any): Observable<HttpEvent<any>> {
    return new Observable(observer => {
      setTimeout(() => {
        const { password, confirmPassword } = passwordData;
        
        // Kiểm tra password match
        if (password !== confirmPassword) {
          observer.next(new HttpResponse({
            status: 400,
            body: {
              success: false,
              message: 'Mật khẩu xác nhận không khớp'
            }
          }));
        } else {
          // Xóa email khỏi localStorage
          localStorage.removeItem('forgot_password_email');
          
          observer.next(new HttpResponse({
            status: 200,
            body: {
              success: true,
              message: 'Mật khẩu đã được đặt lại thành công'
            }
          }));
        }
        observer.complete();
      }, 2000);
    });
  }

  // === MOCK CANDIDATE METHODS ===
  
  /**
   * Mock candidate register - Đăng ký ứng viên
   * @param candidateData - Thông tin ứng viên
   * @returns Observable của candidate register response
   */
  private mockCandidateRegister(candidateData: any): Observable<HttpEvent<any>> {
    return new Observable(observer => {
      setTimeout(() => {
        const token = 'mock_candidate_token_' + Date.now();
        observer.next(new HttpResponse({
          status: 200,
          body: {
            success: true,
            token: token,
            user: {
              id: Date.now(),
              email: candidateData.email,
              firstName: candidateData.firstName,
              lastName: candidateData.lastName,
              phone: candidateData.phone,
              gender: candidateData.gender,
              role: 'candidate'
            }
          }
        }));
        observer.complete();
      }, 2000);
    });
  }

  /**
   * Mock candidate login - Đăng nhập ứng viên
   * @param credentials - Thông tin đăng nhập
   * @returns Observable của candidate login response
   */
  private mockCandidateLogin(credentials: any): Observable<HttpEvent<any>> {
    return new Observable(observer => {
      setTimeout(() => {
        const { email, password } = credentials;
        
        // Mock credentials
        if (email === 'candidate@example.com' && password === 'candidate123') {
          const token = 'mock_candidate_token_' + Date.now();
          observer.next(new HttpResponse({
            status: 200,
            body: {
              success: true,
              token: token,
              user: {
                id: 1,
                email: 'candidate@example.com',
                firstName: 'John',
                lastName: 'Doe',
                role: 'candidate'
              }
            }
          }));
        } else {
          observer.next(new HttpResponse({
            status: 401,
            body: {
              success: false,
              message: 'Email hoặc mật khẩu không đúng'
            }
          }));
        }
        observer.complete();
      }, 1500);
    });
  }

  // === MOCK RECRUITER METHODS ===
  
  /**
   * Mock recruiter register - Đăng ký nhà tuyển dụng
   * @param recruiterData - Thông tin nhà tuyển dụng
   * @returns Observable của recruiter register response
   */
  private mockRecruiterRegister(recruiterData: any): Observable<HttpEvent<any>> {
    return new Observable(observer => {
      setTimeout(() => {
        const token = 'mock_recruiter_token_' + Date.now();
        observer.next(new HttpResponse({
          status: 200,
          body: {
            success: true,
            token: token,
            user: {
              id: Date.now(),
              email: recruiterData.email,
              firstName: recruiterData.firstName,
              lastName: recruiterData.lastName,
              phone: recruiterData.phone,
              gender: recruiterData.gender,
              companyName: recruiterData.companyName,
              role: 'recruiter'
            }
          }
        }));
        observer.complete();
      }, 2000);
    });
  }

  /**
   * Mock recruiter login - Đăng nhập nhà tuyển dụng
   * @param credentials - Thông tin đăng nhập
   * @returns Observable của recruiter login response
   */
  private mockRecruiterLogin(credentials: any): Observable<HttpEvent<any>> {
    return new Observable(observer => {
      setTimeout(() => {
        const { email, password } = credentials;
        
        // Mock credentials
        if (email === 'recruiter@example.com' && password === 'recruiter123') {
          const token = 'mock_recruiter_token_' + Date.now();
          observer.next(new HttpResponse({
            status: 200,
            body: {
              success: true,
              token: token,
              user: {
                id: 2,
                email: 'recruiter@example.com',
                firstName: 'Jane',
                lastName: 'Smith',
                companyName: 'Tech Corp',
                role: 'recruiter'
              }
            }
          }));
        } else {
          observer.next(new HttpResponse({
            status: 401,
            body: {
              success: false,
              message: 'Email hoặc mật khẩu không đúng'
            }
          }));
        }
        observer.complete();
      }, 1500);
    });
  }

  // === MOCK JOB POSTING METHODS ===
  
  /**
   * Mock get jobs - Lấy danh sách công việc
   * @returns Observable của jobs response
   */
  private mockGetJobs(): Observable<HttpEvent<any>> {
    return new Observable(observer => {
      setTimeout(() => {
        const mockJobs = [
          {
            id: 1,
            title: 'Frontend Developer',
            company: 'Tech Corp',
            location: 'Hồ Chí Minh',
            salary: '15-25 triệu',
            type: 'Full-time',
            description: 'Tìm kiếm Frontend Developer có kinh nghiệm React, Angular',
            requirements: ['React', 'Angular', 'JavaScript', 'HTML/CSS'],
            postedDate: '2024-01-15'
          },
          {
            id: 2,
            title: 'Backend Developer',
            company: 'StartupXYZ',
            location: 'Hà Nội',
            salary: '20-30 triệu',
            type: 'Full-time',
            description: 'Tìm kiếm Backend Developer có kinh nghiệm Node.js, Python',
            requirements: ['Node.js', 'Python', 'Database', 'API'],
            postedDate: '2024-01-14'
          },
          {
            id: 3,
            title: 'Full Stack Developer',
            company: 'Digital Agency',
            location: 'Đà Nẵng',
            salary: '18-28 triệu',
            type: 'Full-time',
            description: 'Tìm kiếm Full Stack Developer toàn diện',
            requirements: ['React', 'Node.js', 'Database', 'DevOps'],
            postedDate: '2024-01-13'
          }
        ];

        observer.next(new HttpResponse({
          status: 200,
          body: {
            success: true,
            data: mockJobs,
            total: mockJobs.length
          }
        }));
        observer.complete();
      }, 1000);
    });
  }

  /**
   * Mock create job - Tạo công việc mới
   * @param jobData - Thông tin công việc
   * @returns Observable của create job response
   */
  private mockCreateJob(jobData: any): Observable<HttpEvent<any>> {
    return new Observable(observer => {
      setTimeout(() => {
        const newJob = {
          id: Date.now(),
          ...jobData,
          postedDate: new Date().toISOString().split('T')[0],
          status: 'active'
        };

        observer.next(new HttpResponse({
          status: 201,
          body: {
            success: true,
            message: 'Công việc đã được tạo thành công',
            data: newJob
          }
        }));
        observer.complete();
      }, 2000);
    });
  }

  // === MOCK PROFILE METHODS ===
  
  /**
   * Mock get profile - Lấy thông tin profile
   * @returns Observable của profile response
   */
  private mockGetProfile(): Observable<HttpEvent<any>> {
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
  private mockUpdateProfile(profileData: any): Observable<HttpEvent<any>> {
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
  private mockUploadAvatar(avatarData: any): Observable<HttpEvent<any>> {
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
  private mockUploadCV(cvData: any): Observable<HttpEvent<any>> {
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