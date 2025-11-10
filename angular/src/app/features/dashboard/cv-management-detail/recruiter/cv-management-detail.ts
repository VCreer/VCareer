import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ButtonComponent,
  ToastNotificationComponent
} from '../../../../shared/components';
import { CandidateCv } from '../../../cv-management/recruiter/cv-management';

export interface CvDetail extends CandidateCv {
  careerObjective?: string;
  education?: Education[];
  honorsAwards?: HonorAward[];
  certificates?: Certificate[];
  activities?: Activity[];
  personalInfo?: PersonalInfo;
  skills?: Skill[];
  contactOpenedDate?: string;
}

export interface Education {
  degree: string;
  school: string;
  startDate: string;
  endDate: string;
  gpa?: string;
  description?: string;
}

export interface HonorAward {
  year: string;
  title: string;
}

export interface Certificate {
  year: string;
  title: string;
}

export interface Activity {
  title: string;
  organization: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface PersonalInfo {
  phone: string;
  email: string;
  facebook?: string;
  address?: string;
}

export interface Skill {
  category: string;
  items: string[];
}

@Component({
  selector: 'app-cv-management-detail',
  standalone: true,
  imports: [
    CommonModule,
    ButtonComponent,
    ToastNotificationComponent
  ],
  templateUrl: './cv-management-detail.html',
  styleUrls: ['./cv-management-detail.scss']
})
export class CvManagementDetailComponent implements OnInit, OnDestroy {
  sidebarExpanded: boolean = false;
  private sidebarCheckInterval?: any;

  cvId: string = '';
  cvDetail: CvDetail | null = null;
  loading = false;

  // Toast notification
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'info' | 'warning' = 'info';

  // Status dropdown
  selectedStatus: string = 'receive';
  showStatusDropdown: boolean = false;

  statusOptions = [
    { value: 'receive', label: 'Tiếp nhận' },
    { value: 'reviewing', label: 'Đang xem xét' },
    { value: 'interviewing', label: 'Đang phỏng vấn' },
    { value: 'offered', label: 'Đã đề xuất' },
    { value: 'hired', label: 'Đã tuyển' },
    { value: 'rejected', label: 'Đã từ chối' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.checkSidebarState();
    this.sidebarCheckInterval = setInterval(() => {
      this.checkSidebarState();
    }, 100);

    // Get CV ID from route
    this.route.queryParams.subscribe(params => {
      this.cvId = params['cvId'] || '';
      if (this.cvId) {
        this.loadCvDetail();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.sidebarCheckInterval) {
      clearInterval(this.sidebarCheckInterval);
    }
  }

  private checkSidebarState(): void {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      this.sidebarExpanded = sidebar.classList.contains('show');
    }
  }

  loadCvDetail(): void {
    this.loading = true;
    // TODO: Load CV detail from API
    // For now, use mock data for easy viewing
    setTimeout(() => {
      // TODO: Replace with actual API call
      // Example: this.cvService.getCvDetail(this.cvId).subscribe(data => {
      //   this.cvDetail = data;
      //   this.loading = false;
      // });
      
      // Mock data for easy viewing
      this.cvDetail = this.generateMockCvDetail(this.cvId);
      this.loading = false;
    }, 500);
  }

  private generateMockCvDetail(cvId: string): CvDetail {
    // Mock data based on the image description
    return {
      id: cvId,
      name: 'Nguyễn Thị Hoa Hồng',
      email: 'bonghoahong@gmail.com',
      phone: '088924618808',
      position: 'NHÂN VIÊN KINH DOANH',
      status: 'new',
      source: 'applied',
      appliedDate: '2022-09-16',
      addedDate: '2023-07-06T00:00:00',
      campaignId: '#407764',
      campaignName: 'Tuyển dụng Developer tháng 10',
      isViewed: true,
      candidateCode: 'CV001',
      notes: '',
      contactOpenedDate: '06/07/2023',
      careerObjective: 'Mục tiêu trở thành nhân viên kinh doanh chuyên nghiệp, mang lại giá trị cho khách hàng và mở rộng cơ sở khách hàng.',
      education: [
        {
          degree: 'QUẢN TRỊ DOANH NGHIỆP',
          school: 'Đại học kinh doanh và công nghệ Hà Nội tran van tuan',
          startDate: '10/2010',
          endDate: '05/2014',
          gpa: '8.0',
          description: 'Tốt nghiệp loại Giỏi, điểm trung bình 8.0 tran van tuan'
        }
      ],
      honorsAwards: [
        {
          year: '2014',
          title: 'Nhân viên xuất sắc năm công ty'
        }
      ],
      certificates: [
        {
          year: '2014',
          title: 'Giải nhất Tài năng'
        }
      ],
      activities: [
        {
          title: 'TÌNH NGUYỆN VIÊN',
          organization: 'Nhóm tình nguyện',
          startDate: '2014',
          endDate: 'Hiện tại',
          description: 'troy Tập hợp các món quà và phân phát tới người vô gia cư. - Chia sẻ, động viên họ vượt qua giai đoạn khó khăn, giúp họ có những suy nghĩ lạc quan.'
        }
      ],
      personalInfo: {
        phone: '088924618808',
        email: 'bonghoahong@gmail.com',
        facebook: 'https://fb.com/vn',
        address: 'Số 10, đường 10,'
      },
      skills: [
        {
          category: 'TIN HỌC VĂN PHÒNG',
          items: [
            'Sử dụng thành thạo các công cụ Word, Excel, Power Point'
          ]
        }
      ]
    };
  }

  onClose(): void {
    this.router.navigate(['/recruiter/cv-management']);
  }

  onDownloadPdf(): void {
    // TODO: Implement download PDF
    this.showToastMessage('Đang tải CV PDF...', 'info');
    setTimeout(() => {
      this.showToastMessage('Tải CV PDF thành công!', 'success');
    }, 1000);
  }

  onContact(contactType: 'phone' | 'email' | 'chat'): void {
    // TODO: Implement contact functionality
    const contactLabels = {
      phone: 'Gọi điện',
      email: 'Gửi email',
      chat: 'Nhắn tin'
    };
    this.showToastMessage(`Đang mở ${contactLabels[contactType]}...`, 'info');
  }

  toggleStatusDropdown(): void {
    if (this.cvDetail) {
      this.showStatusDropdown = !this.showStatusDropdown;
    }
  }

  onStatusSelect(status: string): void {
    this.selectedStatus = status;
    this.showStatusDropdown = false;
    // TODO: Update status via API
    this.showToastMessage('Đã cập nhật trạng thái!', 'success');
  }

  getStatusLabel(value: string): string {
    const status = this.statusOptions.find(s => s.value === value);
    return status ? status.label : 'Tiếp nhận';
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.showStatusDropdown) {
      const target = event.target as HTMLElement;
      if (!target.closest('.status-dropdown-wrapper')) {
        this.showStatusDropdown = false;
      }
    }
  }

  getInitials(name: string): string {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  private showToastMessage(message: string, type: 'success' | 'error' | 'info' | 'warning'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;

    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }

  onToastClose(): void {
    this.showToast = false;
  }
}

