import { Injectable } from "@nestjs/common";
import { IGCSService } from "src/Common/ApplicationCore/Services/IGCSService";
import { Storage } from "@google-cloud/storage";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class GCSService implements IGCSService {
  private storage: Storage;
  private bucketName: string;

  constructor(private configService: ConfigService) {
    this.storage = new Storage();
    this.bucketName = this.configService.get<string>('GCS_BUCKET_NAME') || 'default-bucket';
  }

  async uploadFile(fileName: string, fileBuffer: Buffer): Promise<string> {
    const bucket = this.storage.bucket(this.bucketName);
    const file = bucket.file(fileName);

    await file.save(fileBuffer, {
      metadata: {
        contentType: 'image/jpeg', // You might want to detect this dynamically
      },
    });

    // Make the file public (optional)
    await file.makePublic();

    return this.getFileUrl(fileName);
  }

  async deleteFile(fileName: string): Promise<void> {
    const bucket = this.storage.bucket(this.bucketName);
    const file = bucket.file(fileName);
    await file.delete();
  }

  getFileUrl(fileName: string): string {
    return `https://storage.googleapis.com/${this.bucketName}/${fileName}`;
  }
} 