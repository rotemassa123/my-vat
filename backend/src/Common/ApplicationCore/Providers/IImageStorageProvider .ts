export abstract class IImageStorageProvider {
  abstract UploadFile(path: string, content: Buffer | string): Promise<void>;
  abstract Delete(path: string): Promise<void>;
  abstract getPublicUrl(path: string): string;
}
