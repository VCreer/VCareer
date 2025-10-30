import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { AuthMockService } from './services/auth-mock.service';
import { CandidateMockService } from './services/candidate-mock.service';
import { RecruiterMockService } from './services/recruiter-mock.service';
import { JobMockService } from './services/job-mock.service';
import { ProfileMockService } from './services/profile-mock.service';

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
   */
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const url = req.url;
    const method = req.method;
    const body = req.body;

    // Authentication endpoints
    if (url.includes('/api/auth/forgot-password')) {
      return this.authMockService.mockForgotPassword(body);
    }
    
    if (url.includes('/api/auth/verify-otp')) {
      return this.authMockService.mockVerifyOtp(body);
    }
    
    if (url.includes('/api/auth/reset-password')) {
      return this.authMockService.mockResetPassword(body);
    }

    // Candidate endpoints
    if (url.includes('/api/candidate/register')) {
      return this.candidateMockService.mockCandidateRegister(body);
    }
    
    if (url.includes('/api/candidate/login')) {
      return this.candidateMockService.mockCandidateLogin(body);
    }

    // Recruiter endpoints
    if (url.includes('/api/recruiter/register')) {
      return this.recruiterMockService.mockRecruiterRegister(body);
    }
    
    if (url.includes('/api/recruiter/login')) {
      return this.recruiterMockService.mockRecruiterLogin(body);
    }

    // ============================================
    // ✅ BYPASS: Category & Location APIs (send to REAL backend)
    // ============================================
    if (url.includes('/api/job-categories')) {
      console.log('🔵 MockApiInterceptor: BYPASSING /api/job-categories - sending to REAL backend');
      return next.handle(req);
    }
    
    if (url.includes('/api/locations')) {
      console.log('🔵 MockApiInterceptor: BYPASSING /api/locations - sending to REAL backend');
      return next.handle(req);
    }

    // ============================================
    // ✅ BYPASS: Job APIs to REAL backend when hitting real endpoints
    // ============================================
    // ⚠️ IMPORTANT: Check for /api/jobs/search FIRST (more specific)
    if (url.includes('/api/jobs/search') && method === 'POST') {
      console.log('🔵 MockApiInterceptor: BYPASSING /api/jobs/search - sending to REAL backend');
      return next.handle(req);  // ✅ Send to real backend
    }
    
    // ✅ Bypass GET /api/jobs/{id}
    if (method === 'GET' && /\/api\/jobs\/[0-9a-fA-F-]+$/.test(url)) {
      console.log('🔵 MockApiInterceptor: BYPASSING GET Job By Id - sending to REAL backend:', url);
      return next.handle(req);
    }
    
    // ✅ Bypass GET /api/jobs/{id}/related
    if (method === 'GET' && /\/api\/jobs\/[0-9a-fA-F-]+\/related$/.test(url)) {
      console.log('🔵 MockApiInterceptor: BYPASSING GET Related Jobs - sending to REAL backend:', url);
      return next.handle(req);
    }
    
    if (url.includes('/api/jobs') && method === 'GET') {
      return this.jobMockService.mockGetJobs();
    }
    
    if (url.includes('/api/jobs') && method === 'POST') {
      return this.jobMockService.mockCreateJob(body);
    }

    // Profile endpoints
    if (url.includes('/api/profile') && method === 'GET') {
      return this.profileMockService.mockGetProfile();
    }
    
    if (url.includes('/api/profile') && method === 'PUT') {
      return this.profileMockService.mockUpdateProfile(body);
    }
    
    if (url.includes('/api/profile/avatar') && method === 'POST') {
      return this.profileMockService.mockUploadAvatar(body);
    }
    
    if (url.includes('/api/profile/cv') && method === 'POST') {
      return this.profileMockService.mockUploadCV(body);
    }
    
    if (url.includes('/api/profile') && method === 'PUT') {
      return this.profileMockService.mockUpdateProfile(body);
    }

    // Nếu không match với mock endpoints, chuyển request đến server thật
    return next.handle(req);
  }
}
