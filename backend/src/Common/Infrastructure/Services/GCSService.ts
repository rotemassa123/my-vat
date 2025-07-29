import { Injectable } from "@nestjs/common";
import { IGCSService } from "src/Common/ApplicationCore/Services/IGCSService";
import { Storage } from "@google-cloud/storage";
import { ConfigService } from "@nestjs/config";
import { Readable } from 'stream';

@Injectable()
export class GCSService implements IGCSService {
  private storage: Storage;
  private bucketName: string;

  constructor(private configService: ConfigService) {
    const nodeEnv = this.configService.get<string>('NODE_ENV');
    const projectId = this.configService.get<string>('GOOGLE_CLOUD_PROJECT_ID');
    const keyFilename = this.configService.get<string>('GOOGLE_APPLICATION_CREDENTIALS');
    const gcsEndpoint = this.configService.get<string>('GCS_ENDPOINT');
    
    // Configure for local development or production
    if (nodeEnv === 'development' && gcsEndpoint) {
      // Local development with fake GCS server
      this.storage = new Storage({
        apiEndpoint: gcsEndpoint,
        projectId: projectId || 'test-project',
      });
      this.bucketName = this.configService.get<string>('GCS_DEFAULT_BUCKET') || 'bucket';
    } else {
      // Production or cloud development
      this.storage = new Storage({
        projectId,
        keyFilename, // Path to service account key file
      });
      this.bucketName = this.configService.get<string>('GCS_DEFAULT_BUCKET') || 'my-vat-invoices';
    }
  }

  async uploadFile(fileName: string, fileBuffer: Buffer): Promise<string> {
    const bucket = this.storage.bucket(this.bucketName);
    const file = bucket.file(fileName);

    await file.save(fileBuffer, {
      metadata: {
        contentType: 'image/jpeg', // You might want to detect this dynamically
      },
    });

    // Generate signed URL instead of making file public
    return await this.getFileUrl(fileName);
  }

  async uploadFileStream(fileName: string, stream: Readable, contentType?: string): Promise<string> {
    const bucket = this.storage.bucket(this.bucketName);
    const file = bucket.file(fileName);

    return new Promise((resolve, reject) => {
      const writeStream = file.createWriteStream({
        metadata: {
          contentType: contentType || 'application/octet-stream',
        },
        resumable: true, // Enable resumable uploads for large files
        validation: 'crc32c', // Enable integrity checking
      });

      writeStream.on('error', (error) => {
        // Check if error is related to uniform bucket-level access
        if (error.message?.includes('uniform bucket-level access')) {
          reject(new Error('Bucket has uniform bucket-level access enabled. Cannot set object-level permissions. This is normal and expected.'));
        } else {
          reject(error);
        }
      });

      writeStream.on('finish', async () => {
        try {
          // File uploaded successfully - generate signed URL
          const fileUrl = await this.getFileUrl(fileName);
          resolve(fileUrl);
        } catch (error) {
          reject(error);
        }
      });

      // Pipe the input stream to GCS
      stream.pipe(writeStream);
    });
  }

  async downloadFileStream(fileName: string): Promise<{ stream: Readable; metadata: Record<string, unknown> }> {
    const bucket = this.storage.bucket(this.bucketName);
    const file = bucket.file(fileName);

    // Check if file exists
    const [exists] = await file.exists();
    if (!exists) {
      throw new Error(`File ${fileName} not found`);
    }

    // Get file metadata
    const [metadata] = await file.getMetadata();

    // Create read stream
    const stream = file.createReadStream();

    return { stream, metadata };
  }

  async deleteFile(fileName: string): Promise<void> {
    const bucket = this.storage.bucket(this.bucketName);
    const file = bucket.file(fileName);
    await file.delete();
  }

  async getFileUrl(fileName: string): Promise<string> {
    // Check if we're in development mode with local GCS emulator
    const nodeEnv = this.configService.get<string>('NODE_ENV');
    const gcsEndpoint = this.configService.get<string>('GCS_ENDPOINT');
    
    if (nodeEnv === 'development' && gcsEndpoint) {
      // For local development, return direct URL
      return `${gcsEndpoint}/${this.bucketName}/${fileName}`;
    }

    // For production, generate a signed URL valid for 7 days
    try {
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(fileName);
      
      // Generate signed URL that expires in 7 days
      const [signedUrl] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days from now
      });
      
      return signedUrl;
    } catch (error) {
      // Fallback to direct URL if signed URL generation fails
      console.warn('Failed to generate signed URL, falling back to direct URL:', error.message);
      return `https://storage.googleapis.com/${this.bucketName}/${fileName}`;
    }
  }
} 