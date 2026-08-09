import sql from "mssql";
import { LeadMappingRepository } from "../../domain/repositories/lead-mapping-repository";
import { LeadMappingMapper } from "../mappers/lead-mapping-mapper";
import { CreateLeadMappingDTO } from "../../domain/dtos/create-lead-mapping.dto";
import { LeadMappingRow } from "../types/lead-mapping-row";
import { connectPluricallDb } from "../../../../shared/infra/db/connect-pluricall";

export class MssqlLeadMappingRepository implements LeadMappingRepository {
  private poolPromise = connectPluricallDb("cloud");

  private async getPool() {
    return this.poolPromise;
  }

  async saveMany(
    leadConfigId: number,
    mappings: CreateLeadMappingDTO[],
  ): Promise<void> {
    if (!mappings.length) return;

    const pool = await this.getPool();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      for (const map of mappings) {
        await new sql.Request(transaction)
          .input("lead_config_id", leadConfigId)
          .input("source_field", map.source_field)
          .input("altitude_field", map.altitude_field)
          .input("is_required", map.is_required)
          .input("is_phone_number", map.is_phone_number).query(`
            INSERT INTO leads_mapping (
              lead_config_id,
              source_field,
              altitude_field,
              is_required,
              is_phone_number
            )
            VALUES (
              @lead_config_id,
              @source_field,
              @altitude_field,
              @is_required,
              @is_phone_number
            )
          `);
      }

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  async findByLeadConfigId(leadConfigId: number) {
    const pool = await this.getPool();

    const result = await pool.request().input("lead_config_id", leadConfigId)
      .query<LeadMappingRow>(`
        SELECT *
        FROM leads_mapping
        WHERE lead_config_id = @lead_config_id
      `);

    return result.recordset.map(LeadMappingMapper.toDomain);
  }
}
