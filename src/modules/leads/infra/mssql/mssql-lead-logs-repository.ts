import { connectPluricallDb } from "../../../../shared/infra/db/connect-pluricall";
import { LeadLogsDTO } from "../../domain/dtos/create-lead-logs.dto";
import { LeadLogsRepository } from "../../domain/repositories/lead-logs-repository";

export class MssqlLeadLogsRepository implements LeadLogsRepository {
  private poolPromise = connectPluricallDb("cloud");

  private async getPool() {
    return this.poolPromise;
  }

  async save(log: LeadLogsDTO): Promise<void> {
    const pool = await this.getPool();

    await pool
      .request()
      .input("lead_config_id", log.lead_config_id)
      .input("received", log.received_payload)
      .input("altitude_payload", log.altitude_payload)
      .input("altitude_response", log.altitude_response)
      .input("success", log.success)
      .input("error", log.error_message ?? null).query(`
        INSERT INTO leads_repository (
          lead_config_id,
          received_payload,
          altitude_payload,
          altitude_response,
          success,
          error_message
        )
        VALUES (
          @lead_config_id,
          @received,
          @altitude_payload,
          @altitude_response,
          @success,
          @error
        )
      `);
  }
}
