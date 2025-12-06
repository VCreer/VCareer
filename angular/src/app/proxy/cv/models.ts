import type { EntityDto, PagedAndSortedResultRequestDto } from '@abp/ng.core';

export interface CandidateCvDto extends EntityDto<string> {
  candidateId?: string;
  templateId?: string;
  cvName?: string;
  dataJson?: string;
  blocksJson?: string;
  htmlContent?: string;
  isPublished: boolean;
  isDefault: boolean;
  isPublic: boolean;
  publishedAt?: string;
  viewCount: number;
  notes?: string;
  previewImageUrl?: string;
  template: CvTemplateDto;
}

export interface CreateCandidateCvDto {
  templateId: string;
  cvName: string;
  dataJson: string;
  blocksJson?: string;
  isPublished: boolean;
  isDefault: boolean;
  isPublic: boolean;
  notes?: string;
}

export interface CreateCvTemplateDto {
  name: string;
  description?: string;
  previewImageUrl?: string;
  layoutDefinition: string;
  styles?: string;
  supportedFields?: string;
  category?: string;
  sortOrder: number;
  isActive: boolean;
  isDefault: boolean;
  isFree: boolean;
  version?: string;
}

export interface CvTemplateDto extends EntityDto<string> {
  name?: string;
  description?: string;
  previewImageUrl?: string;
  layoutDefinition?: string;
  styles?: string;
  supportedFields?: string;
  category?: string;
  sortOrder: number;
  isActive: boolean;
  isDefault: boolean;
  isFree: boolean;
  version?: string;
}

export interface GetCandidateCvListDto extends PagedAndSortedResultRequestDto {
  templateId?: string;
  isPublished?: boolean;
  isDefault?: boolean;
  isPublic?: boolean;
  searchKeyword?: string;
}

export interface GetCvTemplateListDto extends PagedAndSortedResultRequestDto {
  category?: string;
  isActive?: boolean;
  isFree?: boolean;
  searchKeyword?: string;
}

export interface RenderCvDto {
  cvId?: string;
  htmlContent?: string;
}

export interface UpdateCandidateCvDto {
  templateId?: string;
  cvName?: string;
  dataJson?: string;
  blocksJson?: string;
  isPublished?: boolean;
  isDefault?: boolean;
  isPublic?: boolean;
  notes?: string;
}

export interface UpdateCvTemplateDto {
  name?: string;
  description?: string;
  previewImageUrl?: string;
  layoutDefinition?: string;
  styles?: string;
  supportedFields?: string;
  category?: string;
  sortOrder?: number;
  isActive?: boolean;
  isDefault?: boolean;
  isFree?: boolean;
  version?: string;
}
