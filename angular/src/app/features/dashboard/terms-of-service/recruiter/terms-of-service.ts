import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../../../../shared/components';

@Component({
  selector: 'app-terms-of-service-recruiter',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './terms-of-service.html',
  styleUrls: ['./terms-of-service.scss'],
})
export class TermsOfServiceRecruiterComponent {}

