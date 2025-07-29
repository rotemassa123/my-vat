import {
  Controller,
  Post,
  Get,
  Param,
  Req,
  Res,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiConsumes, ApiBody, ApiParam, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { Readable } from 'stream';
import { IGCSService } from 'src/Common/ApplicationCore/Services/IGCSService';
import { CurrentAccountId } from 'src/Common/decorators/current-account-id.decorator';
import { UploadFileResponse, FileInfoResponse, MultipleUploadResponse } from '../Requests/files.requests';

@ApiTags('files')
@Controller('files')
export class FilesController {
  constructor(private readonly gcsService: IGCSService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 1024 * 1024 * 1024, // 1GB limit
      },
    }),
  )
  @ApiOperation({ 
    summary: 'Upload file via multipart form data',
    description: 'Upload a file up to 1GB using multipart/form-data. File will be stored in user-specific folder.'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
      required: ['file'],
    },
  })
  @ApiResponse({ 
    status: 201, 
    description: 'File uploaded successfully',
    type: UploadFileResponse 
  })
  @ApiResponse({ status: 400, description: 'Bad request - no file provided or upload failed' })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @CurrentAccountId() userId: string,
  ): Promise<UploadFileResponse> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Create a readable stream from the buffer for memory efficiency
    const stream = Readable.from(file.buffer);

    // Generate unique file path with account/entity structure
    const uniqueFileName = `${userId}/uploads/default/${Date.now()}-${file.originalname}`;

    try {
      const fileUrl = await this.gcsService.uploadFileStream(
        uniqueFileName,
        stream,
        file.mimetype,
      );

      return {
        fileUrl,
        fileName: uniqueFileName,
        message: 'File uploaded successfully',
      };
    } catch (error) {
      throw new BadRequestException(`Failed to upload file: ${error.message}`);
    }
  }

  @Post('upload-multiple')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      limits: {
        fileSize: 1024 * 1024 * 1024, // 1GB per file
        files: 10, // Max 10 files
      },
    }),
  )
  @ApiOperation({
    summary: 'Upload multiple files simultaneously',
    description: 'Upload multiple files up to 1GB each, with progress tracking. Files will be stored in user-specific folder.'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: { 
          type: 'array', 
          items: { type: 'string', format: 'binary' },
          maxItems: 10
        },
        entityId: { type: 'string', description: 'Entity ID for file organization' },
      },
      required: ['files'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Files uploaded successfully',
    type: MultipleUploadResponse
  })
  @ApiResponse({ status: 400, description: 'Bad request - no files provided or upload failed' })
  async uploadMultipleFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentAccountId() userId: string,
    @Req() req: Request,
  ): Promise<MultipleUploadResponse> {
    if (!files || files.length === 0) { 
      throw new BadRequestException('No files provided'); 
    }
    
    const entityId = req.body.entityId;
    const uploadPromises = files.map(async (file, index) => {
      const stream = Readable.from(file.buffer);
      const effectiveEntityId = entityId || 'default';
      const uniqueFileName = `${userId}/uploads/${effectiveEntityId}/${Date.now()}-${index}-${file.originalname}`;
      
      try {
        const fileUrl = await this.gcsService.uploadFileStream(uniqueFileName, stream, file.mimetype);
        return {
          id: `upload-${Date.now()}-${index}`,
          fileName: file.originalname,
          fileUrl,
          size: file.size,
          status: 'completed' as const,
          progress: 100,
        };
      } catch (error) {
        return {
          id: `upload-${Date.now()}-${index}`,
          fileName: file.originalname,
          fileUrl: '',
          size: file.size,
          status: 'failed' as const,
          progress: 0,
          error: error.message,
        };
      }
    });

    const results = await Promise.all(uploadPromises);
    const successful = results.filter(r => r.status === 'completed').length;
    const failed = results.filter(r => r.status === 'failed').length;

    return {
      uploads: results,
      summary: {
        total: files.length,
        successful,
        failed,
      },
      message: `Uploaded ${successful} files successfully${failed > 0 ? `, ${failed} failed` : ''}`,
    };
  }

  @Post('upload-stream')
  @ApiOperation({ 
    summary: 'Upload file via streaming',
    description: 'Upload a file up to 1GB using raw stream. Requires x-file-name header. More memory efficient for large files.'
  })
  @ApiConsumes('application/octet-stream')
  @ApiResponse({ 
    status: 201, 
    description: 'File uploaded successfully',
    type: UploadFileResponse 
  })
  @ApiResponse({ status: 400, description: 'Bad request - missing file name or upload failed' })
  async uploadFileStream(
    @Req() req: Request,
    @CurrentAccountId() userId: string,
  ): Promise<UploadFileResponse> {
    const fileName = req.headers['x-file-name'] as string;
    const contentType = req.headers['content-type'] || 'application/octet-stream';

    if (!fileName) {
      throw new BadRequestException('File name is required in x-file-name header');
    }

    // Generate unique file path with account/entity structure
    const uniqueFileName = `${userId}/uploads/default/${Date.now()}-${fileName}`;

    try {
      const fileUrl = await this.gcsService.uploadFileStream(
        uniqueFileName,
        req as Readable,
        contentType,
      );

      return {
        fileUrl,
        fileName: uniqueFileName,
        message: 'File uploaded successfully via stream',
      };
    } catch (error) {
      throw new BadRequestException(`Failed to upload file: ${error.message}`);
    }
  }

  @Get('download/:fileName(*)')
  @ApiOperation({ 
    summary: 'Download file',
    description: 'Download a file by name. Supports user-specific paths and direct file names.'
  })
  @ApiParam({ name: 'fileName', description: 'File name or path to download' })
  @ApiResponse({ status: 200, description: 'File stream' })
  @ApiResponse({ status: 404, description: 'File not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async downloadFile(
    @Param('fileName') fileName: string,
    @CurrentAccountId() userId: string,
    @Res() res: Response,
  ): Promise<void> {
    if (!fileName) {
      throw new BadRequestException('File name is required');
    }

    // If fileName doesn't include the full path structure, build it with new format
    const fullFileName = fileName.includes('/uploads/') ? fileName : `${userId}/uploads/default/${fileName}`;

    try {
      const { stream, metadata } = await this.gcsService.downloadFileStream(fullFileName);

      // Set appropriate headers
      res.setHeader('Content-Type', (metadata.contentType as string) || 'application/octet-stream');
      res.setHeader('Content-Length', (metadata.size as number) || 0);
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Accept-Ranges', 'bytes');

      // Stream the file directly to the response
      stream.pipe(res);

      // Handle stream errors
      stream.on('error', (error) => {
        console.error('Download stream error:', error);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to download file' });
        }
      });

    } catch (error) {
      if (error.message.includes('not found')) {
        throw new NotFoundException('File not found');
      }
      throw new BadRequestException(`Failed to download file: ${error.message}`);
    }
  }

  @Get('info/:fileName(*)')
  @ApiOperation({ 
    summary: 'Get file information',
    description: 'Get metadata about a file without downloading it.'
  })
  @ApiParam({ name: 'fileName', description: 'File name or path to get info for' })
  @ApiResponse({ 
    status: 200, 
    description: 'File information',
    type: FileInfoResponse 
  })
  @ApiResponse({ status: 404, description: 'File not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async getFileInfo(
    @Param('fileName') fileName: string,
    @CurrentAccountId() userId: string,
  ): Promise<FileInfoResponse> {
    if (!fileName) {
      throw new BadRequestException('File name is required');
    }

    // If fileName doesn't include the full path structure, build it with new format
    const fullFileName = fileName.includes('/uploads/') ? fileName : `${userId}/uploads/default/${fileName}`;

    try {
      const { metadata } = await this.gcsService.downloadFileStream(fullFileName);

      return {
        fileName,
        size: (metadata.size as number) || 0,
        contentType: (metadata.contentType as string) || 'application/octet-stream',
        lastModified: (metadata.updated as string) || (metadata.timeCreated as string),
      };
    } catch (error) {
      if (error.message.includes('not found')) {
        throw new NotFoundException('File not found');
      }
      throw new BadRequestException(`Failed to get file info: ${error.message}`);
    }
  }
} 