import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FooterService {
  constructor(private http: HttpClient) {}

  getFooter(): Observable<any> {
    // For now, return static structure; interceptor can override if needed
    return of({
      contact: { hotline: '(024) 6680 5588', email: 'hotro@vcareer.vn' },
      socialLinks: [
        { icon: 'assets/images/social/facebook.svg', url: '#', label: 'Facebook' },
        { icon: 'assets/images/social/youtube.svg', url: '#', label: 'YouTube' },
        { icon: 'assets/images/social/linkedin.svg', url: '#', label: 'LinkedIn' },
        { icon: 'assets/images/social/instagram.svg', url: '#', label: 'Instagram' }
      ],
      columns: [
        {
          title: 'Về VCareer',
          links: [
            { label: 'Giới thiệu', url: '#' },
            { label: 'Góc báo chí', url: '#' },
            { label: 'Tuyển dụng', url: '#' },
            { label: 'Liên hệ', url: '#' },
            { label: 'Hỏi đáp', url: '#' },
            { label: 'Chính sách bảo mật', url: '#' },
            { label: 'Điều khoản dịch vụ', url: '#' }
          ]
        },
        {
          title: 'Hồ sơ và CV',
          links: [
            { label: 'Quản lý CV của bạn', url: '#' },
            { label: 'Hướng dẫn viết CV', url: '#' },
            { label: 'Thư viện CV theo ngành nghề', url: '#' },
            { label: 'Review CV', url: '#' }
          ]
        },
        {
          title: 'Khám phá',
          links: [
            { label: 'Ứng dụng di động VCareer', url: '#' },
            { label: 'Tính lương Gross – Net', url: '#' },
            { label: 'Tính lãi suất kép', url: '#' },
            { label: 'Lập kế hoạch tiết kiệm', url: '#' },
            { label: 'Tính bảo hiểm thất nghiệp', url: '#' },
            { label: 'Tính bảo hiểm xã hội một lần', url: '#' }
          ]
        },
        {
          title: 'Xây dựng sự nghiệp',
          links: [
            { label: 'Việc làm tốt nhất', url: '#' },
            { label: 'Việc làm lương cao', url: '#' },
            { label: 'Việc làm quản lý', url: '#' },
            { label: 'Việc làm IT', url: '#' },
            { label: 'Việc làm Senior', url: '#' },
            { label: 'Việc làm bán thời gian', url: '#' }
          ]
        },
        {
          title: 'Quy tắc chung',
          links: [
            { label: 'Điều kiện giao dịch chung', url: '#' },
            { label: 'Giá dịch vụ & Cách thanh toán', url: '#' },
            { label: 'Thông tin về vận chuyển', url: '#' }
          ]
        }
      ]
    });
  }
}


