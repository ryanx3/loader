import { Readable } from "stream";
import fs from "fs";
import path from "path";
import csv from "csv-parser";
import iconv from "iconv-lite";
import { IFileService } from "./interfaces/file.types";

export class FileService implements IFileService {
  async readFile(path: string): Promise<Buffer> {
    return fs.promises.readFile(path);
  }

  async writeFile(path: string, buffer: Buffer): Promise<void> {
    await fs.promises.writeFile(path, buffer);
  }

  private detectEncodingFromBuffer(buffer: Buffer): "utf-8" | "utf-16le" {
    if (buffer[0] === 0xff && buffer[1] === 0xfe) return "utf-16le";
    return "utf-8";
  }

  private detectDelimiterFromContent(content: string, sampleLines = 5): string {
    const lines = content.split(/\r?\n/).slice(0, sampleLines);
    const delimiters = [",", ";", "\t"];
    let bestDelimiter = delimiters[0];
    let maxCount = 0;

    for (const delimiter of delimiters) {
      const count = lines
        .map((line) => line.split(delimiter).length - 1)
        .reduce((a, b) => a + b, 0);

      if (count > maxCount) {
        maxCount = count;
        bestDelimiter = delimiter;
      }
    }

    return bestDelimiter;
  }

  async exists(path: string): Promise<boolean> {
    return fs.existsSync(path);
  }

  async parseCSV(path: string): Promise<any[]> {
    const buffer = fs.readFileSync(path);
    const detectedEncoding = this.detectEncodingFromBuffer(buffer);
    const detectedDelimiter = this.detectDelimiterFromContent(
      iconv.decode(buffer, detectedEncoding),
    );
    return new Promise((resolve, reject) => {
      const results: any[] = [];

      fs.createReadStream(path)
        .pipe(iconv.decodeStream(detectedEncoding))
        .pipe(csv({ separator: detectedDelimiter }))
        .on("data", (data) => results.push(data))
        .on("end", () => resolve(results))
        .on("error", reject);
    });
  }

  async createFolder(folderPath: string): Promise<void> {
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
  }

  async moveFile(from: string, to: string): Promise<void> {
    const destFolder = path.dirname(to);
    await this.createFolder(destFolder);
    fs.copyFileSync(from, to);
    fs.unlinkSync(from);
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      const backupFolder = path.join(path.dirname(filePath), "_backup");

      if (!fs.existsSync(backupFolder)) {
        fs.mkdirSync(backupFolder, { recursive: true });
      }
      const backupPath = path.join(
        backupFolder,
        `${Date.now()}_${path.basename(filePath)}`,
      );
      fs.copyFileSync(filePath, backupPath);
      fs.unlinkSync(filePath);
    } catch (err) {
      console.error("[deleteFile] ERRO:", err);
      throw err;
    }
  }

  async parseCSVFromBuffer(buffer: Buffer): Promise<any[]> {
    const content = buffer.toString("utf-8");
    const delimiter = this.detectDelimiterFromContent(content);

    return new Promise((resolve, reject) => {
      const results: any[] = [];

      Readable.from([content])
        .pipe(csv({ separator: delimiter }))
        .on("data", (data: any) => results.push(data))
        .on("end", () => resolve(results))
        .on("error", reject);
    });
  }
}
