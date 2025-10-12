import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-recruiter-homepage',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="recruiter-homepage">
      <div class="container">
        <h1>Trang chủ Nhà tuyển dụng</h1>
        <p>Chào mừng bạn đến với VCareer - Nền tảng tuyển dụng hàng đầu Việt Nam</p>
        
        <div class="features">
          <div class="feature-card">
            <h3>Đăng tin tuyển dụng</h3>
            <p>Tạo và quản lý các tin tuyển dụng hiệu quả</p>
          </div>
          
          <div class="feature-card">
            <h3>Tìm kiếm ứng viên</h3>
            <p>Khám phá hồ sơ ứng viên phù hợp</p>
          </div>
          
          <div class="feature-card">
            <h3>Quản lý công ty</h3>
            <p>Xây dựng thương hiệu công ty</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .recruiter-homepage {
      padding: 40px 20px;
      min-height: 100vh;
      background: #f8fafc;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    
    h1 {
      color: #10B981;
      font-size: 2.5rem;
      margin-bottom: 1rem;
      text-align: center;
    }
    
    p {
      color: #6B7280;
      font-size: 1.2rem;
      text-align: center;
      margin-bottom: 3rem;
    }
    
    .features {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
      margin-top: 3rem;
    }
    
    .feature-card {
      background: white;
      padding: 2rem;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      text-align: center;
      transition: transform 0.2s ease;
      
      &:hover {
        transform: translateY(-4px);
      }
      
      h3 {
        color: #10B981;
        margin-bottom: 1rem;
      }
      
      p {
        color: #6B7280;
        margin: 0;
        text-align: left;
      }
    }
  `]
})
export class RecruiterHomepageComponent {
}
