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
      'header.are_you_recruiter': 'Bạn là nhà tuyển dụng?',
      'header.post_job_now': 'Đăng tuyển ngay',
      
      // Profile Menu
      'profile.verified_account': 'Tài khoản đã xác thực',
      'profile.job_management': 'Quản lý tìm việc',
      'profile.saved_jobs': 'Việc làm đã lưu',
      'profile.applied_jobs': 'Việc làm đã ứng tuyển',
      'profile.suitable_jobs': 'Việc làm phù hợp với bạn',
      'profile.job_suggestions': 'Cài đặt gợi ý việc làm',
      'profile.cv_management': 'Quản lý CV & Cover letter',
      'profile.my_cv': 'CV của tôi',
      'profile.my_cover_letter': 'Cover Letter của tôi',
      'profile.recruiters_connect': 'Nhà tuyển dụng muốn kết nối với bạn',
      'profile.recruiters_view': 'Nhà tuyển dụng xem hồ sơ',
      'profile.email_settings': 'Cài đặt email & thông báo',
      'profile.personal_security': 'Cá nhân & Bảo mật',
      'profile.upgrade_account': 'Nâng cấp tài khoản',
      'profile.logout': 'Đăng xuất',
      
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
      'homepage.location_all': 'Tất cả địa điểm',
      'homepage.category_all': 'Tất cả ngành nghề',
      'homepage.search_button': 'Tìm kiếm',
      'homepage.popular_jobs': 'Việc làm phổ biến',
      'homepage.featured_companies': 'Công ty nổi bật',
      'homepage.job_categories': 'Danh mục việc làm',
      'homepage.stats.jobs': 'Việc làm',
      'homepage.stats.companies': 'Công ty',
      'homepage.stats.candidates': 'Ứng viên',
      'homepage.stats.success': 'Thành công'
      ,
      // Pagination
      'pagination.pages': 'trang'
      ,
      // Stats
      'stats.customers_title': 'Khách hàng trên toàn thế giới',
      'stats.customers_desc': 'At eu lobortis pretium tincidunt amet lacus ut aenean aliquet. Blandit a massa elementum id scele.',
      'stats.resumes_title': 'Sơ yếu lý lịch đang hoạt động',
      'stats.resumes_desc': 'At eu lobortis pretium tincidunt amet lacus ut aenean aliquet. Blandit a massa elementum id scele.',
      'stats.companies_title': 'Các công ty',
      'stats.companies_desc': 'At eu lobortis pretium tincidunt amet lacus ut aenean aliquet. Blandit a massa elementum id scele.'
      ,
      // About / CTA / Future
      'about.title': 'Cuộc sống tốt đẹp bắt đầu từ một công ty tốt',
      'about.description': 'Ultricies purus dolor viverra mi laoreet at cursus justo. Ultrices purus diam egestas amet faucibus tempor blandit. Elit velit mauris aliquam est diam. Leo sagittis consectetur diam morbi erat aenean. Vulputate praesent congue faucibus in euismod feugiat euismod volutpat.',
      'cta.find_jobs': 'Tìm Kiếm Việc Làm',
      'cta.learn_more': 'Tìm hiểu thêm',
      'future.title': 'Tạo dựng một tương lai tốt đẹp hơn cho chính bạn',
      'future.description': 'At eu lobortis pretium tincidunt amet lacus ut aenean aliquet. Blandit a massa elementum id scelerisque rhoncus.'
      ,
      // Footer / Common
      'footer.tagline': 'Tiếp lợi thế - Nối thành công',
      'footer.community': 'Cộng đồng VCareer',
      'common.hotline': 'Hotline:',
      'common.email': 'Email:',
      'common.view_all': 'Xem tất cả',
      // Sections
      'home.recent_jobs': 'Việc Làm Gần Đây Có Sẵn',
      'home.browse_categories': 'Duyệt theo danh mục'
      ,
      // Filter bar
      'filter.by': 'Lọc theo:',
      'filter.location': 'Địa điểm',
      'filter.salary': 'Mức lương',
      'filter.experience': 'Kinh nghiệm',
      'filter.category': 'Ngành nghề'
      ,
      // Category names
      'Kinh doanh - Bán hàng': 'Kinh doanh - Bán hàng',
      'Marketing - PR - Quảng cáo': 'Marketing - PR - Quảng cáo',
      'Chăm sóc khách hàng': 'Chăm sóc khách hàng',
      'Nhân sự - Hành chính': 'Nhân sự - Hành chính',
      'Công nghệ Thông tin': 'Công nghệ Thông tin',
      'Tài chính - Ngân hàng': 'Tài chính - Ngân hàng',
      'Bất động sản': 'Bất động sản',
      'Kế toán - Kiểm toán': 'Kế toán - Kiểm toán'
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
      'header.are_you_recruiter': 'Are you a recruiter?',
      'header.post_job_now': 'Post a job now',
      
      // Profile Menu
      'profile.verified_account': 'Verified account',
      'profile.job_management': 'Job search management',
      'profile.saved_jobs': 'Saved jobs',
      'profile.applied_jobs': 'Applied jobs',
      'profile.suitable_jobs': 'Jobs suitable for you',
      'profile.job_suggestions': 'Job suggestion settings',
      'profile.cv_management': 'CV & Cover letter management',
      'profile.my_cv': 'My CV',
      'profile.my_cover_letter': 'My Cover Letter',
      'profile.recruiters_connect': 'Recruiters want to connect with you',
      'profile.recruiters_view': 'Recruiters view profile',
      'profile.email_settings': 'Email & notification settings',
      'profile.personal_security': 'Personal & Security',
      'profile.upgrade_account': 'Upgrade account',
      'profile.logout': 'Logout',
      
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
      'homepage.location_all': 'All locations',
      'homepage.category_all': 'All categories',
      'homepage.search_button': 'Search',
      'homepage.popular_jobs': 'Popular Jobs',
      'homepage.featured_companies': 'Featured Companies',
      'homepage.job_categories': 'Job Categories',
      'homepage.stats.jobs': 'Jobs',
      'homepage.stats.companies': 'Companies',
      'homepage.stats.candidates': 'Candidates',
      'homepage.stats.success': 'Success'
      ,
      // Pagination
      'pagination.pages': 'pages'
      ,
      // Stats
      'stats.customers_title': 'Global customers',
      'stats.customers_desc': 'At eu lobortis pretium tincidunt amet lacus ut aenean aliquet. Blandit a massa elementum id scelere.',
      'stats.resumes_title': 'Active resumes',
      'stats.resumes_desc': 'At eu lobortis pretium tincidunt amet lacus ut aenean aliquet. Blandit a massa elementum id scelere.',
      'stats.companies_title': 'Companies',
      'stats.companies_desc': 'At eu lobortis pretium tincidunt amet lacus ut aenean aliquet. Blandit a massa elementum id scelere.'
      ,
      // About / CTA / Future
      'about.title': 'A better life starts with a great company',
      'about.description': 'Ultricies purus dolor viverra mi laoreet at cursus justo. Ultrices purus diam egestas amet faucibus tempor blandit. Elit velit mauris aliquam est diam. Leo sagittis consectetur diam morbi erat aenean. Vulputate praesent congue faucibus in euismod feugiat euismod volutpat.',
      'cta.find_jobs': 'Find Jobs',
      'cta.learn_more': 'Learn more',
      'future.title': 'Build a better future for yourself',
      'future.description': 'At eu lobortis pretium tincidunt amet lacus ut aenean aliquet. Blandit a massa elementum id scelerisque rhoncus.'
      ,
      // Footer / Common
      'footer.tagline': 'Empower advantages - Connect success',
      'footer.community': 'VCareer Community',
      'common.hotline': 'Hotline:',
      'common.email': 'Email:',
      'common.view_all': 'View all',
      // Sections
      'home.recent_jobs': 'Recently Available Jobs',
      'home.browse_categories': 'Browse by category'
      ,
      // Filter bar
      'filter.by': 'Filter by:',
      'filter.location': 'Location',
      'filter.salary': 'Salary',
      'filter.experience': 'Experience',
      'filter.category': 'Category'
      ,
      // Category names
      'Kinh doanh - Bán hàng': 'Business - Sales',
      'Marketing - PR - Quảng cáo': 'Marketing - PR - Advertising',
      'Chăm sóc khách hàng': 'Customer Service',
      'Nhân sự - Hành chính': 'Human Resources - Administration',
      'Công nghệ Thông tin': 'Information Technology',
      'Tài chính - Ngân hàng': 'Finance - Banking',
      'Bất động sản': 'Real Estate',
      'Kế toán - Kiểm toán': 'Accounting - Auditing'
      ,
      // Category names (extra pages)
      'Sản xuất': 'Manufacturing',
      'Giáo dục - Đào tạo': 'Education - Training',
      'Bán lẻ - Dịch vụ đời sống': 'Retail - Lifestyle Services',
      'Phim và truyền hình - Báo chí': 'Film & Television - Press',
      'Điện - Điện tử - Viễn thông': 'Electrical - Electronics - Telecommunications',
      'Logistics - Thu mua - Kho vận': 'Logistics - Procurement - Warehousing',
      'Tư vấn chuyên môn': 'Professional Consulting',
      'Dược - Y tế - Sức khỏe': 'Pharmaceuticals - Healthcare',
      'Nhà hàng - Khách sạn': 'Restaurant - Hotel',
      'Năng lượng - Môi trường': 'Energy - Environment',
      'Nhóm nghề khác': 'Other occupations'
      ,
      // Footer titles
      'Về VCareer': 'About VCareer',
      'Hồ sơ và CV': 'Profiles & CV',
      'Khám phá': 'Explore',
      'Xây dựng sự nghiệp': 'Build your career',
      'Quy tắc chung': 'General policies',
      // Footer links
      'Giới thiệu': 'About',
      'Góc báo chí': 'Press',
      'Tuyển dụng': 'Careers',
      'Liên hệ': 'Contact',
      'Hỏi đáp': 'FAQ',
      'Chính sách bảo mật': 'Privacy policy',
      'Điều khoản dịch vụ': 'Terms of service',
      'Quản lý CV của bạn': 'Manage your CV',
      'Hướng dẫn viết CV': 'CV writing guide',
      'Thư viện CV theo ngành nghề': 'Industry CV library',
      'Review CV': 'CV review',
      'Ứng dụng di động VCareer': 'VCareer mobile app',
      'Tính lương Gross – Net': 'Gross–Net salary calculator',
      'Tính lãi suất kép': 'Compound interest calculator',
      'Lập kế hoạch tiết kiệm': 'Savings planner',
      'Tính bảo hiểm thất nghiệp': 'Unemployment insurance calculator',
      'Tính bảo hiểm xã hội một lần': 'One-time social insurance calculator',
      'Việc làm tốt nhất': 'Best jobs',
      'Việc làm lương cao': 'High salary jobs',
      'Việc làm quản lý': 'Management jobs',
      'Việc làm IT': 'IT jobs',
      'Việc làm Senior': 'Senior jobs',
      'Việc làm bán thời gian': 'Part-time jobs',
      'Điều kiện giao dịch chung': 'General transaction conditions',
      'Giá dịch vụ & Cách thanh toán': 'Service prices & payment methods',
      'Thông tin về vận chuyển': 'Shipping information'
      ,
      // Filter options - locations/districts (Hanoi)
      'Hà Nội': 'Ha Noi',
      'Ba Đình': 'Ba Dinh',
      'Hoàn Kiếm': 'Hoan Kiem',
      'Hai Bà Trưng': 'Hai Ba Trung',
      'Đống Đa': 'Dong Da',
      'Tây Hồ': 'Tay Ho',
      'Cầu Giấy': 'Cau Giay',
      'Thanh Xuân': 'Thanh Xuan',
      'Nam Từ Liêm': 'Nam Tu Liem',
      'Bắc Từ Liêm': 'Bac Tu Liem',
      'Hoàng Mai': 'Hoang Mai',
      'Long Biên': 'Long Bien',
      'Hà Đông': 'Ha Dong',
      // Job card tags - salary ranges & locations
      '40.000-42.000 đô la': '$40,000-$42,000',
      '50.000-60.000 đô la': '$50,000-$60,000',
      '35.000-45.000 đô la': '$35,000-$45,000',
      'New York, Hoa Kỳ': 'New York, USA',
      'San Francisco, Hoa Kỳ': 'San Francisco, USA',
      'Los Angeles, Hoa Kỳ': 'Los Angeles, USA'
      ,
      // Filter group labels (Vietnamese → English)
      'Địa điểm': 'Location',
      'Mức lương': 'Salary',
      'Kinh nghiệm': 'Experience',
      'Ngành nghề': 'Category',
      // Salary ranges
      'Dưới 5 triệu': 'Under 5M VND',
      '5-10 triệu': '5-10M VND',
      '10-15 triệu': '10-15M VND',
      '15-20 triệu': '15-20M VND',
      '20-30 triệu': '20-30M VND',
      '30-50 triệu': '30-50M VND',
      'Trên 50 triệu': 'Over 50M VND',
      // Experience
      'Thực tập sinh': 'Intern',
      'Fresher (0-1 năm)': 'Fresher (0-1 year)',
      'Junior (1-3 năm)': 'Junior (1-3 years)',
      'Middle (3-5 năm)': 'Middle (3-5 years)',
      'Senior (5-8 năm)': 'Senior (5-8 years)',
      'Lead (8+ năm)': 'Lead (8+ years)',
      // Industries
      'Công nghệ thông tin': 'Information Technology',
      'Marketing': 'Marketing',
      'Kinh doanh': 'Sales',
      'Tài chính': 'Finance',
      'Nhân sự': 'Human Resources',
      'Thiết kế': 'Design',
      'Giáo dục': 'Education',
      'Y tế': 'Healthcare'
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