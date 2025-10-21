import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

/**
 * Mock Job Service - Xử lý các API liên quan đến việc làm
 * Bao gồm: Get Jobs, Create Job
 */
@Injectable({
  providedIn: 'root'
})
export class JobMockService {

  private mockJobs = [
    {
      id: 1,
      title: 'Senior Frontend Developer',
      company: 'TechCorp Vietnam',
      location: 'Hồ Chí Minh',
      salary: '25-35 triệu',
      type: 'Full-time',
      industry: 'Công nghệ thông tin',
      description: 'Chúng tôi đang tìm kiếm một Senior Frontend Developer...',
      requirements: ['3+ năm kinh nghiệm React', 'TypeScript', 'Redux'],
      benefits: ['Bảo hiểm y tế', 'Lương tháng 13', 'Nghỉ phép có lương'],
      timeAgo: '2 giờ trước',
      isBookmarked: false
    },
    {
      id: 2,
      title: 'Marketing Manager',
      company: 'Digital Agency',
      location: 'Hà Nội',
      salary: '20-30 triệu',
      type: 'Full-time',
      industry: 'Marketing',
      description: 'Tìm kiếm Marketing Manager có kinh nghiệm...',
      requirements: ['5+ năm kinh nghiệm marketing', 'Google Ads', 'Facebook Ads'],
      benefits: ['Thưởng KPI', 'Đào tạo nâng cao', 'Môi trường năng động'],
      timeAgo: '4 giờ trước',
      isBookmarked: true
    }
  ];

  /**
   * Mock get jobs - Lấy danh sách việc làm
   */
  mockGetJobs(): Observable<any> {
    return of({
      success: true,
      data: this.mockJobs,
      total: this.mockJobs.length
    }).pipe(delay(800));
  }

  /**
   * Mock create job - Tạo việc làm mới
   */
  mockCreateJob(jobData: any): Observable<any> {
    const newJob = {
      id: this.mockJobs.length + 1,
      ...jobData,
      timeAgo: 'Vừa đăng',
      isBookmarked: false
    };
    
    this.mockJobs.unshift(newJob);
    
    return of({
      success: true,
      data: newJob,
      message: 'Việc làm đã được tạo thành công'
    }).pipe(delay(1200));
  }
}