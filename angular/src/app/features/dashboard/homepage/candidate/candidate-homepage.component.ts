import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-candidate-homepage',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './candidate-homepage.component.html',
  styleUrls: ['./candidate-homepage.component.scss']
})
export class CandidateHomepageComponent {
  // Dữ liệu form tìm kiếm
  searchForm = {
    jobTitle: '',
    location: '',
    category: ''
  };

  // Dữ liệu thống kê
  stats = {
    jobs: '25,850',
    candidates: '10,250', 
    companies: '18,400'
  };

  // Dữ liệu danh sách việc làm
  jobListings = [
    {
      id: 1,
      timePosted: '10 phút trước',
      title: 'Forward Security Director',
      company: 'Bauch, Schuppe and Schulist Co',
      industry: 'Khách sạn & Du lịch',
      type: 'Toàn thời gian',
      salary: '40.000-42.000 đô la',
      location: 'New York, Hoa Kỳ',
      isBookmarked: false
    },
    {
      id: 2,
      timePosted: '2 giờ trước',
      title: 'Senior Software Engineer',
      company: 'Tech Solutions Inc',
      industry: 'Công nghệ thông tin',
      type: 'Toàn thời gian',
      salary: '50.000-60.000 đô la',
      location: 'San Francisco, Hoa Kỳ',
      isBookmarked: false
    },
    {
      id: 3,
      timePosted: '5 giờ trước',
      title: 'Marketing Manager',
      company: 'Digital Marketing Co',
      industry: 'Marketing & Quảng cáo',
      type: 'Toàn thời gian',
      salary: '35.000-45.000 đô la',
      location: 'Los Angeles, Hoa Kỳ',
      isBookmarked: false
    }
  ];

  constructor(private router: Router) {}

  onSearch() {
    // Triển khai logic tìm kiếm ở đây
  }

  toggleBookmark(jobId: number) {
    const job = this.jobListings.find(j => j.id === jobId);
    if (job) {
      job.isBookmarked = !job.isBookmarked;
    }
  }

  viewJobDetails(jobId: number) {
    // Điều hướng đến trang chi tiết việc làm
  }

  viewAllJobs() {
    // Điều hướng đến trang tất cả việc làm
  }
}
