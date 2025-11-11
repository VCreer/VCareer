import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ProfileCardComponent } from '../../../../shared/components/profile-card/profile-card';
import { MomoPaymentModalComponent } from '../../../../shared/components/momo-payment-modal/momo-payment-modal';

interface PackageOption {
  id: string;
  name: string;
  price: string;
  duration: string;
  discount?: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  type: 'momo' | 'card';
}

@Component({
  selector: 'app-upgrade-account-pay',
  standalone: true,
  imports: [CommonModule, FormsModule, ProfileCardComponent, MomoPaymentModalComponent],
  templateUrl: './upgrade-account-pay.html',
  styleUrls: ['./upgrade-account-pay.scss']
})
export class UpgradeAccountPayComponent implements OnInit {
  accountType: string | null = null;
  selectedPackage: string = 'pro';
  selectedPaymentMethod: string = 'momo';
  
  // Profile data
  userName: string = 'Nguyễn Văn A';
  userEmail: string = 'user@example.com';
  avatarUrl?: string;
  accountStatus: string = 'Tài khoản đã xác thực';
  jobSearchEnabled: boolean = false;
  allowRecruiterSearch: boolean = true;
  
  // MoMo Payment Modal
  showMomoModal: boolean = false;

  packages: PackageOption[] = [
    {
      id: 'pro',
      name: 'Tài khoản Pro',
      price: '50,000 VNĐ',
      duration: '1 tháng sử dụng'
    },
    {
      id: 'premium',
      name: 'Tài khoản Premium',
      price: '500,000 VNĐ',
      duration: '1 năm sử dụng',
      discount: 'Tiết kiệm 17%'
    }
  ];

  paymentMethods: PaymentMethod[] = [
    {
      id: 'momo',
      name: 'Thanh toán bằng Ví MoMo',
      icon: 'momo',
      type: 'momo'
    }
  ];

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.accountType = params['type'] || null;
      // Set default selected package based on account type
      if (this.accountType?.includes('Premium')) {
        this.selectedPackage = 'premium';
      } else if (this.accountType?.includes('Pro')) {
        this.selectedPackage = 'pro';
      }
    });
  }

  onBack(): void {
    this.router.navigate(['/candidate/service']);
  }

  onPackageSelect(packageId: string): void {
    this.selectedPackage = packageId;
  }

  onPaymentMethodSelect(methodId: string): void {
    this.selectedPaymentMethod = methodId;
    if (methodId === 'momo') {
      this.showMomoModal = true;
    }
  }

  onCloseMomoModal(): void {
    this.showMomoModal = false;
  }
}

