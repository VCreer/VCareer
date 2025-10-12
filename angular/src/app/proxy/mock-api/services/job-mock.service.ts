import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpResponse } from '@angular/common/http';

/**
 * Mock Job Service - Xử lý các API liên quan đến công việc
 * Bao gồm: Get Jobs, Create Job
 */
@Injectable({
  providedIn: 'root'
})
export class JobMockService {

  /**
   * Mock get jobs - Lấy danh sách công việc
   * @returns Observable của jobs response
   */
  mockGetJobs(): Observable<HttpResponse<any>> {
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
  mockCreateJob(jobData: any): Observable<HttpResponse<any>> {
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
