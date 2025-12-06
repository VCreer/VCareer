import type { EntityDto, PagedAndSortedResultRequestDto } from '@abp/ng.core';
import type { IFormFile } from '../../microsoft/asp-net-core/http/models';

export interface CandidateSearchResultDto extends EntityDto<string> {
  name?: string;
  candidateUserId?: string;
  defaultCvId?: string;
  email?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  jobTitle?: string;
  skills?: string;
  experience?: number;
  salary?: number;
  workLocation?: string;
  location?: string;
  gender?: boolean;
  dateOfBirth?: string;
  profileVisibility: boolean;
  status: boolean;
  viewCount: number;
  contactOpenCount: number;
  isSeekingJob: boolean;
  lastUpdatedTime?: string;
  experienceDetails: ExperienceDetailDto[];
  education?: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface CompanyInfoForJobDetailDto extends EntityDto<number> {
  companyName?: string;
  logoUrl?: string;
  companySize?: number;
  headquartersAddress?: string;
  industries: string[];
}

export interface CompanyLegalInfoDto extends EntityDto<number> {
  companyName?: string;
  companyCode: string;
  verificationStatus?: boolean;
  description?: string;
  headquartersAddress?: string;
  contactEmail?: string;
  contactPhone?: string;
  status?: boolean;
  companySize?: number;
  industryId?: number;
  foundedYear?: number;
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

export interface CompanySearchInputDto extends PagedAndSortedResultRequestDto {
  keyword?: string;
  status?: boolean;
}

export interface CompanyVerificationFilterDto extends PagedAndSortedResultRequestDto {
  keyword?: string;
  createdFrom?: string;
  createdTo?: string;
}

export interface CompanyVerificationViewDto extends EntityDto<number> {
  companyName?: string;
  companyCode?: string;
  contactEmail?: string;
  contactPhone?: string;
  headquartersAddress?: string;
  description?: string;
  companySize?: number;
  foundedYear?: number;
  websiteUrl?: string;
  taxCode?: string;
  businessLicenseNumber?: string;
  businessLicenseIssueDate?: string;
  businessLicenseIssuePlace?: string;
  legalRepresentative?: string;
  businessLicenseFile?: string;
  taxCertificateFile?: string;
  representativeIdCardFile?: string;
  otherSupportFile?: string;
  legalDocumentUrl?: string;
  verificationStatus?: boolean;
  legalVerificationStatus?: string;
  legalReviewedBy?: number;
  legalReviewedAt?: string;
  rejectionNotes?: string;
  creationTime?: string;
  recruiterName?: string;
  recruiterEmail?: string;
}

export interface ExperienceDetailDto {
  company?: string;
  position?: string;
  duration?: string;
  startDate?: string;
  endDate?: string;
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
  companyId?: number;
  jobTitle?: string;
  skills?: string;
  experience?: number;
  salary?: number;
  workLocation?: string;
  profileVisibility?: boolean;
}

export interface RejectCompanyDto {
  rejectionNotes: string;
}

export interface SearchCandidateInputDto extends PagedAndSortedResultRequestDto {
  keyword?: string;
  jobTitle?: string;
  skills?: string;
  minExperience?: number;
  maxExperience?: number;
  minSalary?: number;
  maxSalary?: number;
  workLocation?: string;
  searchInJobTitle: boolean;
  searchInActivity: boolean;
  searchInEducation: boolean;
  searchInExperience: boolean;
  searchInSkills: boolean;
  cvClassification?: string;
  displayPriority?: string;
}

export interface SelectCompanyDto {
  companyId: number;
}

export interface SendConnectionRequestDto {
  candidateProfileId?: string;
  companyName?: string;
  jobTitle?: string;
  message?: string;
  emails: string[];
}

export interface SendEmailOtpDto {
  email: string;
}

export interface SubmitCompanyLegalInfoDto {
  companyName: string;
  companyCode?: string;
  description?: string;
  headquartersAddress: string;
  contactEmail: string;
  contactPhone: string;
  companySize?: number;
  industryId?: number;
  foundedYear?: number;
  taxCode: string;
  businessLicenseNumber: string;
  businessLicenseIssueDate?: string;
  businessLicenseIssuePlace: string;
  legalRepresentative: string;
  businessLicenseFile?: string;
  taxCertificateFile?: string;
  representativeIdCardFile?: string;
  otherSupportFile?: string;
}

export interface UpdateCompanyLegalInfoDto {
  companyName?: string;
  companyCode?: string;
  description?: string;
  headquartersAddress?: string;
  contactEmail?: string;
  contactPhone?: string;
  companySize?: number;
  industryId?: number;
  foundedYear?: number;
  websiteUrl?: string;
  taxCode?: string;
  businessLicenseNumber?: string;
  businessLicenseIssueDate?: string;
  businessLicenseIssuePlace?: string;
  legalRepresentative?: string;
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
  jobTitle?: string;
  skills?: string;
  experience?: number;
  salary?: number;
  workLocation?: string;
}

export interface UploadLegalDocumentInputDto {
  file: IFormFile;
}

export interface VerifyEmailNumberDto {
  email: string;
  otpCode?: string;
}

export interface VerifyPhoneNumberDto {
  phoneNumber: string;
  otpCode?: string;
}
