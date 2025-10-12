import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { 
  AuthMockService, 
  CandidateMockService, 
  RecruiterMockService, 
  JobMockService, 
  ProfileMockService 
} from './services';

/**
 * Mock API Interceptor - Xử lý các request giả lập cho VCareer project
 * Hỗ trợ Authentication, Job Management và User Management
 */
@Injectable()
export class MockApiInterceptor implements HttpInterceptor {
  constructor(
    private authMockService: AuthMockService,
    private candidateMockService: CandidateMockService,
    private recruiterMockService: RecruiterMockService,
    private jobMockService: JobMockService,
    private profileMockService: ProfileMockService
  ) {}

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
      return this.authMockService.mockForgotPassword(body);
    }

    // Xác thực OTP
    if (url.includes('/auth/verify-otp') && method === 'POST') {
      return this.authMockService.mockVerifyOtp(body);
    }

    // Reset password
    if (url.includes('/auth/reset-password') && method === 'POST') {
      return this.authMockService.mockResetPassword(body);
    }

    // === CANDIDATE ENDPOINTS ===
    // Đăng ký candidate
    if (url.includes('/candidate/register') && method === 'POST') {
      return this.candidateMockService.mockCandidateRegister(body);
    }

    // Đăng nhập candidate
    if (url.includes('/candidate/login') && method === 'POST') {
      return this.candidateMockService.mockCandidateLogin(body);
    }

    // === RECRUITER ENDPOINTS ===
    // Đăng ký recruiter
    if (url.includes('/recruiter/register') && method === 'POST') {
      return this.recruiterMockService.mockRecruiterRegister(body);
    }

    // Đăng nhập recruiter
    if (url.includes('/recruiter/login') && method === 'POST') {
      return this.recruiterMockService.mockRecruiterLogin(body);
    }

    // === JOB POSTING ENDPOINTS ===
    // Lấy danh sách jobs
    if (url.includes('/jobs') && method === 'GET') {
      return this.jobMockService.mockGetJobs();
    }

    // Tạo job mới
    if (url.includes('/jobs') && method === 'POST') {
      return this.jobMockService.mockCreateJob(body);
    }

    // === PROFILE ENDPOINTS ===
    // Lấy thông tin profile
    if (url.includes('/profile') && method === 'GET') {
      return this.profileMockService.mockGetProfile();
    }

    // Cập nhật profile
    if (url.includes('/profile') && method === 'PUT') {
      return this.profileMockService.mockUpdateProfile(body);
    }

    // Upload avatar
    if (url.includes('/profile/avatar') && method === 'POST') {
      return this.profileMockService.mockUploadAvatar(body);
    }

    // Upload CV
    if (url.includes('/profile/cv') && method === 'POST') {
      return this.profileMockService.mockUploadCV(body);
    }

    // Trả về 404 nếu không tìm thấy endpoint
    return of(new HttpResponse({
      status: 404,
      body: { error: 'Mock endpoint not found' }
    }));
  }
}