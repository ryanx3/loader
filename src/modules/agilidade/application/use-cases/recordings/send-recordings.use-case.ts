import { AgilidadeSendRecordingsService } from "../../../../../shared/infra/providers/agilidade/send-recordings";
import pLimit from "p-limit";
import {
  IAgilidadeRepository,
  RecordingRow,
} from "../../../domain/repositories/agilidade-repository";
import {
  LeopardRepository,
  RecordingData,
} from "../../../../../migrating/repositories/mssql/mssql-leopard-repository";
import { IFileService } from "../../../../../core/file/interfaces/file.types";
import { ILogger } from "../../../../../core/logger/interfaces/logger.types";

export class AgilidadeRecordingsUseCase {
  constructor(
    private agilidadeRepository: IAgilidadeRepository,
    private agilidadeApiService: AgilidadeSendRecordingsService,
    private leopardRepository: LeopardRepository,
    private fileService: IFileService,
    private logger: ILogger,
  ) {}

  private static readonly STORAGE_BASE_PATH =
    "\\\\tiger\\D$\\RepositorioAVR\\Storage";

  async execute(options: {
    initialDate: string;
    endDate: string;
    limit?: number;
  }) {
    let recordings = await this.getRecordings(options);
    if (options.limit) recordings = recordings.slice(0, options.limit);

    this.logger.info(
      { total: recordings.length, ...options },
      "Iniciando processamento de gravações",
    );

    const leopardMap = await this.getLeopardMap(recordings);
    const grouped = this.groupByBdIdAndInteraction(recordings);

    const limit = pLimit(5);
    const tasks = [...grouped.entries()].flatMap(([_, interactions]) =>
      [...interactions.entries()].map(([_, rows]) =>
        limit(() => this.processInteraction(rows, leopardMap)),
      ),
    );

    await Promise.all(tasks);

    this.logger.info(
      { total: recordings.length, ...options },
      "Processamento concluído",
    );
  }

  private async getRecordings({
    initialDate,
    endDate,
  }: {
    initialDate: string;
    endDate: string;
  }): Promise<RecordingRow[]> {
    return this.agilidadeRepository.getRecordingsByDay({
      initialDate,
      endDate,
      includeHistorical: true,
    });
  }

  private async getLeopardMap(
    rows: RecordingRow[],
  ): Promise<Map<string, RecordingData>> {
    const recKeys = rows.map((r) => r.recording_key);
    const leopardFiles = await this.leopardRepository.findByRecKeys(recKeys);
    return new Map(leopardFiles.map((f) => [f.rec_key, f]));
  }

  private groupByBdIdAndInteraction(
    rows: RecordingRow[],
  ): Map<string, Map<string, RecordingRow[]>> {
    const grouped = new Map<string, Map<string, RecordingRow[]>>();

    for (const row of rows) {
      if (!grouped.has(row.bd_id)) grouped.set(row.bd_id, new Map());
      const interactions = grouped.get(row.bd_id)!;

      const key = String(row.easycode);
      if (!interactions.has(key)) interactions.set(key, []);
      interactions.get(key)!.push(row);
    }

    return grouped;
  }

  private async processInteraction(
    rows: RecordingRow[],
    leopardMap: Map<string, RecordingData>,
  ) {
    const representative = rows[0];
    const date = new Date(representative.start_time);

    const gravacoes: {
      buffer: Buffer;
      fileName: string;
      sourcePath: string;
    }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const leopard = leopardMap.get(row.recording_key);

      if (!leopard) {
        await this.logLeopardError(row);
        continue;
      }

      const sourcePath = this.buildOriginPath(leopard);

      try {
        const buffer = await this.fileService.readFile(sourcePath);
        gravacoes.push({
          buffer,
          sourcePath,
          fileName: this.buildFileName(representative, i + 1),
        });
      } catch (err) {
        if (err instanceof Error) await this.logError(row, sourcePath, err);
      }
    }

    if (gravacoes.length === 0) return;

