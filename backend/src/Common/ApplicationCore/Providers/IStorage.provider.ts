import { FileMetadata } from "@google-cloud/storage";

export abstract class IStorageProvider {
    abstract ReadDirectory(path: string): Promise<DirectoryStructure>;
    abstract UploadFile(path: string, content: Buffer | string): Promise<void>;
    abstract DownloadFile(path: string): Promise<{ metadata: FileMetadata; readStream: NodeJS.ReadableStream }>
    abstract Move(sourcePath: string, targetPath: string): Promise<void>;
    abstract CreateFolder(path: string, folderName: string): Promise<void>;
    abstract Delete(path: string): Promise<void>;
}
