import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  salary: string;
  type: string;
  industry: string;
  description: string;
  requirements: string[];
  benefits: string[];
  timeAgo: string;
  isBookmarked: boolean;
  logo?: string;
  tags?: string[];
}

export interface JobFilters {
  location?: string;
  industry?: string;
  salaryRange?: string;
  experience?: string;
  page?: number;
  limit?: number;
}

@Injectable({
  providedIn: 'root'
})
export class JobService {
  private mockJobs: Job[] = [
    {
      id: 1,
      title: 'Senior Frontend Developer',
      company: 'TechCorp Vietnam',
      location: 'Hồ Chí Minh',
      salary: '25-35 triệu',
      type: 'Full-time',
      industry: 'Công nghệ thông tin',
      description: 'Chúng tôi đang tìm kiếm một Senior Frontend Developer có kinh nghiệm...',
      requirements: ['3+ năm kinh nghiệm React', 'TypeScript', 'Redux'],
      benefits: ['Bảo hiểm y tế', 'Lương tháng 13', 'Nghỉ phép có lương'],
      timeAgo: '2 giờ trước',
      isBookmarked: false,
      logo: 'assets/images/companies/techcorp.png',
      tags: ['React', 'TypeScript', 'Remote']
    },
    {
      id: 2,
      title: 'Marketing Manager',
      company: 'Digital Agency',
      location: 'Hà Nội',
      salary: '20-30 triệu',
      type: 'Full-time',
      industry: 'Marketing',
      description: 'Tìm kiếm Marketing Manager có kinh nghiệm trong digital marketing...',
      requirements: ['5+ năm kinh nghiệm marketing', 'Google Ads', 'Facebook Ads'],
      benefits: ['Thưởng KPI', 'Đào tạo nâng cao', 'Môi trường năng động'],
      timeAgo: '4 giờ trước',
      isBookmarked: true,
      logo: 'assets/images/companies/digital-agency.png',
      tags: ['Marketing', 'Digital', 'Management']
    },
    {
      id: 3,
      title: 'Backend Developer',
      company: 'StartupXYZ',
      location: 'Đà Nẵng',
      salary: '18-25 triệu',
      type: 'Full-time',
      industry: 'Công nghệ thông tin',
      description: 'Cần Backend Developer có kinh nghiệm với Node.js và MongoDB...',
      requirements: ['2+ năm kinh nghiệm Node.js', 'MongoDB', 'RESTful API'],
      benefits: ['Cổ phần công ty', 'Làm việc linh hoạt', 'Thưởng dự án'],
      timeAgo: '1 ngày trước',
      isBookmarked: false,
      logo: 'assets/images/companies/startup-xyz.png',
      tags: ['Node.js', 'MongoDB', 'Startup']
    }
  ];

  constructor() {}

  getJobs(filters?: JobFilters): Observable<{ jobs: Job[], total: number }> {
    let filteredJobs = [...this.mockJobs];

    if (filters?.location) {
      filteredJobs = filteredJobs.filter(job => 
        job.location.toLowerCase().includes(filters.location!.toLowerCase())
      );
    }

    if (filters?.industry) {
      filteredJobs = filteredJobs.filter(job => 
        job.industry.toLowerCase().includes(filters.industry!.toLowerCase())
      );
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const paginatedJobs = filteredJobs.slice(startIndex, endIndex);

    return of({
      jobs: paginatedJobs,
      total: filteredJobs.length
    }).pipe(delay(500));
  }

  getJobById(id: number): Observable<Job | null> {
    const job = this.mockJobs.find(j => j.id === id);
    return of(job || null).pipe(delay(300));
  }

  createJob(jobData: Partial<Job>): Observable<Job> {
    const newJob: Job = {
      id: this.mockJobs.length + 1,
      title: jobData.title || '',
      company: jobData.company || '',
      location: jobData.location || '',
      salary: jobData.salary || '',
      type: jobData.type || '',
      industry: jobData.industry || '',
      description: jobData.description || '',
      requirements: jobData.requirements || [],
      benefits: jobData.benefits || [],
      timeAgo: 'Vừa đăng',
      isBookmarked: false,
      ...jobData
    };

    this.mockJobs.unshift(newJob);
    return of(newJob).pipe(delay(800));
  }

  updateJob(id: number, jobData: Partial<Job>): Observable<Job | null> {
    const index = this.mockJobs.findIndex(j => j.id === id);
    if (index !== -1) {
      this.mockJobs[index] = { ...this.mockJobs[index], ...jobData };
      return of(this.mockJobs[index]).pipe(delay(500));
    }
    return of(null).pipe(delay(300));
  }

  deleteJob(id: number): Observable<{ success: boolean }> {
    const index = this.mockJobs.findIndex(j => j.id === id);
    if (index !== -1) {
      this.mockJobs.splice(index, 1);
      return of({ success: true }).pipe(delay(300));
    }
    return of({ success: false }).pipe(delay(300));
  }

  toggleBookmark(jobId: number): Observable<{ success: boolean }> {
    const job = this.mockJobs.find(j => j.id === jobId);
    if (job) {
      job.isBookmarked = !job.isBookmarked;
      return of({ success: true }).pipe(delay(200));
    }
    return of({ success: false }).pipe(delay(200));
  }
}
