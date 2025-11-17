
export interface IFormFile {
  contentType?: string;
  contentDisposition?: string;
  headers: Record<string, String[]>;
  length: number;
  name?: string;
  fileName?: string;
}
