import { RestService, Rest } from '@abp/ng.core';
import { Injectable } from '@angular/core';
import type { CandidateRegisterDto, ForgotPasswordDto, GoogleLoginDto, LoginDto, RecruiterRegisterDto, ResetPasswordDto } from '../../dto/auth-dto/models';
import type { TokenResponseDto } from '../../dto/jwt-dto/models';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  apiName = 'Default';
  

  candidateRegister = (input: CandidateRegisterDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: '/api/app/auth/candidate-register',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  forgotPassword = (input: ForgotPasswordDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: '/api/app/auth/forgot-password',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  logOut = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: '/api/app/auth/log-out',
    },
    { apiName: this.apiName,...config });
  

  logOutAllDevice = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: '/api/app/auth/log-out-all-device',
    },
    { apiName: this.apiName,...config });
  

  login = (input: LoginDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, TokenResponseDto>({
      method: 'POST',
      url: '/api/app/auth/login',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  loginWithGoogle = (input: GoogleLoginDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, TokenResponseDto>({
      method: 'POST',
      url: '/api/app/auth/login-with-google',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  recruiterRegister = (input: RecruiterRegisterDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: '/api/app/auth/recruiter-register',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  resetPassword = (input: ResetPasswordDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: '/api/app/auth/reset-password',
      body: input,
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
