import { connectLeopardDb } from "../../../shared/infra/db/connect-leopard";

export interface RecordingData {
  rec_key: string;
  time_stamp: string;
  rec_time: string;
  file_size: number;
}

export class LeopardRepository {
  async findByRecKeys(recKeys: string[]): Promise<RecordingData[]> {
    const avr8 = await connectLeopardDb("avr8");

    const chunkSize = 500;
    const allResults: RecordingData[] = [];

    for (let i = 0; i < recKeys.length; i += chunkSize) {
      const chunk = recKeys.slice(i, i + chunkSize);
      const keys = chunk.map((key) => `'${key}'`).join(",");

      const result = await avr8.query(`
        SELECT rec_key, time_stamp, rec_time, file_size
        FROM recording
        WHERE rec_key IN (${keys})
      `);

      allResults.push(...result.recordset);
    }

    return allResults;
  }
}
