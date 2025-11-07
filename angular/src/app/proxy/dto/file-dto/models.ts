import type { IFormFile } from '../../microsoft/asp-net-core/http/models';

export interface FileDescriptorDto {
  id?: string;
  creatorId?: string;
  storageName?: string;
  originalName?: string;
  extension?: string;
  size: number;
  mimeType?: string;
  containerName?: string;
  storagePath?: string;
  status: number;
  uploadTime?: string;
}

export interface FileChunkInput {
  uploadId?: string;
  chunkIndex: number;
  totalChunks: number;
  chunk: IFormFile;
  originalFileName?: string;
  userId?: string;
}

export interface FileChunkResult {
  isCompleted: boolean;
  message?: string;
  storageName?: string;
}

export interface UploadFileDto {
  file: IFormFile;
  containerType?: string;
  userId?: string;
}
