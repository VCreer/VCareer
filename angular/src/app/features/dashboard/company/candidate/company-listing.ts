import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslationService } from '../../../../core/services/translation.service';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination';
import { CompanyService, CompanyLegalInfoDto, CompanySearchInputDto, PagedResultDto } from '../../../../apiTest/api/company.service';

export interface Company {
  id: string;
  name: string;
  fullName: string;
  description: string;
  logo?: string;
  image: string;
  industry?: string;
}

@Component({
  selector: 'app-company-listing',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './company-listing.html',
  styleUrls: ['./company-listing.scss']
})
export class CompanyListingComponent implements OnInit {
  searchKeyword: string = '';
  companies: CompanyLegalInfoDto[] = [];
  topCompanies: Company[] = []; // Vẫn dùng mock cho top companies
  activeTab: 'list' | 'top' = 'list';
  
  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 9;
  totalCompanies: number = 0;
  paginatedCompanies: CompanyLegalInfoDto[] = [];
  
  isLoading: boolean = false;

  constructor(
    private router: Router,
    private translationService: TranslationService,
    private companyService: CompanyService
  ) {}

  ngOnInit() {
    this.loadCompanies();
    this.loadTopCompanies();
  }

  get totalPages(): number {
    return Math.ceil(this.totalCompanies / this.itemsPerPage);
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.loadCompanies();
    // Scroll to top of company list
    window.scrollTo({ top: document.querySelector('.company-list-section')?.getBoundingClientRect().top + window.pageYOffset - 100 || 0, behavior: 'smooth' });
  }

  setActiveTab(tab: 'list' | 'top') {
    this.activeTab = tab;
    this.currentPage = 1; // Reset về trang 1 khi chuyển tab
    if (tab === 'list') {
      this.loadCompanies();
    } else {
      this.updateTopCompaniesDisplay();
    }
  }

  updateTopCompaniesDisplay() {
    this.totalCompanies = this.topCompanies.length;
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    // Convert top companies to CompanyLegalInfoDto format for display
    this.paginatedCompanies = this.topCompanies.slice(startIndex, endIndex).map(c => ({
      id: parseInt(c.id),
      companyName: c.fullName || c.name,
      description: c.description,
      logoUrl: c.image,
    } as CompanyLegalInfoDto));
  }

  loadCompanies() {
    if (this.activeTab === 'top') {
      this.updateTopCompaniesDisplay();
      return;
    }

    this.isLoading = true;
    
    const input: CompanySearchInputDto = {
      keyword: this.searchKeyword?.trim() || undefined,
      status: true, // Chỉ lấy các công ty active
      skipCount: (this.currentPage - 1) * this.itemsPerPage,
      maxResultCount: this.itemsPerPage
    };

    this.companyService.searchCompanies(input).subscribe({
      next: (result: PagedResultDto<CompanyLegalInfoDto>) => {
        this.companies = result.items;
        this.totalCompanies = result.totalCount;
        this.paginatedCompanies = result.items;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading companies:', error);
        this.isLoading = false;
        // Fallback to empty array on error
        this.companies = [];
        this.totalCompanies = 0;
        this.paginatedCompanies = [];
      }
    });
  }

  /**
   * Truncate description nếu quá dài
   */
  truncateDescription(description: string | undefined, maxLength: number = 150): string {
    if (!description) return '';
    if (description.length <= maxLength) return description;
    return description.substring(0, maxLength).trim() + '...';
  }

  /**
   * Lấy tên ngắn gọn từ tên công ty đầy đủ
   */
  getShortCompanyName(fullName: string | undefined): string {
    if (!fullName) return '';
    // Lấy từ đầu tiên hoặc các từ đầu tiên
    const words = fullName.trim().split(' ');
    if (words.length <= 3) return fullName.toUpperCase();
    // Lấy 2-3 từ đầu
    return words.slice(0, 2).join(' ').toUpperCase();
  }

