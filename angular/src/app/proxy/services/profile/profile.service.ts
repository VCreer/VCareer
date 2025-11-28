import { RestService, Rest } from '@abp/ng.core';
import { Injectable } from '@angular/core';
import type { ChangePasswordDto, ProfileDto, SelectCompanyDto, SendEmailOtpDto, UpdatePersonalInfoDto, VerifyEmailNumberDto, VerifyPhoneNumberDto } from '../../dto/profile/models';

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  apiName = 'Default';
  

  changePassword = (input: ChangePasswordDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: '/api/app/profile/change-password',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  deleteAccount = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'DELETE',
      url: '/api/app/profile/account',
    },
    { apiName: this.apiName,...config });
  

  getCurrentUserProfile = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, ProfileDto>({
      method: 'GET',
      url: '/api/app/profile/current-user-profile',
    },
    { apiName: this.apiName,...config });
  

  selectCompany = (input: SelectCompanyDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: '/api/app/profile/select-company',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  sendEmailOtp = (input: SendEmailOtpDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: '/api/app/profile/send-email-otp',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  updatePersonalInfo = (input: UpdatePersonalInfoDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'PUT',
      url: '/api/app/profile/personal-info',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  verifyEmailNumber = (input: VerifyEmailNumberDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: '/api/app/profile/verify-email-number',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  verifyPhoneNumber = (input: VerifyPhoneNumberDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: '/api/app/profile/verify-phone-number',
      body: input,
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
