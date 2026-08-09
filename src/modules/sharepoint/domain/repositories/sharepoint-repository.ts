import { Drive } from "../../domain/entities/drive";
import { Folder } from "../../domain/entities/folder";
import { Site } from "../../domain/entities/site";

export interface ISharepointRepository {
  getSites(): Promise<Site[]>;
  getDrives(siteId: string): Promise<Drive[]>;
  getFolders(driveId: string, folderPath?: string): Promise<Folder[]>;
  downloadFile(driveId: string, filePath: string): Promise<Buffer>;
  uploadFile(params: {
    driveId: string;
    filePath: string;
    fileBuffer: Buffer;
  }): Promise<void>;
}
