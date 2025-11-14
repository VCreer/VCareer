
export interface CandidateRegisterDto {
  name: string;
  email: string;
  password: string;
}

export interface CreateEmployeeDto {
  email: string;
  password: string;
  employeeRoles: string[];
}

export interface CurrentUserInfoDto {
  userId?: string;
  email?: string;
  roles: string[];
  fullName?: string;
}

export interface EmployeeLoginDto {
  email?: string;
  password?: string;
}

export interface ForgotPasswordDto {
  email?: string;
}

export interface GoogleLoginDto {
  idToken: string;
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
  provinceCode: number;
  districtCode: number;
  companyName: string;
  taxCode: string;
}

export interface ResetPasswordDto {
  email?: string;
  token?: string;
  newPassword?: string;
}
