import * as ftp from "basic-ftp";
import SftpClient from "ssh2-sftp-client";
import { PassThrough, Readable, Writable } from "stream";
import { IFtpRepository } from "./interfaces/ftp.types";
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";

ffmpeg.setFfmpegPath(ffmpegStatic!);

export interface FtpsConfig {
  host: string;
  port?: number;
  user: string;
  password: string;
  secure?: boolean | "implicit";
  secureOptions?: Record<string, unknown>;
}

export interface SftpConfig {
  host: string;
  port?: number;
  username: string;
  privateKey?: Buffer;
  password?: string;
}

export class FtpRepository implements IFtpRepository {
  constructor(
    private readonly ftpsConfig: FtpsConfig,
    private readonly sftpConfig: SftpConfig,
  ) {}

  async streamToSftp({
    sourcePath,
    destinationFileName,
    remoteBasePath,
  }: {
    sourcePath: string;
    destinationFileName: string;
    remoteBasePath: string;
  }): Promise<void> {
    const remotePath = `${remoteBasePath}/${destinationFileName}`;
    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const downloadStream = new PassThrough();
        const convertedStream = new PassThrough();

        this.convertGsmToMp3(downloadStream, convertedStream);

        await Promise.all([
          this.uploadToSftp(convertedStream, remotePath),
          this.downloadFromFtps(downloadStream, sourcePath),
        ]);

        return;
      } catch (err) {
        if (attempt === maxRetries) throw err;
        await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
      }
    }
  }

  async downloadFromFtps(
    destination: Writable,
    remotePath: string,
  ): Promise<void> {
    const client = new ftp.Client();

    try {
      await client.access({
        host: this.ftpsConfig.host,
        port: this.ftpsConfig.port ?? 990,
        user: this.ftpsConfig.user,
        password: this.ftpsConfig.password,
        secure: this.ftpsConfig.secure ?? "implicit",
        secureOptions: this.ftpsConfig.secureOptions,
      });

      await client.downloadTo(destination, remotePath);
    } finally {
      client.close();
    }
  }

  async uploadToSftp(source: Readable, remotePath: string): Promise<void> {
    const client = new SftpClient();

    try {
      await client.connect({
        host: this.sftpConfig.host,
        port: this.sftpConfig.port ?? 22,
        username: this.sftpConfig.username,
        privateKey: this.sftpConfig.privateKey,
        password: this.sftpConfig.password,
      });

      const remoteDir = remotePath.substring(0, remotePath.lastIndexOf("/"));
      await client.mkdir(remoteDir, true);

      await client.put(source, remotePath);
    } finally {
      await client.end();
    }
  }

  convertGsmToMp3(input: Readable, output: PassThrough): void {
    ffmpeg(input)
      .inputFormat("gsm")
      .inputOptions("-ar 8000")
      .audioCodec("libmp3lame")
      .audioBitrate(128)
      .format("mp3")
      .on("error", (err: any) => output.destroy(err))
      .pipe(output);
  }
}
