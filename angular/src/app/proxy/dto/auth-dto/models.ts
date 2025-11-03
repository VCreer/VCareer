
export interface CandidateRegisterDto {
  email?: string;
  password?: string;
}

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

export interface RecruiterRegisterDto {
  email: string;
  password: string;
  name: string;
  phoneNumber: string;
  city: string;
  district?: string;
  isCompany: boolean;
  companyName?: string;
  businesshouseholdname?: string;
}

export interface ResetPasswordDto {
  email?: string;
  token?: string;
  newPassword?: string;
}