    try {
      const result = await this.agilidadeApiService.sendRecordings({
        Id: representative.bd_id ?? "",
        TipoChamada: this.mapStatus(String(representative.resultado)),
        DataHora: date.toISOString(),
        Telefone: representative.telefone ?? "",
        AtendidaPor: representative.logincontacto.trim() ?? "",
        Duracao: this.formatDuration(Number(representative.duracao)),
        Gravacoes: gravacoes,
      });

      for (const gravacao of gravacoes) {
        await this.logSuccess(
          representative,
          gravacao.sourcePath,
          gravacao.fileName,
          result.raw,
        );
      }
    } catch (err) {
      if (err instanceof Error) {
        for (const gravacao of gravacoes) {
          await this.logError(representative, gravacao.sourcePath, err);
        }
      }
    }
  }

  private async logSuccess(
    row: RecordingRow,
    origem: string,
    file_name: string,
    api_response: string,
  ) {
    this.logger.info(
      { recording_key: row.recording_key, file_name },
      "Gravação processada com sucesso",
    );

    await this.agilidadeRepository.saveSendRecordingLog({
      recording_key: row.recording_key,
      easycode: row.easycode,
      telefone: row.telefone ?? "",
      bd_id: row.bd_id,
      file_name,
      origem_path: origem,
      status: "SUCCESS",
      api_response,
    });
  }

  private async logError(
    row: RecordingRow,
    origem: string,
    err: Error & { response?: { status: number } },
  ) {
    const isApiError = !!err.response;

    this.logger.error(
      {
        recording_key: row.recording_key,
        error_type: isApiError ? "API" : "SYSTEM",
        http_status: err.response?.status,
        message: err.message,
      },
      "Falha ao processar gravação",
    );

    await this.agilidadeRepository.saveSendRecordingLog({
      recording_key: row.recording_key,
      easycode: row.easycode,
      telefone: row.telefone ?? "",
      bd_id: row.bd_id,
      file_name: "",
      origem_path: origem,
      status: "ERROR",
      error_type: isApiError ? "API" : "SYSTEM",
      api_response: err.message,
      http_status: err.response?.status,
    });
  }

  private async logLeopardError(row: RecordingRow) {
    this.logger.error(
      { recording_key: row.recording_key },
      "Sem dados Leopard para esta gravação",
    );

    await this.agilidadeRepository.saveSendRecordingLog({
      recording_key: row.recording_key,
      easycode: row.easycode,
      telefone: row.telefone ?? "",
      bd_id: row.bd_id,
      file_name: "",
      origem_path: "",
      status: "ERROR",
      error_type: "SYSTEM",
      api_response: "Leopard data not found",
    });
  }

  private mapStatus(resultado: string) {
    const map: Record<string, string> = {
      "1": "Convertida",
      "2": "Agendada",
      "3": "Sem Interesse",
      Y: "Não quer ser mais contactado em Telemarketing",
      Q: "Não pretende ser mais contactado",
      Z: "Cliente pede eliminação dos dados",
      C: "Não quer plano - quer ir a clínica",
      I: "Envio de informações",
      E: "Número errado",
      F: "Fax",
      V: "Voice Mail",
    };
    return map[resultado] ?? "Não Atendida";
  }

  private formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
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

    const folder = `${year}\\${month}\\${day}\\${hour}\\${minute}\\`;
    const file_name = `${second}${ms}${file.rec_key}${file.rec_time}.wav`;

    return `${AgilidadeRecordingsUseCase.STORAGE_BASE_PATH}\\${folder}${file_name}`;
  }

  private buildFileName(row: RecordingRow, index: number): string {
    const telefone = row.telefone.replace(/[^a-zA-Z0-9]/g, "") || "semTelefone";
    const date = new Date(row.start_time);
    const formattedDate = date.toISOString().replace(/[:.]/g, "-");
    return `${formattedDate}_${telefone}_${row.easycode}_${row.bd_id}_parte${index}.wav`;
  }
}
