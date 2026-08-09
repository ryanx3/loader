import { connectPluricallDb } from "../../../../shared/infra/db/connect-pluricall";
import {
  CreateReportParams,
  UpdateReportStatusParams,
  Report,
  ReportsRepository,
} from "../relatorios.repository";

export class MssqlReportsRepository implements ReportsRepository {
  async create(data: CreateReportParams): Promise<void> {
    const pool = await connectPluricallDb("onprem");

    await pool
      .request()
      .input("clientName", data.clientName)
      .input("siteId", data.siteId)
      .input("machine", data.machine)
      .input("schedule", data.schedule)
      .input("driveId", data.driveId)
      .input("folderPath", data.folderPath ?? "")
      .input("foldersByDate", data.foldersByDate ? 1 : 0)
      .input("status", data.status).query(`
    INSERT INTO relatorios
      (client_name, site_id, machine, schedule, drive_id, folder_path, folders_by_date, status)
    VALUES
      (@clientName, @siteId, @machine, @schedule, @driveId, @folderPath, @foldersByDate, @status)
  `);
  }

  async findAllActive(): Promise<Report[]> {
    const pool = await connectPluricallDb("onprem");

    const result = await pool.request().query(`
      SELECT * FROM relatorios
      WHERE status = 'ACTIVO'
      ORDER BY created_at DESC
    `);

    return result.recordset;
  }

  async findByName(clientName: string): Promise<Report | null> {
    const pool = await connectPluricallDb("onprem");

    const result = await pool.request().input("clientName", clientName).query(`
        SELECT * FROM relatorios
        WHERE client_name = @clientName
      `);

    return result.recordset[0] ?? null;
  }

  async deactivateClient(clientName: string): Promise<void> {
    const pool = await connectPluricallDb("onprem");

    await pool.request().input("clientName", clientName).query(`
      UPDATE relatorios
      SET status = 'INACTIVO'
      WHERE client_name = @clientName;
    `);
  }

  async updateStatus(data: UpdateReportStatusParams): Promise<void> {
    const pool = await connectPluricallDb("onprem");

    await pool
      .request()
      .input("id", data.id)
      .input("lastStatus", data.lastStatus)
      .input("error", data.error ?? null)
      .input("fileSize", data.fileSize ?? null).query(`
      UPDATE relatorios
      SET
        last_status     = @lastStatus,
        last_send       = GETDATE(),
        error           = @error,
        updated_at      = GETDATE(),
        file_size       = COALESCE(@fileSize, file_size),
        calls_today     = CASE
                            WHEN CAST(last_count_date AS DATE) = CAST(GETDATE() AS DATE)
                            THEN calls_today + 1
                            ELSE 1
                          END,
        last_count_date = CAST(GETDATE() AS DATE)
      WHERE id = @id
    `);
  }
}
