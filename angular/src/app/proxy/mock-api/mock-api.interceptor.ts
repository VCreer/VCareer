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
}