import { ApiProperty } from '@nestjs/swagger';

export class UploadFileResponse {
  @ApiProperty({ description: 'Public URL of the uploaded file' })
  fileUrl: string;

  @ApiProperty({ description: 'Unique file name/path in storage' })
  fileName: string;

  @ApiProperty({ description: 'Success message' })
  message: string;
}

export class FileInfoResponse {
  @ApiProperty({ description: 'File name or path' })
  fileName: string;

  @ApiProperty({ description: 'File size in bytes' })
  size: number;

  @ApiProperty({ description: 'MIME type of the file' })
  contentType: string;

  @ApiProperty({ description: 'Last modified timestamp' })
  lastModified: string;
}

export class UploadFileRequest {
  @ApiProperty({ type: 'string', format: 'binary', description: 'File to upload' })
  file: Express.Multer.File;
}

export class DownloadFileRequest {
  @ApiProperty({ description: 'File name or path to download' })
  fileName: string;
}

export class FileUploadProgress {
  @ApiProperty({ description: 'Unique upload ID' })
  id: string;

  @ApiProperty({ description: 'Original file name' })
  fileName: string;

  @ApiProperty({ description: 'File URL if successful' })
  fileUrl?: string;

  @ApiProperty({ description: 'File size in bytes' })
  size: number;

  @ApiProperty({ description: 'Upload status' })
  status: 'completed' | 'failed';

  @ApiProperty({ description: 'Upload progress percentage' })
  progress: number;

  @ApiProperty({ description: 'Error message if failed' })
  error?: string;
}

export class MultipleUploadResponse {
  @ApiProperty({ type: [FileUploadProgress], description: 'Upload results for each file' })
  uploads: FileUploadProgress[];

  @ApiProperty({ description: 'Upload summary' })
  summary: {
    total: number;
    successful: number;
    failed: number;
  };

  @ApiProperty({ description: 'Overall message' })
  message: string;
} 