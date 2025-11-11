import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

interface AccountFeature {
  name: string;
  regular: string | boolean;
  verified: string | boolean;
  proVip: string | boolean;
  premiumVip: string | boolean;
  isNew?: boolean;
}

interface AccountType {
  name: string;
  price: string;
  buttonText: string;
  buttonType: 'current' | 'verified' | 'upgrade' | 'info';
  infoText?: string;
}

@Component({
  selector: 'app-candidate-service',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './service.html',
  styleUrls: ['./service.scss']
})
export class CandidateServiceComponent implements OnInit {
  constructor(private router: Router) {}

  accountTypes: AccountType[] = [
    { name: 'Thường', price: 'Miễn phí', buttonText: 'Đang sử dụng', buttonType: 'current' },
    { name: 'Đã xác thực', price: 'Miễn phí', buttonText: 'Đã xác thực', buttonType: 'verified' },
    { name: 'Pro VIP', price: '50,000 VNĐ', buttonText: 'Nâng cấp', buttonType: 'upgrade' },
    { name: 'Premium VIP', price: '500,000 VNĐ', buttonText: 'Nâng cấp', buttonType: 'upgrade' }
  ];

  features: AccountFeature[] = [
    {
      name: 'Thời hạn sử dụng',
      regular: 'Vĩnh viễn',
      verified: 'Vĩnh viễn',
      proVip: '1 tháng',
      premiumVip: '1 năm'
    },
    {
      name: 'Số lượng CV',
      regular: '6',
      verified: '6',
      proVip: '12',
      premiumVip: '20'
    },
    {
      name: 'Số lượng Cover Letter',
      regular: '6',
      verified: '6',
      proVip: '12',
      premiumVip: '20'
    },
    {
      name: 'Thời gian chờ khi tải CV và Cover Letter',
      regular: '5s',
      verified: '5s',
      proVip: '3s',
      premiumVip: '1s'
    },
    {
      name: 'Ưu tiên đẩy Top hiển thị với NTD',
      regular: false,
      verified: '1 lần/tuần',
      proVip: '1 lần/ngày',
      premiumVip: '1 lần/ngày'
    },
    {
      name: 'Biểu tượng xác minh tài khoản',
      regular: false,
      verified: true,
      proVip: true,
      premiumVip: true
    },
    {
      name: 'Sử dụng mẫu CV Cao Cấp',
      regular: false,
      verified: false,
      proVip: true,
      premiumVip: true
    },
    {
      name: 'Sử dụng mẫu Cover Letter Cao Cấp',
      regular: false,
      verified: false,
      proVip: true,
      premiumVip: true
    },
    {
      name: 'Ẩn biểu tượng @topcv.vn',
      regular: false,
      verified: false,
      proVip: true,
      premiumVip: true
    }
  ];

  ngOnInit(): void {}

  getFeatureValue(feature: AccountFeature, type: 'regular' | 'verified' | 'proVip' | 'premiumVip'): string {
    const value = feature[type];
    if (value === true) return '✓';
    if (value === false) return '-';
    return value as string;
  }

  onUpgrade(accountType: string): void {
    this.router.navigate(['/candidate/upgrade-account/pay'], {
      queryParams: { type: accountType }
    });
  }
}
