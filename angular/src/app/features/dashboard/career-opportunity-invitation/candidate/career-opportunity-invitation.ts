import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonComponent } from '../../../../shared/components/button/button';
import { ToastNotificationComponent } from '../../../../shared/components/toast-notification/toast-notification';

interface CareerInvitation {
  id: string;
  companyLogo: string;
  companyName: string;
  jobTitle: string;
  deadline: string;
  status: 'pending' | 'accepted' | 'declined';
}

interface JobSuggestion {
  id: string;
  companyLogo: string;
  companyName: string;
  jobTitle: string;
  experience: string;
  salary: string;
  location: string;
}

@Component({
  selector: 'app-career-opportunity-invitation',
  standalone: true,
  imports: [CommonModule, ButtonComponent, ToastNotificationComponent],
  templateUrl: './career-opportunity-invitation.html',
  styleUrls: ['./career-opportunity-invitation.scss']
})
export class CareerOpportunityInvitationComponent implements OnInit {
  userName: string = 'Nguyễn Văn A';
  invitations: CareerInvitation[] = [];
  jobSuggestions: JobSuggestion[] = [];
  hasInvitations: boolean = false;

  // Toast notification
  showToast: boolean = false;
  toastMessage: string = '';
  toastType: 'success' | 'error' | 'warning' | 'info' = 'success';

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.loadInvitations();
    this.loadJobSuggestions();
  }

  loadInvitations(): void {
    // TODO: Call API to load career invitations
    // Example: this.careerInvitationService.getInvitations().subscribe(...)
    this.invitations = [];
    this.hasInvitations = this.invitations.length > 0;
  }

  loadJobSuggestions(): void {
    // TODO: Call API to load job suggestions
    // Example: this.jobService.getSuggestions().subscribe(...)
    this.jobSuggestions = [];
  }

  acceptInvitation(invitation: CareerInvitation): void {
    // TODO: Call API to accept invitation
    // Example: this.careerInvitationService.acceptInvitation(invitation.id).subscribe(...)
    invitation.status = 'accepted';
    this.showToastMessage('success', 'Bạn đã đồng ý lời mời kết nối từ ' + invitation.companyName);
  }

  declineInvitation(invitation: CareerInvitation): void {
    // TODO: Call API to decline invitation
    // Example: this.careerInvitationService.declineInvitation(invitation.id).subscribe(...)
    invitation.status = 'declined';
    this.showToastMessage('info', 'Bạn đã từ chối lời mời kết nối từ ' + invitation.companyName);
  }

  showToastMessage(type: 'success' | 'error' | 'warning' | 'info', message: string): void {
    this.toastType = type;
    this.toastMessage = message;
    this.showToast = true;
  }

  onToastClose(): void {
    this.showToast = false;
  }

  viewAllInvitations(): void {
    // TODO: Navigate to full list page or load more invitations
    // Example: this.router.navigate(['/candidate/career-invitations/all'])
    // Or: Load more data from API
  }

  navigateToCvManagement(): void {
    this.router.navigate(['/candidate/cv-management']);
  }

  navigateToJobs(): void {
    this.router.navigate(['/candidate/job']);
  }
}

