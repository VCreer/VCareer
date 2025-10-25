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
      'profile.job_notification_settings': 'Cài đặt thông báo việc làm',
      'profile.email_reception_settings': 'Cài đặt nhận email',
      'profile.personal_security': 'Cá nhân & Bảo mật',
      'profile.personal_info_settings': 'Cài đặt thông tin cá nhân',
      'profile.security_settings': 'Cài đặt bảo mật',
      'profile.change_password': 'Đổi mật khẩu',
      'profile.upgrade_account': 'Nâng cấp tài khoản',
      'profile.upgrade_vip_account': 'Nâng cấp tài khoản VIP',
      'profile.activate_gift': 'Kích hoạt quà tặng',
      
      // Job Page
      'job_page.title': 'Việc làm',
      'job_page.category_placeholder': 'Danh mục Nghề',
      'job_page.categories.it': 'Công nghệ thông tin',
      'job_page.categories.marketing': 'Marketing',
      'job_page.categories.accounting': 'Kế toán',
      'job_page.position_placeholder': 'Vị trí tuyển dụng',
      'job_page.location_placeholder': 'Địa điểm',
      'job_page.locations.hanoi': 'Hà Nội',
      'job_page.locations.hcm': 'TP. Hồ Chí Minh',
      'job_page.locations.danang': 'Đà Nẵng',
      'job_page.search_button': 'Tìm kiếm',
      
      // Job Filter
      'job_filter.title': 'Lọc nâng cao',
      'job_filter.category_title': 'Theo danh mục nghề',
      'job_filter.category.all': 'Tất cả',
      'job_filter.category.it': 'Công nghệ thông tin',
      'job_filter.category.marketing': 'Marketing',
      'job_filter.category.sales': 'Kinh doanh',
      'job_filter.category.hr': 'Nhân sự',
      'job_filter.category.finance': 'Tài chính',
      'job_filter.category.design': 'Thiết kế',
      'job_filter.category.production': 'Sản xuất',
      'job_filter.experience_title': 'Kinh nghiệm',
      'job_filter.experience.all': 'Tất cả',
      'job_filter.experience.under1': 'Dưới 1 năm',
      'job_filter.experience.none': 'Không yêu cầu',
      'job_filter.experience.1year': '1 năm',
      'job_filter.experience.2years': '2 năm',
      'job_filter.experience.3years': '3 năm',
      'job_filter.experience.4years': '4 năm',
      'job_filter.experience.5years': '5 năm',
      'job_filter.experience.over5': 'Trên 5 năm',
      'job_filter.level_title': 'Cấp bậc',
      'job_filter.level.all': 'Tất cả',
      'job_filter.level.staff': 'Nhân viên',
      'job_filter.level.team-lead': 'Trưởng nhóm',
      'job_filter.level.head-department': 'Trưởng/Phó phòng',
      'job_filter.level.manager': 'Quản lý / Giám sát',
      'job_filter.level.branch-manager': 'Trưởng chi nhánh',
      'job_filter.level.deputy-director': 'Phó giám đốc',
      'job_filter.level.director': 'Giám đốc',
      'job_filter.level.intern': 'Thực tập sinh',
      
      // Work Type Filter
      'job_filter.work_type_title': 'Hình thức làm việc',
      'job_filter.work_type.all': 'Tất cả',
      'job_filter.work_type.full_time': 'Toàn thời gian',
      'job_filter.work_type.part_time': 'Bán thời gian',
      'job_filter.work_type.internship': 'Thực tập',
      'job_filter.work_type.other': 'Khác',
      
      // Salary Filter
      'job_filter.salary_title': 'Mức lương',
      'job_filter.salary.all': 'Tất cả',
      'job_filter.salary.under_10': 'Dưới 10 triệu',
      'job_filter.salary.10_15': '10 - 15 triệu',
      'job_filter.salary.15_20': '15 - 20 triệu',
      'job_filter.salary.20_25': '20 - 25 triệu',
      'job_filter.salary.25_30': '25 - 30 triệu',
      'job_filter.salary.30_50': '30 - 50 triệu',
      'job_filter.salary.over_50': 'Trên 50 triệu',
      'job_filter.salary.negotiable': 'Thoả thuận',
      
      'job_filter.clear_filters': 'Xóa lọc',
      
      // Job List
      'job_list.quick_view': 'Xem nhanh',
      'job_list.hide_job': 'Mắt ẩn tin tuyển dụng',
      'job_list.load_more': 'Xem thêm việc làm',
      'job_list.hide_success': 'Đã ẩn tin tuyển dụng thành công',
      'job_list.save_success': 'Đã lưu công việc vào danh sách yêu thích',
      'job_list.unsave_success': 'Đã bỏ lưu công việc khỏi danh sách yêu thích',
      'job_list.quick_view_detail': 'Đang xem chi tiết',
      'job_list.no_jobs_found': 'Chưa tìm thấy việc làm phù hợp với yêu cầu của bạn',
      
      // Job Detail
      'job_detail.view_detail': 'Xem chi tiết >',
      'job_detail.apply_now': 'Ứng tuyển ngay',
      'job_detail.job_description': 'Mô tả công việc',
      'job_detail.candidate_requirements': 'Yêu cầu ứng viên',
      'job_detail.benefits': 'Quyền lợi',
      'job_detail.work_location': 'Địa điểm làm việc',
      'job_detail.working_hours': 'Thời gian làm việc',
      'job_detail.save_success': 'Đã lưu công việc vào danh sách yêu thích',
      'job_detail.unsave_success': 'Đã bỏ lưu công việc khỏi danh sách yêu thích',
      
      // Job Data
      'job_data.factory_director': 'Giám đốc nhà máy, thu nhập hấp dẫn 30 - 50 triệu/tháng có thể thoả thuận',
      'job_data.general_accountant': 'Kế toán tổng hợp',
      'job_data.digital_marketing_specialist': 'Chuyên viên Marketing số',
      'job_data.full_stack_developer': 'Lập trình viên Full Stack',
      'job_data.senior_software_engineer': 'Kỹ sư phần mềm cấp cao',
      'job_data.product_manager': 'Trưởng phòng Sản phẩm',
      'job_data.ux_ui_designer': 'Thiết kế UX/UI',
      'job_data.data_analyst': 'Chuyên viên phân tích dữ liệu',
      
      'job_data.company_ibs': 'CÔNG TY CỔ PHẦN IBS',
      'job_data.company_draho': 'CÔNG TY TNHH DRAHO',
      'job_data.company_benavi': 'CÔNG TY TNHH BENAVI',
      'job_data.company_tech': 'CÔNG TY CỔ PHẦN TECH',
      'job_data.company_tech_solutions': 'CÔNG TY TNHH TECH SOLUTIONS',
      'job_data.company_innovation': 'CÔNG TY TNHH INNOVATION',
      'job_data.company_design_studio': 'CÔNG TY TNHH DESIGN STUDIO',
      'job_data.company_data_insights': 'CÔNG TY TNHH DATA INSIGHTS',
      
      'job_data.location_long_an': 'Long An',
      'job_data.location_hanoi': 'Hà Nội',
      'job_data.location_hcmc': 'Thành phố Hồ Chí Minh',
      'job_data.location_da_nang': 'Đà Nẵng',
      
      'job_data.experience_5_years': '5 năm',
      'job_data.experience_no_requirement': 'Không yêu cầu',
      'job_data.experience_2_years': '2 năm',
      'job_data.experience_3_years': '3 năm',
      'job_data.experience_4_years': '4 năm',
      
      'job_data.salary_negotiable': 'Thoả thuận',
      'job_data.salary_9_20_million': '9 - 20 triệu',
      'job_data.salary_12_20_million': '12 - 20 triệu',
      'job_data.salary_45_80_million': '45 - 80 triệu',
      'job_data.salary_25_40_million': '25 - 40 triệu',
      'job_data.salary_30_50_million': '30 - 50 triệu',
      'job_data.salary_15_25_million': '15 - 25 triệu',
      'job_data.salary_18_30_million': '18 - 30 triệu',

      // Pagination
      'pagination.pages': 'trang',
      'profile.logout': 'Đăng xuất',
      
      // Notifications
      'notifications.title': 'Thông báo',
      'notifications.mark_all_read': 'Đánh dấu là đã đọc',
      'notifications.sample_text': 'Ứng viên cùng ngành với bạn cũng quan tâm vị trí này:',

      // CV Management
      'cv_management.title': 'Quản lý CV',
      'cv_management.subtitle': 'Tạo và quản lý CV của bạn một cách dễ dàng',
      'cv_management.cv_list_title': 'CV đã tạo trên VCareer',
      'cv_management.create_cv': 'Tạo CV',
      'cv_management.create_first_cv': 'Tạo CV đầu tiên',
      'cv_management.no_cv_title': 'Chưa có CV nào',
      'cv_management.no_cv_description': 'Hãy tạo CV đầu tiên để bắt đầu tìm kiếm việc làm',
      'cv_management.updated': 'Cập nhật',
      'cv_management.view': 'Xem',
      'cv_management.edit': 'Chỉnh sửa',
      'cv_management.duplicate': 'Sao chép',
      'cv_management.set_default': 'Đặt mặc định',
      'cv_management.delete': 'Xóa',
      'cv_management.confirm_delete': 'Bạn có chắc chắn muốn xóa CV này?',
      'cv_management.welcome_back': 'Chào bạn trở lại',
      'cv_management.verified_account': 'Tài khoản đã xác thực',
      'cv_management.upgrade_account': 'Nâng cấp tài khoản',
      'cv_management.job_search_settings': 'Cài đặt tìm việc',
      'cv_management.job_search_status': 'Đang Tắt tìm việc',
      'cv_management.job_search_description': 'Bật tìm việc giúp hồ sơ của bạn nổi bật hơn và được chú ý nhiều hơn trong danh sách tìm kiếm của NTD.',
      'cv_management.allow_recruiter_search': 'Cho phép NTD tìm kiếm hồ sơ',
      'cv_management.contact_methods_title': 'Khi có cơ hội việc làm phù hợp, NTD sẽ liên hệ và trao đổi với bạn qua:',
      'cv_management.top_connect': 'Nhắn tin qua Top Connect trên VCareer',
      'cv_management.email_phone': 'Email và Số điện thoại của bạn',
      'cv_management.download_app': 'Tải App VCareer ngay!',
      'cv_management.app_description': 'Để không bỏ lỡ bất cứ cơ hội nào từ Nhà tuyển dụng',
      'cv_management.career_guidance': 'Định hướng nghề nghiệp theo tử vi',
      'cv_management.career_feature_1': 'Hiểu rõ tổng quan sự nghiệp',
      'cv_management.career_feature_2': 'Định hướng nghề nghiệp theo tử vi',
      'cv_management.career_feature_3': 'Làm chủ vận mệnh cùng chuyên gia',
      'cv_management.register_now': 'Đăng ký ngay',
      'cv_management.hide_profile': 'Ẩn hồ sơ với NTD',
      'cv_management.new': 'Mới',
      'cv_management.hide_profile_description': 'Tôi không muốn CV của tôi hiển thị với danh sách các NTD có tên miền email và thuộc các công ty dưới đây:',
      'cv_management.default': 'Mặc định',
      'cv_management.loading': 'Đang tải...',
      'cv_management.creating_cv': 'Đang tạo CV...',
      'cv_management.updated_successfully': 'CV đã được cập nhật thành công!',
      'cv_management.deleted_successfully': 'CV đã được xóa thành công!',
      'cv_management.delete_failed': 'Xóa CV thất bại',
      'cv_management.duplicated_successfully': 'CV đã được sao chép thành công!',
      'cv_management.duplicate_failed': 'Sao chép CV thất bại',
    'cv_management.set_default_successfully': 'Đặt CV làm mặc định thành công!',
    'cv_management.set_default_failed': 'Đặt CV làm mặc định thất bại',
    'cv_management.download': 'Tải về',
    'cv_management.push_to_top': 'Đẩy top',

    // Download CV Modal
    'download_cv.title': 'Tải CV',
    'download_cv.without_logo_title': 'Tải CV không kèm biểu tượng @VCareer',
    'download_cv.without_logo_description': 'Không giới hạn lượt tải, số CV và số mẫu thiết kế trong vòng 24 giờ.',
    'download_cv.without_logo_button': 'Tải CV không có biểu tượng',
    'download_cv.free_title': 'Tải CV miễn phí',
    'download_cv.free_description': 'Kèm biểu tượng @VCareer',
      'download_cv.free_button': 'Tải CV miễn phí',
      'download_cv.success_without_logo': 'Tải CV không kèm biểu tượng thành công!',
      'download_cv.success_free': 'Tải CV miễn phí thành công!',
    'cv_management.copy_link': 'Sao chép liên kết',
    'cv_management.share_facebook': 'Chia sẻ trên Facebook',
    'cv_management.create_copy': 'Tạo bản sao',
      'cv_management.rename': 'Đổi tên',
      'cv_management.rename_success': 'Đổi tên CV thành công!',
      'cv_management.delete_success': 'Xóa CV thành công!',
      'cv_management.upload_cv_title': 'CV đã tải lên VCareer',
      'cv_management.upload_cv': 'Tải CV lên',
      'cv_management.no_cv_uploaded': 'Chưa có CV nào được tải lên.',
      'cv_management.uploading_cv': 'Đang tải CV lên...',
      
      // Upload CV Modal
      'upload_cv.title': 'Upload CV để các cơ hội việc làm tự tìm đến bạn',
      'upload_cv.subtitle': 'Giảm đến 50% thời gian cần thiết để tìm được một công việc phù hợp',
      'upload_cv.description': 'Bạn đã có sẵn CV của mình, chỉ cần tải CV lên, hệ thống sẽ tự động đề xuất CV của bạn tới những nhà tuyển dụng uy tín.',
      'upload_cv.benefits': 'Tiết kiệm thời gian, tìm việc thông minh, nắm bắt cơ hội và làm chủ đường đua nghề nghiệp của chính mình.',
      'upload_cv.upload_instructions': 'Tải lên CV từ máy tính, chọn hoặc kéo thả',
      'upload_cv.supported_formats': 'Hỗ trợ định dạng .doc, .docx, .pdf có kích thước dưới 5MB',
      'upload_cv.select_cv': 'Chọn CV',
      'upload_cv.upload_button': 'Tải CV lên',
      'upload_cv.file_selected_success': 'File đã được chọn thành công!',
      'upload_cv.invalid_file_type': 'Định dạng file không được hỗ trợ. Vui lòng chọn file .doc, .docx hoặc .pdf',
      'upload_cv.file_too_large': 'File quá lớn. Vui lòng chọn file dưới 5MB',
      'upload_cv.upload_success': 'Upload CV thành công!',
      
      // CV Card
      'cv_card.updated': 'Cập nhật',
      'cv_card.download': 'Tải về',
      'cv_card.download_success': 'Tải CV thành công!',
      'cv_card.copy_link': 'Sao chép liên kết',
      'cv_card.share_facebook': 'Chia sẻ trên Facebook',
      'cv_card.rename': 'Đổi tên',
      'cv_card.delete': 'Xoá',
      'cv_card.copy_link_success': 'Đã sao chép liên kết!',
      'cv_card.share_facebook_success': 'Đã chia sẻ trên Facebook!',
      'cv_card.rename_success': 'Đã đổi tên CV!',
      'cv_card.delete_success': 'Đã xóa CV!',
      
      // Confirm Delete Modal
      'confirm_delete.title': 'Xác nhận',
      'confirm_delete.message': 'Bạn chắc chắn muốn xóa CV này?',
      'confirm_delete.cancel': 'Hủy',
      'confirm_delete.delete': 'Xóa',
      
      // Rename CV Modal
      'rename_cv.title': 'Đổi tên CV',
      'rename_cv.placeholder': 'Nhập tên CV mới',
      'rename_cv.hint': 'Tên CV (Ví dụ: CV Marketing, CV Lập trình, CV ứng tuyển công ty...)',
      'rename_cv.cancel': 'Hủy bỏ',
      'rename_cv.update': 'Cập nhật',
    
    // Profile Sidebar
    'profile_sidebar.welcome_back': 'Chào bạn trở lại',
    'profile_sidebar.verified_account': 'Tài khoản đã xác thực',
    'profile_sidebar.upgrade_account': 'Nâng cấp tài khoản',
    'profile_sidebar.contact_description': 'Khi có cơ hội việc làm phù hợp, NTD sẽ liên hệ và trao đổi với bạn qua:',
    'profile_sidebar.email_phone': 'Email và Số điện thoại của bạn',

    // Profile Picture Edit Modal
    'profile_picture_edit.title': 'CHỈNH SỬA ẢNH ĐẠI DIỆN',
    'profile_picture_edit.preview_label': 'Ảnh hiển thị trên CV',
    'profile_picture_edit.change_picture': 'Đổi ảnh',
    'profile_picture_edit.delete_picture': 'Xóa ảnh',
    'profile_picture_edit.done': 'Xong',
    'profile_picture_edit.close_no_save': 'Đóng lại (Không lưu)',
    'profile_picture_edit.change_success': 'Ảnh đại diện đã được thay đổi thành công!',
    'profile_picture_edit.delete_success': 'Ảnh đại diện đã được xóa thành công!',
      
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
      'profile.job_notification_settings': 'Job notification settings',
      'profile.email_reception_settings': 'Email reception settings',
      'profile.personal_security': 'Personal & Security',
      'profile.personal_info_settings': 'Personal information settings',
      'profile.security_settings': 'Security settings',
      'profile.change_password': 'Change password',
      'profile.upgrade_account': 'Upgrade account',
      'profile.upgrade_vip_account': 'Upgrade VIP account',
      'profile.activate_gift': 'Activate gift',
      
      // Job Page
      'job_page.title': 'Jobs',
      'job_page.category_placeholder': 'Job Category',
      'job_page.categories.it': 'Information Technology',
      'job_page.categories.marketing': 'Marketing',
      'job_page.categories.accounting': 'Accounting',
      'job_page.position_placeholder': 'Job Position',
      'job_page.location_placeholder': 'Location',
      'job_page.locations.hanoi': 'Hanoi',
      'job_page.locations.hcm': 'Ho Chi Minh City',
      'job_page.locations.danang': 'Da Nang',
      'job_page.search_button': 'Search',
      
      // Job Filter
      'job_filter.title': 'Advanced Filter',
      'job_filter.category_title': 'Job Categories',
      'job_filter.category.all': 'All',
      'job_filter.category.it': 'Information Technology',
      'job_filter.category.marketing': 'Marketing',
      'job_filter.category.sales': 'Sales',
      'job_filter.category.hr': 'Human Resources',
      'job_filter.category.finance': 'Finance',
      'job_filter.category.design': 'Design',
      'job_filter.category.production': 'Production',
      'job_filter.experience_title': 'Experience',
      'job_filter.experience.all': 'All',
      'job_filter.experience.under1': 'Under 1 year',
      'job_filter.experience.none': 'No requirement',
      'job_filter.experience.1year': '1 year',
      'job_filter.experience.2years': '2 years',
      'job_filter.experience.3years': '3 years',
      'job_filter.experience.4years': '4 years',
      'job_filter.experience.5years': '5 years',
      'job_filter.experience.over5': 'Over 5 years',
      'job_filter.level_title': 'Level',
      'job_filter.level.all': 'All',
      'job_filter.level.staff': 'Employee',
      'job_filter.level.team-lead': 'Team Leader',
      'job_filter.level.head-department': 'Head/Deputy Head',
      'job_filter.level.manager': 'Manager / Supervisor',
      'job_filter.level.branch-manager': 'Branch Manager',
      'job_filter.level.deputy-director': 'Deputy Director',
      'job_filter.level.director': 'Director',
      'job_filter.level.intern': 'Intern',
      
      // Work Type Filter
      'job_filter.work_type_title': 'Work Type',
      'job_filter.work_type.all': 'All',
      'job_filter.work_type.full_time': 'Full-time',
      'job_filter.work_type.part_time': 'Part-time',
      'job_filter.work_type.internship': 'Internship',
      'job_filter.work_type.other': 'Other',
      
      // Salary Filter
      'job_filter.salary_title': 'Salary Level',
      'job_filter.salary.all': 'All',
      'job_filter.salary.under_10': 'Under 10 million',
      'job_filter.salary.10_15': '10 - 15 million',
      'job_filter.salary.15_20': '15 - 20 million',
      'job_filter.salary.20_25': '20 - 25 million',
      'job_filter.salary.25_30': '25 - 30 million',
      'job_filter.salary.30_50': '30 - 50 million',
      'job_filter.salary.over_50': 'Over 50 million',
      'job_filter.salary.negotiable': 'Negotiable',
      
      'job_filter.clear_filters': 'Clear Filters',
      
      // Job List
      'job_list.quick_view': 'Quick View',
      'job_list.hide_job': 'Hide Job Posting',
      'job_list.load_more': 'Load More Jobs',
      'job_list.hide_success': 'Job posting hidden successfully',
      'job_list.save_success': 'Job saved to favorites',
      'job_list.unsave_success': 'Job removed from favorites',
      'job_list.quick_view_detail': 'Viewing details',
      'job_list.no_jobs_found': 'No jobs found matching your requirements',
      
      // Job Detail
      'job_detail.view_detail': 'View Details >',
      'job_detail.apply_now': 'Apply Now',
      'job_detail.job_description': 'Job Description',
      'job_detail.candidate_requirements': 'Candidate Requirements',
      'job_detail.benefits': 'Benefits',
      'job_detail.work_location': 'Work Location',
      'job_detail.working_hours': 'Working Hours',
      'job_detail.save_success': 'Job saved to favorites',
      'job_detail.unsave_success': 'Job removed from favorites',
      
      // Job Data
      'job_data.factory_director': 'Factory Director, Attractive Income 30 - 50 Million/Month Negotiable',
      'job_data.general_accountant': 'General Accountant',
      'job_data.digital_marketing_specialist': 'Digital Marketing Specialist',
      'job_data.full_stack_developer': 'Full Stack Developer',
      'job_data.senior_software_engineer': 'Senior Software Engineer',
      'job_data.product_manager': 'Product Manager',
      'job_data.ux_ui_designer': 'UX/UI Designer',
      'job_data.data_analyst': 'Data Analyst',
      
      'job_data.company_ibs': 'IBS JOINT STOCK COMPANY',
      'job_data.company_draho': 'DRAHO CO., LTD.',
      'job_data.company_benavi': 'BENAVI CO., LTD.',
      'job_data.company_tech': 'TECH JOINT STOCK COMPANY',
      'job_data.company_tech_solutions': 'TECH SOLUTIONS INC.',
      'job_data.company_innovation': 'INNOVATION CORP.',
      'job_data.company_design_studio': 'DESIGN STUDIO',
      'job_data.company_data_insights': 'DATA INSIGHTS LTD.',
      
      'job_data.location_long_an': 'Long An',
      'job_data.location_hanoi': 'Hanoi',
      'job_data.location_hcmc': 'Ho Chi Minh City',
      'job_data.location_da_nang': 'Da Nang',
      
      'job_data.experience_5_years': '5 years',
      'job_data.experience_no_requirement': 'No requirement',
      'job_data.experience_2_years': '2 years',
      'job_data.experience_3_years': '3 years',
      'job_data.experience_4_years': '4 years',
      
      'job_data.salary_negotiable': 'Negotiable',
      'job_data.salary_9_20_million': '9 - 20 million',
      'job_data.salary_12_20_million': '12 - 20 million',
      'job_data.salary_45_80_million': '45 - 80 million',
      'job_data.salary_25_40_million': '25 - 40 million',
      'job_data.salary_30_50_million': '30 - 50 million',
      'job_data.salary_15_25_million': '15 - 25 million',
      'job_data.salary_18_30_million': '18 - 30 million',

      // Pagination
      'pagination.pages': 'pages',
      
      'profile.logout': 'Logout',
      
      // Notifications
      'notifications.title': 'Notifications',
      'notifications.mark_all_read': 'Mark as read',
      'notifications.sample_text': 'Candidates in your industry are also interested in this position:',

      // CV Management
      'cv_management.title': 'CV Management',
      'cv_management.subtitle': 'Create and manage your CV easily',
      'cv_management.cv_list_title': 'CVs created on VCareer',
      'cv_management.create_cv': 'Create CV',
      'cv_management.create_first_cv': 'Create first CV',
      'cv_management.no_cv_title': 'No CVs yet',
      'cv_management.no_cv_description': 'Create your first CV to start job searching',
      'cv_management.updated': 'Updated',
      'cv_management.view': 'View',
      'cv_management.edit': 'Edit',
      'cv_management.duplicate': 'Duplicate',
      'cv_management.set_default': 'Set as default',
      'cv_management.delete': 'Delete',
      'cv_management.confirm_delete': 'Are you sure you want to delete this CV?',
      'cv_management.welcome_back': 'Welcome back',
      'cv_management.verified_account': 'Verified account',
      'cv_management.upgrade_account': 'Upgrade account',
      'cv_management.job_search_settings': 'Job search settings',
      'cv_management.job_search_status': 'Job search is OFF',
      'cv_management.job_search_description': 'Enable job search to make your profile more prominent and get more attention from recruiters.',
      'cv_management.allow_recruiter_search': 'Allow recruiters to search profile',
      'cv_management.contact_methods_title': 'When there are suitable job opportunities, recruiters will contact you via:',
      'cv_management.top_connect': 'Top Connect messaging on VCareer',
      'cv_management.email_phone': 'Your email and phone number',
      'cv_management.download_app': 'Download VCareer App now!',
      'cv_management.app_description': 'Don\'t miss any opportunities from recruiters',
      'cv_management.career_guidance': 'Career guidance by astrology',
      'cv_management.career_feature_1': 'Understand your career overview',
      'cv_management.career_feature_2': 'Career guidance by astrology',
      'cv_management.career_feature_3': 'Master your destiny with experts',
      'cv_management.register_now': 'Register now',
      'cv_management.hide_profile': 'Hide profile from recruiters',
      'cv_management.new': 'New',
      'cv_management.hide_profile_description': 'I don\'t want my CV to be displayed to recruiters with email domains and companies listed below:',
      'cv_management.default': 'Default',
      'cv_management.loading': 'Loading...',
      'cv_management.creating_cv': 'Creating CV...',
      'cv_management.updated_successfully': 'CV updated successfully!',
      'cv_management.deleted_successfully': 'CV deleted successfully!',
      'cv_management.delete_failed': 'Failed to delete CV',
      'cv_management.duplicated_successfully': 'CV duplicated successfully!',
      'cv_management.duplicate_failed': 'Failed to duplicate CV',
      'cv_management.set_default_successfully': 'CV set as default successfully!',
      'cv_management.set_default_failed': 'Failed to set CV as default',
      'cv_management.download': 'Download',
      'cv_management.push_to_top': 'Push to top',

      // Download CV Modal
      'download_cv.title': 'Download CV',
      'download_cv.without_logo_title': 'Download CV without @VCareer logo',
      'download_cv.without_logo_description': 'Unlimited downloads, CVs and design templates within 24 hours.',
      'download_cv.without_logo_button': 'Download CV without logo',
      'download_cv.free_title': 'Free download',
      'download_cv.free_description': 'With @VCareer logo',
      'download_cv.free_button': 'Free download',
      'download_cv.success_without_logo': 'Download CV without logo successful!',
      'download_cv.success_free': 'Free download successful!',
      'cv_management.copy_link': 'Copy link',
      'cv_management.share_facebook': 'Share on Facebook',
      'cv_management.create_copy': 'Create copy',
      'cv_management.rename': 'Rename',
      'cv_management.rename_success': 'CV renamed successfully!',
      'cv_management.delete_success': 'CV deleted successfully!',
      'cv_management.upload_cv_title': 'CVs uploaded to VCareer',
      'cv_management.upload_cv': 'Upload CV',
      'cv_management.no_cv_uploaded': 'No CVs have been uploaded yet.',
      'cv_management.uploading_cv': 'Uploading CV...',
      
      // Upload CV Modal
      'upload_cv.title': 'Upload CV so job opportunities find you',
      'upload_cv.subtitle': 'Reduce up to 50% of the time needed to find a suitable job',
      'upload_cv.description': 'If you already have your CV, just upload it, and the system will automatically suggest your CV to reputable recruiters.',
      'upload_cv.benefits': 'Save time, find jobs smartly, seize opportunities, and take control of your career path.',
      'upload_cv.upload_instructions': 'Upload CV from computer, select or drag and drop',
      'upload_cv.supported_formats': 'Supports .doc, .docx, .pdf formats with size under 5MB',
      'upload_cv.select_cv': 'Select CV',
      'upload_cv.upload_button': 'Upload CV',
      'upload_cv.file_selected_success': 'File selected successfully!',
      'upload_cv.invalid_file_type': 'Unsupported file format. Please select .doc, .docx or .pdf file',
      'upload_cv.file_too_large': 'File too large. Please select file under 5MB',
      'upload_cv.upload_success': 'CV uploaded successfully!',
      
      // CV Card
      'cv_card.updated': 'Updated',
      'cv_card.download': 'Download',
      'cv_card.download_success': 'CV downloaded successfully!',
      'cv_card.copy_link': 'Copy link',
      'cv_card.share_facebook': 'Share on Facebook',
      'cv_card.rename': 'Rename',
      'cv_card.delete': 'Delete',
      'cv_card.copy_link_success': 'Link copied!',
      'cv_card.share_facebook_success': 'Shared on Facebook!',
      'cv_card.rename_success': 'CV renamed!',
      'cv_card.delete_success': 'CV deleted!',
      
      // Confirm Delete Modal
      'confirm_delete.title': 'Confirm',
      'confirm_delete.message': 'Are you sure you want to delete this CV?',
      'confirm_delete.cancel': 'Cancel',
      'confirm_delete.delete': 'Delete',
      
      // Rename CV Modal
      'rename_cv.title': 'Rename CV',
      'rename_cv.placeholder': 'Enter new CV name',
      'rename_cv.hint': 'CV Name (Example: CV Marketing, CV Programming, CV company application...)',
      'rename_cv.cancel': 'Cancel',
      'rename_cv.update': 'Update',
      
      // Profile Sidebar
      'profile_sidebar.welcome_back': 'Welcome back',
      'profile_sidebar.verified_account': 'Verified account',
      'profile_sidebar.upgrade_account': 'Upgrade account',
      'profile_sidebar.contact_description': 'When there is a suitable job opportunity, the Employer will contact and discuss with you via:',
      'profile_sidebar.email_phone': 'Your Email and Phone number',

      // Profile Picture Edit Modal
      'profile_picture_edit.title': 'EDIT PROFILE PICTURE',
      'profile_picture_edit.preview_label': 'Picture displayed on CV',
      'profile_picture_edit.change_picture': 'Change picture',
      'profile_picture_edit.delete_picture': 'Delete picture',
      'profile_picture_edit.done': 'Done',
      'profile_picture_edit.close_no_save': 'Close (Don\'t save)',
      'profile_picture_edit.change_success': 'Profile picture changed successfully!',
      'profile_picture_edit.delete_success': 'Profile picture deleted successfully!',
      
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
