import { LeopardRepository } from "../../repositories/mssql/mssql-leopard-repository";
import { PluricallRepository } from "../../repositories/pluricall-repository";
import { FetchRecordingKeyParams } from "../../repositories/types/pluricall-repository-types";

export interface RecordingResult {
  total: number;
  rec_key: string;
  time_stamp: string;
  rec_time: string;
  file_size: number;
  easycode: number;
  telefone: string;
  moment: string;
  bd: string;
  duration: number;
  loginContacto: string;
  campaign: string;
  resultado: string;
  has_multiple_recordings: boolean;
  recording_index: number;
  total_recordings: number;
}

export class FetchRecordingsUseCase {
  constructor(
    private readonly pluricallRepository: PluricallRepository,
    private readonly leopardRepository: LeopardRepository,
  ) {}

  async execute({
    ctName,
    day,
    percentDifferentsResult,
    resultsNotInFivePercent,
    isHistorical,
  }: FetchRecordingKeyParams): Promise<RecordingResult[]> {
    const recordingKeys = await this.pluricallRepository.fetchRecordings({
      ctName,
      day,
      percentDifferentsResult,
      resultsNotInFivePercent,
      isHistorical,
    });

    if (recordingKeys.length === 0) {
      return [];
    }

    const keys = recordingKeys.map((r) => r.recording_key);
    const leopardRecords = await this.leopardRepository.findByRecKeys(keys);

    const pumaMap = new Map(recordingKeys.map((r) => [r.recording_key, r]));

    const leopardByRecKey = leopardRecords.reduce(
      (acc, record) => {
        if (!acc[record.rec_key]) {
          acc[record.rec_key] = [];
        }
        acc[record.rec_key].push(record);
        return acc;
      },
      {} as Record<string, typeof leopardRecords>,
    );

    const result: RecordingResult[] = [];

    for (const [recKey, leopardFiles] of Object.entries(leopardByRecKey)) {
      const pumaRecord = pumaMap.get(recKey);

      if (pumaRecord) {
        for (const leopard of leopardFiles) {
          result.push({
            total: recordingKeys.length,
            rec_key: leopard.rec_key,
            time_stamp: leopard.time_stamp,
            rec_time: leopard.rec_time,
            file_size: leopard.file_size,
            easycode: pumaRecord.easycode,
            duration: pumaRecord.duration,
            loginContacto: pumaRecord.loginContacto,
            telefone: pumaRecord.telefone || "",
            moment: pumaRecord.moment || "",
            bd: pumaRecord.bd || "",
            campaign: pumaRecord.campaign || "",
            resultado: pumaRecord.resultado || "",
            has_multiple_recordings: leopardFiles.length > 1,
            recording_index: leopardFiles.indexOf(leopard) + 1,
            total_recordings: leopardFiles.length,
          });
        }
      }
    }

    return result;
  }
}
