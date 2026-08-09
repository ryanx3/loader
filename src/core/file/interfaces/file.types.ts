export interface IFileService {
  exists(path: string): Promise<boolean>;
  parseCSV(path: string): Promise<any[]>;
  createFolder(path: string): Promise<void>;
  parseCSVFromBuffer(
    buffer: Buffer,
    encoding?: "utf-8" | "utf-16le",
  ): Promise<any[]>;
  moveFile(from: string, to: string): Promise<void>;
  deleteFile(filePath: string): Promise<void>;
  readFile(path: string): Promise<Buffer>;
  writeFile(path: string, buffer: Buffer): Promise<void>;
}
