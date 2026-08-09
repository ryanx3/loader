import pLimit from "p-limit";
import {
  IPlenitudeRepository,
  RecordingData,
  RecordingRow,
} from "../../domain/repositories/plenitude-repository";
import { IFtpRepository } from "../../../../core/ftp/interfaces/ftp.types";
import { ILogger } from "../../../../core/logger/interfaces/logger.types";

export class PlenitudeRecordingsUseCase {
  constructor(
    private readonly plenitudeRepository: IPlenitudeRepository,
    private readonly ftpRepository: IFtpRepository,
    private readonly logger: ILogger,
  ) {}

  async execute(options: {
    initialDate: string;
    endDate: string;
    limit?: number;
  }) {
    let recordings = await this.getRecordings(options);

    if (options.limit) {
      recordings = recordings.slice(0, options.limit);
    }

    this.logger.info(
      { total: recordings.length, ...options },
      "Iniciando processamento de gravações",
    );

    const recordingDataMap = await this.getRecordingDataMap(recordings);

    const limit = pLimit(1);
    await Promise.all(
      recordings.map((r) =>
        limit(() => this.processRecording(r, recordingDataMap)),
      ),
    );

    this.logger.info(
      { total: recordings.length, ...options },
      "Processamento concluído",
    );
  }

  private async getRecordings(options: {
    initialDate: string;
    endDate: string;
  }): Promise<RecordingRow[]> {
    return this.plenitudeRepository.getRecordingsByDay({
      initialDate: options.initialDate,
      endDate: options.endDate,
      percentOfResults: 50,
    });
  }

  private async getRecordingDataMap(
    rows: RecordingRow[],
  ): Promise<Map<string, RecordingData>> {
    const recKeys = rows.map((r) => r.recording_key);
    const files = await this.plenitudeRepository.findByRecKeys(recKeys);
    return new Map(files.map((f) => [f.rec_key, f]));
  }

  private async processRecording(
    row: RecordingRow,
    recordingDataMap: Map<string, RecordingData>,
  ) {
    const recordingData = recordingDataMap.get(row.recording_key);

    if (!recordingData) {
      return this.logRecordingDataError(row);
    }

    const sourcePath = this.buildOriginPath(recordingData);
    const fileNames = this.buildFileNames(row);
    const remoteBasePath = this.buildRemotePath(row);

    for (const fileName of fileNames) {
      try {
        await this.ftpRepository.streamToSftp({
          sourcePath,
          destinationFileName: fileName,
          remoteBasePath,
        });

        await this.logSuccess(row, sourcePath, fileName, remoteBasePath);
      } catch (err) {
        if (err instanceof Error) {
          await this.logError(row, sourcePath, fileName, remoteBasePath, err);
        }
      }
    }
  }

  private buildOriginPath(file: RecordingData): string {
    const ts = String(file.time_stamp).replace(/[-: ]/g, "");

    const year = ts.slice(0, 4);
    const month = ts.slice(4, 6);
    const day = ts.slice(6, 8);
    const hour = ts.slice(8, 10);
    const minute = ts.slice(10, 12);
    const second = ts.slice(12, 14);
    const ms = ts.slice(14, 17);

    const fileName = `${second}${ms}${file.rec_key}${file.rec_time}.gsm`;

    return `/${year}/${month}/${day}/${hour}/${minute}/${fileName}`;
  }

  private buildFileNames(row: RecordingRow): string[] {
    const telefone =
      (row.tel_marcado ?? "").replace(/[^a-zA-Z0-9]/g, "") || "noPhone";
    const date = new Date(row.moment);
    const formattedDate = `${date.getFullYear()}-${String(
      date.getMonth() + 1,
    ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}_${String(
      date.getHours(),
    ).padStart(2, "0")}${String(date.getMinutes()).padStart(2, "0")}${String(
      date.getSeconds(),
    ).padStart(2, "0")}`;

    if (row.resultado === "3") {
      return [`${telefone}_${formattedDate}_${row.tipo_resultado}.mp3`];
    }

    if (row.resultado === "1") {
      if (row.contrato === "Contrato de eletricidade") {
        return [`${row.contrato_n.trim()}_${telefone}_${formattedDate}.mp3`];
      }

      if (row.contrato === "Contrato de gás") {
        return [
          `${row.contrato_n_gas.trim()}_${telefone}_${formattedDate}.mp3`,
        ];
      }

      if (row.contrato === "Contrato DUAL") {
        return [
          `${row.contrato_n.trim()}_${telefone}_${formattedDate}.mp3`,
          `${row.contrato_n_gas.trim()}_${telefone}_${formattedDate}.mp3`,
        ];
      }

      return [`noContract_${telefone}_${formattedDate}.mp3`];
    }

    return [`${telefone}_${formattedDate}.mp3`];
  }

