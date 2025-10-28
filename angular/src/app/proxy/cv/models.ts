import type { EntityDto, PagedAndSortedResultRequestDto } from '@abp/ng.core';

export interface CVDto extends EntityDto<string> {
  candidateId?: string;
  cvName?: string;
  cvType?: string;
  status?: string;
  isDefault: boolean;
  isPublic: boolean;
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  gender?: boolean;
  address?: string;
  careerObjective?: string;
  workExperience?: string;
  education?: string;
  skills?: string;
  projects?: string;
  certificates?: string;
  languages?: string;
  interests?: string;
  originalFileName?: string;
  fileUrl?: string;
  fileSize?: number;
  fileType?: string;
  description?: string;
  creationTime?: string;
  lastModificationTime?: string;
}

export interface CreateCVOnlineDto {
  cvName: string;
  careerObjective?: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  gender?: boolean;
  address?: string;
  workExperience?: string;
  education?: string;
  skills?: string;
  projects?: string;
  certificates?: string;
  languages?: string;
  interests?: string;
  isPublic: boolean;
}

export interface GetCVListDto extends PagedAndSortedResultRequestDto {
  cvType?: string;
  status?: string;
  isPublic?: boolean;
  isDefault?: boolean;
}

export interface SetDefaultCVDto {
  cvId: string;
}

export interface SetPublicCVDto {
  cvId: string;
  isPublic: boolean;
}

export interface UpdateCVDto {
  cvName?: string;
  careerObjective?: string;
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  gender?: boolean;
  address?: string;
  workExperience?: string;
  education?: string;
  skills?: string;
  projects?: string;
  certificates?: string;
  languages?: string;
  interests?: string;
  isPublic?: boolean;
  status?: string;
}

export interface UploadCVDto {
  cvName: string;
  fileUrl: string;
  originalFileName: string;
  fileSize: number;
  fileType: string;
  description?: string;
  isPublic: boolean;
}
