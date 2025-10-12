import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface TranslationData {
  [key: string]: string;
}

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private currentLanguage = new BehaviorSubject<string>('vi');
  public currentLanguage$ = this.currentLanguage.asObservable();

  private translations: { [key: string]: TranslationData } = {
    vi: {
      // Header
      'header.home': 'Trang chủ',
      'header.jobs': 'Việc làm',
      'header.companies': 'Công ty',
      'header.about': 'Về chúng tôi',
      'header.contact': 'Liên hệ',
      'header.login': 'Đăng nhập',
      'header.register': 'Đăng ký',
      'header.post_job': 'Đăng tuyển & tìm hồ sơ',
      
      // Recruiter Header
      'recruiter.about': 'Giới thiệu',
      'recruiter.services': 'Dịch vụ',
      'recruiter.pricing': 'Báo giá',
      'recruiter.support': 'Hỗ trợ',
      'recruiter.blog': 'Blog tuyển dụng',
      'recruiter.post_job': 'Đăng tin ngay',
      
      // Language
      'language.vietnamese': 'Tiếng Việt',
      'language.english': 'English',
      
      // Homepage
      'homepage.title': 'Tìm việc làm mơ ước của bạn',
      'homepage.subtitle': 'Kết nối với hàng nghìn cơ hội việc làm tốt nhất',
      'homepage.search_placeholder': 'Tìm kiếm việc làm, công ty...',
      'homepage.search_button': 'Tìm kiếm',
      'homepage.popular_jobs': 'Việc làm phổ biến',
      'homepage.featured_companies': 'Công ty nổi bật',
      'homepage.job_categories': 'Danh mục việc làm',
      'homepage.stats.jobs': 'Việc làm',
      'homepage.stats.companies': 'Công ty',
      'homepage.stats.candidates': 'Ứng viên',
      'homepage.stats.success': 'Thành công'
    },
    en: {
      // Header
      'header.home': 'Home',
      'header.jobs': 'Jobs',
      'header.companies': 'Companies',
      'header.about': 'About Us',
      'header.contact': 'Contact',
      'header.login': 'Login',
      'header.register': 'Register',
      'header.post_job': 'Post Job & Find Resumes',
      
      // Recruiter Header
      'recruiter.about': 'About',
      'recruiter.services': 'Services',
      'recruiter.pricing': 'Pricing',
      'recruiter.support': 'Support',
      'recruiter.blog': 'Recruitment Blog',
      'recruiter.post_job': 'Post Job Now',
      
      // Language
      'language.vietnamese': 'Tiếng Việt',
      'language.english': 'English',
      
      // Homepage
      'homepage.title': 'Find Your Dream Job',
      'homepage.subtitle': 'Connect with thousands of the best job opportunities',
      'homepage.search_placeholder': 'Search jobs, companies...',
      'homepage.search_button': 'Search',
      'homepage.popular_jobs': 'Popular Jobs',
      'homepage.featured_companies': 'Featured Companies',
      'homepage.job_categories': 'Job Categories',
      'homepage.stats.jobs': 'Jobs',
      'homepage.stats.companies': 'Companies',
      'homepage.stats.candidates': 'Candidates',
      'homepage.stats.success': 'Success'
    }
  };

  constructor() {}

  setLanguage(language: string) {
    this.currentLanguage.next(language);
    console.log('🌐 Language changed to:', language);
  }

  getCurrentLanguage(): string {
    return this.currentLanguage.value;
  }

  translate(key: string): string {
    const currentLang = this.currentLanguage.value;
    const translation = this.translations[currentLang]?.[key];
    return translation || key;
  }

  getTranslation(key: string): string {
    return this.translate(key);
  }
}
