import type { EntityDto, PagedAndSortedResultRequestDto } from '@abp/ng.core';
import type { IFormFile } from '../../../microsoft/asp-net-core/http/models';
import type { FileDescriptorDto } from '../../../dto/file-dto/models';

export interface GetUploadedCvListDto extends PagedAndSortedResultRequestDto {
  candidateId?: string;
  isDefault?: boolean;
  isPublic?: boolean;
  searchKeyword?: string;
}

export interface UpdateUploadedCvDto {
  cvName?: string;
  isDefault?: boolean;
  isPublic?: boolean;
  notes?: string;
}

export interface UploadCvRequestDto {
  file: IFormFile;
  cvName: string;
  isDefault: boolean;
  isPublic: boolean;
  notes?: string;
}

export interface UploadedCvDto extends EntityDto<string> {
  candidateId?: string;
  fileDescriptorId?: string;
  cvName?: string;
  isDefault: boolean;
  isPublic: boolean;
  notes?: string;
  fileDescriptor: FileDescriptorDto;
  originalFileName?: string;
  fileSize?: number;
  fileType?: string;
  storagePath?: string;
  uploadTime?: string;
}
