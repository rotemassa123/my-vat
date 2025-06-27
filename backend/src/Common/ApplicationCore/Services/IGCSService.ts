export abstract class IGCSService {
  abstract uploadFile(fileName: string, fileBuffer: Buffer): Promise<string>;
  abstract deleteFile(fileName: string): Promise<void>;
  abstract getFileUrl(fileName: string): string;
} 