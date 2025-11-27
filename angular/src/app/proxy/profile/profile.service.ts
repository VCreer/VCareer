import { RestService, Rest } from '@abp/ng.core';
import { Injectable } from '@angular/core';
import type { ChangePasswordDto, ProfileDto, SelectCompanyDto, SendEmailOtpDto, UpdatePersonalInfoDto, VerifyEmailNumberDto, VerifyPhoneNumberDto } from '../dto/profile/models';
import type { IActionResult } from '../microsoft/asp-net-core/mvc/models';

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  apiName = 'Default';
  

  changePassword = (input: ChangePasswordDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, IActionResult>({
      method: 'PUT',
      url: '/api/profile/change-password',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  deleteAccount = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, IActionResult>({
      method: 'DELETE',
      url: '/api/profile/account',
    },
    { apiName: this.apiName,...config });
  

  getCurrentUserProfile = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, ProfileDto>({
      method: 'GET',
      url: '/api/profile',
    },
    { apiName: this.apiName,...config });
  

  selectCompany = (input: SelectCompanyDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, IActionResult>({
      method: 'POST',
      url: '/api/profile/select-company',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  sendEmailOtp = (input: SendEmailOtpDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, IActionResult>({
      method: 'POST',
      url: '/api/profile/send-email-otp',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  updatePersonalInfo = (input: UpdatePersonalInfoDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, IActionResult>({
      method: 'PUT',
      url: '/api/profile/personal-info',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  verifyEmailNumber = (input: VerifyEmailNumberDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, IActionResult>({
      method: 'POST',
      url: '/api/profile/verify-email',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  verifyPhoneNumber = (input: VerifyPhoneNumberDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, IActionResult>({
      method: 'POST',
      url: '/api/profile/verify-phone',
      body: input,
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
