
export interface FileDescriptorDto {
  creatorId?: string;
  storageName?: string;
  originalName?: string;
  extension?: string;
  size: number;
  mimeType?: string;
  fileType?: string;
  containerName?: string;
  storagePath?: string;
  status: number;
  uploadTime?: string;
}
