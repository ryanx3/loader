import { PassThrough, Readable, Writable } from "stream";

export interface IFtpRepository {
  streamToSftp(options: {
    sourcePath: string;
    destinationFileName: string;
    remoteBasePath: string;
  }): Promise<void>;
  downloadFromFtps(destination: Writable, remotePath: string): Promise<void>;
  uploadToSftp(source: Readable, remotePath: string): Promise<void>;
  convertGsmToMp3(input: Readable, output: PassThrough): void;
}
