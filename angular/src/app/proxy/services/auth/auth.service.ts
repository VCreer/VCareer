import { RestService, Rest } from '@abp/ng.core';
import { Injectable } from '@angular/core';
import type { ForgotPasswordDto, GoogleLoginDto, LoginDto, RegisterDto, ResetPasswordDto } from '../../dto/auth-dto/models';
import type { TokenResponseDto } from '../../dto/jwt-dto/models';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  apiName = 'Default';
  

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
  

  register = (input: RegisterDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: '/api/app/auth/register',
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