  loadTopCompanies() {
    // TODO: Load top companies from API - chỉ lấy những công ty top/ưu tiên
    // Mock data - danh sách top công ty (nổi bật, được đánh giá cao)
    const mockTopCompanies: Company[] = [
      {
        id: 'top-1',
        name: 'NURA',
        fullName: 'CÔNG TY CỔ PHẦN CÔNG NGHỆ Y TẾ NHẬT VIỆT',
        description: 'Công ty CP Công nghệ Y tế Nhật Việt là đơn vị quản lý vận hành thương hiệu Phòng khám Đa khoa Công nghệ cao NURA - Top công ty trong ngành y tế...',
        image: 'assets/images/company/nura.jpg',
        industry: 'Công nghệ Y tế'
      },
      {
        id: 'top-2',
        name: 'STRINGEE',
        fullName: 'CÔNG TY CỔ PHẦN STRINGEE',
        description: 'Stringee là công ty công nghệ cung cấp nền tảng quản trị doanh nghiệp hợp nhất – Cogover - Top công ty công nghệ hàng đầu...',
        image: 'assets/images/company/stringee.jpg',
        industry: 'Công nghệ'
      },
      {
        id: 'top-3',
        name: 'LOTTE',
        fullName: 'CÔNG TY TNHH LOTTE VIỆT NAM',
        description: '07/1998: Công ty Liên doanh Lotte Việt Nam thành lập nhà máy tại tỉnh Bình Dương - Top công ty đa quốc gia hàng đầu...',
        image: 'assets/images/company/lotte.jpg',
        industry: 'Thực phẩm & Đồ uống'
      },
      {
        id: 'top-4',
        name: 'VNG',
        fullName: 'TẬP ĐOÀN CÔNG NGHỆ VNG',
        description: 'VNG là một trong những tập đoàn công nghệ hàng đầu Việt Nam với nhiều sản phẩm và dịch vụ công nghệ...',
        image: 'assets/images/vng.png',
        industry: 'Công nghệ'
      },
      {
        id: 'top-5',
        name: 'FPT',
        fullName: 'TẬP ĐOÀN FPT',
        description: 'FPT là tập đoàn công nghệ thông tin hàng đầu Việt Nam với quy mô lớn và nhiều hoạt động đa dạng...',
        image: 'assets/images/default-company.png',
        industry: 'Công nghệ'
      },
      {
        id: 'top-6',
        name: 'TECHCOMBANK',
        fullName: 'NGÂN HÀNG THƯƠNG MẠI CỔ PHẦN KỸ THƯƠNG VIỆT NAM',
        description: 'Techcombank là một trong những ngân hàng hàng đầu tại Việt Nam với dịch vụ tài chính hiện đại...',
        image: 'assets/images/default-company.png',
        industry: 'Tài chính - Ngân hàng'
      },
      {
        id: 'top-7',
        name: 'VINGROUP',
        fullName: 'TẬP ĐOÀN VINGROUP',
        description: 'Vingroup là tập đoàn đa ngành nghề hàng đầu Việt Nam với nhiều lĩnh vực từ bất động sản đến công nghệ...',
        image: 'assets/images/default-company.png',
        industry: 'Đa ngành'
      },
      {
        id: 'top-8',
        name: 'VIETTEL',
        fullName: 'TẬP ĐOÀN CÔNG NGHỆ VIỄN THÔNG QUÂN ĐỘI',
        description: 'Viettel là tập đoàn viễn thông và công nghệ thông tin lớn nhất Việt Nam...',
        image: 'assets/images/default-company.png',
        industry: 'Viễn thông'
      },
      {
        id: 'top-9',
        name: 'ACB',
        fullName: 'NGÂN HÀNG THƯƠNG MẠI CỔ PHẦN Á CHÂU',
        description: 'ACB là ngân hàng thương mại cổ phần hàng đầu tại Việt Nam...',
        image: 'assets/images/default-company.png',
        industry: 'Tài chính - Ngân hàng'
      },
      {
        id: 'top-10',
        name: 'GAMELOFT',
        fullName: 'CÔNG TY TNHH GAMELOFT VIỆT NAM',
        description: 'Gameloft là công ty phát triển game quốc tế với nhiều tựa game nổi tiếng...',
        image: 'assets/images/default-company.png',
        industry: 'Game'
      },
      {
        id: 'top-11',
        name: 'MONKEY JUNIOR',
        fullName: 'CÔNG TY CỔ PHẦN EARLY START',
        description: 'Monkey Junior là công ty giáo dục công nghệ với ứng dụng học tiếng Anh cho trẻ em nổi tiếng...',
        image: 'assets/images/default-company.png',
        industry: 'Giáo dục'
      },
      {
        id: 'top-12',
        name: 'GOTIT',
        fullName: 'CÔNG TY CỔ PHẦN GOTIT VIỆT NAM',
        description: 'GotIt là công ty công nghệ với nền tảng học tập và làm việc từ xa...',
        image: 'assets/images/default-company.png',
        industry: 'Công nghệ'
      },
      {
        id: 'top-13',
        name: 'SHOPEE',
        fullName: 'CÔNG TY TNHH SHOPEE VIỆT NAM',
        description: 'Shopee là nền tảng thương mại điện tử hàng đầu tại Việt Nam và Đông Nam Á...',
        image: 'assets/images/default-company.png',
        industry: 'Thương mại điện tử'
      },
      {
        id: 'top-14',
        name: 'LAZADA',
        fullName: 'CÔNG TY TNHH LAZADA VIỆT NAM',
        description: 'Lazada là nền tảng thương mại điện tử lớn với nhiều sản phẩm đa dạng...',
        image: 'assets/images/default-company.png',
        industry: 'Thương mại điện tử'
      },
      {
        id: 'top-15',
        name: 'TIKI',
        fullName: 'CÔNG TY CỔ PHẦN TIKI',
        description: 'Tiki là nền tảng thương mại điện tử và công nghệ hàng đầu tại Việt Nam...',
        image: 'assets/images/default-company.png',
        industry: 'Thương mại điện tử'
      }
    ];

    // Top companies - danh sách thực tế (15 companies)
    this.topCompanies = mockTopCompanies;
  }

  onSearch() {
    this.currentPage = 1; // Reset về trang 1 khi search
    this.loadCompanies();
  }

  onCompanyClick(companyId: number | string) {
    this.router.navigate(['/candidate/company-detail', companyId]);
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }
}