  private buildRemotePath(row: RecordingRow): string {
    const date = new Date(row.moment);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    const datePath = `${year}/${month}/${day}`;

    if (row.resultado === "1") {
      return `/pluricall/Grabaciones/Venta/${datePath}`;
    }

    if (row.resultado === "3") {
      return `/pluricall/Grabaciones/No_Venta/${datePath}`;
    }

    return `/pluricall/Grabaciones/Outros/${datePath}`;
  }

  private async logSuccess(
    row: RecordingRow,
    sourcePath: string,
    fileName: string,
    remoteBasePath: string,
  ) {
    const sftp_destination_path = `${remoteBasePath}/${fileName}`;

    this.logger.info(
      {
        recording_key: row.recording_key,
        ftps_source_path: sourcePath,
        sftp_destination_path,
        file_name: fileName,
        contrato: row.contrato,
        resultado: row.resultado,
      },
      "Gravação enviada com sucesso",
    );

    await this.plenitudeRepository.saveSendRecordingLog({
      recording_key: row.recording_key,
      easycode: row.easycode,
      telefone: row.tel_marcado ?? "",
      contrato: row.contrato,
      contrato_n:
        row.contrato === "Contrato de gás"
          ? row.contrato_n_gas
          : row.contrato_n,
      resultado: row.resultado,
      ftps_source_path: sourcePath,
      sftp_destination_path,
      file_name: fileName,
      status: "SUCCESS",
    });
  }

  private async logError(
    row: RecordingRow,
    sourcePath: string,
    fileName: string,
    remoteBasePath: string,
    err: Error & { code?: string },
  ) {
    const sftp_destination_path = `${remoteBasePath}/${fileName}`;

    this.logger.error(
      {
        recording_key: row.recording_key,
        ftps_source_path: sourcePath,
        sftp_destination_path,
        file_name: fileName,
        error_type: "SYSTEM",
        error_message: err.message,
      },
      "Falha ao enviar gravação",
    );

    await this.plenitudeRepository.saveSendRecordingLog({
      recording_key: row.recording_key,
      easycode: row.easycode,
      telefone: row.tel_marcado ?? "",
      contrato: row.contrato,
      contrato_n:
        row.contrato === "Contrato de gás"
          ? row.contrato_n_gas
          : row.contrato_n,
      resultado: row.resultado,
      ftps_source_path: sourcePath,
      sftp_destination_path,
      file_name: fileName,
      status: "ERROR",
      error_type: "SYSTEM",
      error_message: err.message,
    });
  }

  private async logRecordingDataError(row: RecordingRow) {
    this.logger.error(
      {
        recording_key: row.recording_key,
        easycode: row.easycode,
        contrato: row.contrato,
        resultado: row.resultado,
        error_type: "SYSTEM",
        error_message: "Recording data not found in Panther",
      },
      "Gravação sem dados no Panther",
    );

    await this.plenitudeRepository.saveSendRecordingLog({
      recording_key: row.recording_key,
      easycode: row.easycode,
      telefone: row.tel_marcado ?? "",
      contrato: row.contrato,
      contrato_n:
        row.contrato === "Contrato de gás"
          ? row.contrato_n_gas
          : row.contrato_n,
      resultado: row.resultado,
      ftps_source_path: "",
      sftp_destination_path: "",
      file_name: "",
      status: "ERROR",
      error_type: "SYSTEM",
      error_message: "Recording data not found in Panther",
    });
  }
}
