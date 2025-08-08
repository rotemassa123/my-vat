import { Injectable, NotFoundException } from "@nestjs/common";
import { v2 as cloudinary } from "cloudinary";
import { ConfigService } from "@nestjs/config";
import { IImageStorageProvider } from "../../ApplicationCore/Providers/IImageStorageProvider";

@Injectable()
export class CloudinaryStorageProvider implements IImageStorageProvider {
  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get("CLOUDINARY_CLOUD_NAME"),
      api_key: this.configService.get("CLOUDINARY_API_KEY"),
      api_secret: this.configService.get("CLOUDINARY_API_SECRET"),
    });
  }

  async UploadFile(path: string, content: Buffer | string): Promise<void> {
    await cloudinary.uploader.upload(
      `data:image/png;base64,${content.toString("base64")}`,
      {
        public_id: path,
        resource_type: "image",
      }
    );
  }

  async Delete(path: string): Promise<void> {
    const publicId = this.extractPublicId(path);
    if (!publicId) {
      throw new NotFoundException(`Could not parse public_id from ${path}`);
    }
    await cloudinary.uploader.destroy(path);
  }

  getPublicUrl(path: string): string {
    return cloudinary.url(path, {
      secure: true,
    });
  }

  private extractPublicId(fullUrl: string): string | null {
    const regex = /upload\/(?:v\d+\/)?([^?#]+)/;
    const match = fullUrl.match(regex);
    return match ? decodeURI(match[1]) : null;
  }
}
