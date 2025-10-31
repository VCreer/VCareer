import type { EntityDto } from '@abp/ng.core';

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface CompanyLegalInfoDto extends EntityDto<number> {
  companyName?: string;
  companyCode?: string;
  verificationStatus: boolean;
  description?: string;
  headquartersAddress?: string;
  contactEmail?: string;
  contactPhone?: string;
  status: boolean;
  companySize: number;
  industryId: number;
  foundedYear: number;
  logoUrl?: string;
  legalDocumentUrl?: string;
  coverImageUrl?: string;
  websiteUrl?: string;
  cultureVideoUrl?: string;
  verifyAt?: string;
  taxCode?: string;
  businessLicenseNumber?: string;
  businessLicenseIssueDate?: string;
  businessLicenseIssuePlace?: string;
  legalRepresentative?: string;
  businessLicenseFile?: string;
  taxCertificateFile?: string;
  representativeIdCardFile?: string;
  otherSupportFile?: string;
  legalVerificationStatus?: string;
  legalReviewedBy?: number;
  legalReviewedAt?: string;
  creationTime?: string;
  lastModificationTime?: string;
}

export interface ProfileDto extends EntityDto<string> {
  name?: string;
  surname?: string;
  email?: string;
  phoneNumber?: string;
  bio?: string;
  dateOfBirth?: string;
  gender?: boolean;
  location?: string;
  address?: string;
  nationality?: string;
  maritalStatus?: string;
  userName?: string;
  emailConfirmed: boolean;
  phoneNumberConfirmed: boolean;
  creationTime?: string;
  lastModificationTime?: string;
  userType?: string;
}

export interface SubmitCompanyLegalInfoDto {
  companyName: string;
  companyCode?: string;
  description?: string;
  headquartersAddress: string;
  contactEmail: string;
  contactPhone: string;
  companySize: number;
  industryId: number;
  foundedYear: number;
  taxCode: string;
  businessLicenseNumber: string;
  businessLicenseIssueDate: string;
  businessLicenseIssuePlace: string;
  legalRepresentative: string;
  businessLicenseFile?: string;
  taxCertificateFile?: string;
  representativeIdCardFile?: string;
  otherSupportFile?: string;
}

export interface UpdateCompanyLegalInfoDto {
  companyName: string;
  companyCode?: string;
  description?: string;
  headquartersAddress: string;
  contactEmail: string;
  contactPhone: string;
  companySize: number;
  industryId: number;
  foundedYear: number;
  taxCode: string;
  businessLicenseNumber: string;
  businessLicenseIssueDate: string;
  businessLicenseIssuePlace: string;
  legalRepresentative: string;
  businessLicenseFile?: string;
  taxCertificateFile?: string;
  representativeIdCardFile?: string;
  otherSupportFile?: string;
}

export interface UpdatePersonalInfoDto {
  name: string;
  surname: string;
  email?: string;
  phoneNumber?: string;
  bio?: string;
  dateOfBirth?: string;
  gender?: boolean;
  location?: string;
  address?: string;
  nationality?: string;
  maritalStatus?: string;
}
