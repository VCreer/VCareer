
export interface ForgotPasswordDto {
  email?: string;
}

export interface GoogleLoginDto {
  idToken?: string;
}

export interface LoginDto {
  email?: string;
  password?: string;
}

export interface RegisterDto {
  email?: string;
  password?: string;
}

export interface ResetPasswordDto {
  email?: string;
  token?: string;
  newPassword?: string;
}
