import { Readable } from 'stream';

export abstract class IGCSService {
  abstract uploadFile(fileName: string, fileBuffer: Buffer): Promise<string>;
  abstract uploadFileStream(fileName: string, stream: Readable, contentType?: string): Promise<string>;
  abstract downloadFileStream(fileName: string): Promise<{ stream: Readable; metadata: Record<string, unknown> }>;
  abstract deleteFile(fileName: string): Promise<void>;
  abstract getFileUrl(fileName: string): Promise<string>;
} 