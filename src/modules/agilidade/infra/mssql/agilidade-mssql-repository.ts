import { connectPluricallDb } from "../../../../shared/infra/db/connect-pluricall";
import {
  AllContacts,
  CallAttempt,
  ContractsLogData,
  IAgilidadeRepository,
  RecordingRow,
  RecordingSendLog,
  SendRecordingsToClientApiRequest,
} from "../../domain/repositories/agilidade-repository";
import { AgilidadeLead } from "../../domain/entities/lead";
import { AgilidadeMapper } from "../mappers/agilidade-mapper";

export class AgilidadeMssqlRepository implements IAgilidadeRepository {
  async save(
    lead: AgilidadeLead,
    requestIp: string,
    requestUrl: string,
  ): Promise<void> {
    const record = AgilidadeMapper.toPersistence(lead, requestIp, requestUrl);
    const conn = await connectPluricallDb("onprem");

    await conn
      .request()
      .input("timestamp", record.timestamp)
      .input("request_ip", record.request_ip)
      .input("request_url", record.request_url)
      .input("gen_id", record.gen_id)
      .input("campanha_easy", record.campanha_easy)
      .input("contact_list_easy", record.contact_list_easy)
      .input("bd_easy", record.bd_easy)
      .input("mapping_template", record.mapping_template)
      .input("raw_phone_number", record.raw_phone_number)
      .input("phone_number", record.phone_number)
      .input("lead_status", record.lead_status)
      .input("nome", record.nome)
      .input("email", record.email)
      .input("lead_id", record.lead_id)
      .input("dist_id", record.dist_id)
      .input("created_date", record.created_date)
      .input("posted_date", record.posted_date)
      .input("city", record.city)
      .input("ad_id", record.ad_id)
      .input("adset_id", record.adset_id)
      .input("campaign_id", record.campaign_id)
      .input("ad_name", record.ad_name)
      .input("campaign_name", record.campaign_name)
      .input("adset_name", record.adset_name)
      .input("form_id", record.form_id)
      .input("formdata", String(record.formdata)).query(`
        INSERT INTO agilidade_leads_repository (
          timestamp,
          request_ip,
          request_url,
          gen_id,
          campanha_easy,
          contact_list_easy,
          bd_easy,
          mapping_template,
          raw_phone_number,
          phone_number,
          lead_status,
          nome,
          email,
          lead_id,
          dist_id,
          created_date,
          posted_date,
          city,
          ad_id,
          adset_id,
          campaign_id,
          ad_name,
          campaign_name,
          adset_name,
          form_id,
          formdata
        )
        VALUES (
          @timestamp,
          @request_ip,
          @request_url,
          @gen_id,
          @campanha_easy,
          @contact_list_easy,
          @bd_easy,
          @mapping_template,
          @raw_phone_number,
          @phone_number,
          @lead_status,
          @nome,
          @email,
          @lead_id,
          @dist_id,
          @created_date,
          @posted_date,
          @city,
          @ad_id,
          @adset_id,
          @campaign_id,
          @ad_name,
          @campaign_name,
          @adset_name,
          @form_id,
          @formdata
        )
      `);
  }

  async updateStatus(gen_id: string, lead_status: string): Promise<void> {
    const conn = await connectPluricallDb("onprem");
    await conn
      .request()
      .input("gen_id", gen_id)
      .input("lead_status", lead_status).query(`
        UPDATE agilidade_leads_repository
        SET lead_status = @lead_status
        WHERE gen_id = @gen_id
      `);
  }

  async getRecordingsByDay(data: SendRecordingsToClientApiRequest) {
    const conn = await connectPluricallDb("onprem");
    const result = await conn.request().query(`
    DECLARE @dataini DATETIME = '${data.initialDate} 00:00:00';
    DECLARE @datafim DATETIME = '${data.endDate} 23:59:59';
      WITH SUCCESS_TODAY AS (
    SELECT DISTINCT ct.easycode
    FROM ct_agilidade_leads ct
    INNER JOIN itr_recording ir
        ON ir.contact = ct.easycode
    WHERE ir.start_time BETWEEN @dataini AND @datafim
      AND ct.resultado = '1'
)
SELECT
    COALESCE(
        NULLIF(REPLACE(REPLACE(ct.telemovel_, ' ', ''), '-', ''), ''),
        NULLIF(REPLACE(REPLACE(ct.telefone_, ' ', ''), '-', ''), '')
    ) AS telefone,
    ct.easycode,
    ct.resultado,
    ct.duracao,
    ct.bd_id,
    ct.logincontacto,
    ir.recording_key,
    ir.start_time,
    0 AS is_historical
FROM ct_agilidade_leads ct
INNER JOIN itr_recording ir
    ON ir.contact = ct.easycode
WHERE ir.start_time BETWEEN @dataini AND @datafim
UNION ALL
SELECT
    COALESCE(
        NULLIF(REPLACE(REPLACE(ct.telemovel_, ' ', ''), '-', ''), ''),
        NULLIF(REPLACE(REPLACE(ct.telefone_, ' ', ''), '-', ''), '')
    ) AS telefone,
    ct.easycode,
    ct.resultado,
    ct.duracao,
    ct.bd_id,
    ct.logincontacto,
    ir.recording_key,
    ir.start_time,
    1 AS is_historical
FROM ct_agilidade_leads ct
INNER JOIN itr_recording ir
    ON ir.contact = ct.easycode
INNER JOIN SUCCESS_TODAY s
    ON s.easycode = ct.easycode
WHERE ir.start_time < @dataini
ORDER BY easycode, start_time;
      `);

    const rows: RecordingRow[] = result.recordset;
    return rows;
  }

  async saveSendRecordingLog(data: RecordingSendLog): Promise<void> {
    const conn = await connectPluricallDb("onprem");

    await conn
      .request()
      .input("recording_key", data.recording_key)
      .input("easycode", data.easycode)
      .input("telefone", data.telefone)
      .input("bd_id", data.bd_id)
      .input("file_name", data.file_name)
      .input("origem_path", data.origem_path)
      .input("status", data.status)
      .input("error_type", data.error_type ?? null)
      .input("api_response", data.api_response ?? null)
      .input("http_status", data.http_status ?? null).query(`
      INSERT INTO agilidade_recordings_repository (
        recording_key,
        easycode,
        telefone,
        bd_id,
        file_name,
        origem_path,
        status,
        error_type,
        api_response,
        http_status
      )
      VALUES (
        @recording_key,
        @easycode,
        @telefone,
        @bd_id,
        @file_name,
        @origem_path,
        @status,
        @error_type,
        @api_response,
        @http_status
      )
    `);
  }

  async saveSendContractsLog(data: ContractsLogData): Promise<void> {
    const conn = await connectPluricallDb("onprem");

    await conn
      .request()
      .input("easycode", data.easycode)
      .input("lead_id", data.lead_id)
      .input("colaborador", data.colaborador)
      .input("marca", data.marca)
      .input("status", data.status)
      .input("telefone", data.telefone)
      .input("email", data.email)
      .input("data_assinatura", data.data_assinatura)
      .input("periodicidade", data.periodicidade)
      .input("valor_ativacao", data.valor_ativacao)
      .input("mensalidade", data.mensalidade)
      .input("num_beneficiarios", data.num_beneficiarios)
      .input("send_status", data.send_status)
      .input("error_type", data.error_type ?? null)
      .input("api_response", data.api_response ?? null)
      .input("http_status", data.http_status ?? null)
      .input("body", data.body ?? null)
      .input("created_at", new Date()).query(`
      INSERT INTO agilidade_contracts_repository (
        easycode,
        lead_id,
        colaborador,
        marca,
        status,
        telefone,
        email,
        data_assinatura,
        periodicidade,
        valor_ativacao,
        mensalidade,
        num_beneficiarios,
        send_status,
        error_type,
        api_response,
        http_status,
        body,
        created_at
      )
      VALUES (
        @easycode,
        @lead_id,
        @colaborador,
        @marca,
        @status,
        @telefone,
        @email,
        @data_assinatura,
        @periodicidade,
        @valor_ativacao,
        @mensalidade,
        @num_beneficiarios,
        @send_status,
        @error_type,
        @api_response,
        @http_status,
        @body,
        @created_at
      )
    `);
  }

  async getLeadsParaEnviar(date: string) {
    const conn = await connectPluricallDb("onprem");
    const result = await conn.request().input("date", date).query(`
    SELECT *
    FROM ct_agilidade_leads ct
    WHERE ct.datacontacto >= CONVERT(DATETIME, @date + ' 00:00:00', 120)
      AND ct.datacontacto <  CONVERT(DATETIME, @date + ' 23:59:59', 120)
      AND NOT EXISTS (
        SELECT 1
        FROM agilidade_contracts_repository log
        WHERE log.easycode = ct.easycode
          AND log.send_status = 'SUCCESS'
      )
  `);
    return result.recordset;
  }

  async getAdesaoPrincipal(easycode: string) {
    const conn = await connectPluricallDb("onprem");

    const result = await conn.request().input("easycode", easycode).query(`
      SELECT TOP 1 *
      FROM agilidade_adesoes
      WHERE easycode = @easycode
        AND tipo_adesao = 'Principal'
    `);

    return result.recordset[0] || null;
  }

  async getAdesoesSecundarias(easycode: string) {
    const conn = await connectPluricallDb("onprem");

    const result = await conn.request().input("easycode", easycode).query(`
      SELECT *
      FROM agilidade_adesoes
      WHERE easycode = @easycode
        AND tipo_adesao = 'Secundaria'
    `);

    return result.recordset;
  }

  async updateLeadId(easycode: string, lead_id: string) {
    const conn = await connectPluricallDb("onprem");

    await conn.request().input("easycode", easycode).input("lead_id", lead_id)
      .query(`
      UPDATE ct_agilidade_leads
      SET bd_id = @lead_id
      WHERE easycode = @easycode
    `);
  }

  // ==========================================================
  // Fluxo de tentativas (thread) — roda sobre ct_agilidade_leads_fake
  // Usado só no ambiente de teste (Sandbox), não altera nada
  // do fluxo de produção acima.
  // ==========================================================

  async getAttemptsParaEnviar(
    windowStart: string,
    windowEnd: string,
  ): Promise<CallAttempt[]> {
    const conn = await connectPluricallDb("onprem");
    const result = await conn
      .request()
      .input("windowStart", windowStart)
      .input("windowEnd", windowEnd).query(`
      SELECT t.itr_global, t.contact, t.start_time, t.termination_state
      FROM itr_thread t
      INNER JOIN ct_agilidade_leads_fake ctf ON ctf.easycode = t.contact
      WHERE t.start_time >= @windowStart
        AND t.start_time <  @windowEnd
      ORDER BY t.contact, t.start_time ASC
    `);
    return result.recordset;
  }

  async getResultadoParaAttempt(
    easycode: string,
    attemptStartTime: Date,
    toleranceSeconds = 60,
  ): Promise<AllContacts | null> {
    const conn = await connectPluricallDb("onprem");
    const result = await conn
      .request()
      .input("easycode", easycode)
      .input("attemptStartTime", attemptStartTime)
      .input("toleranceSeconds", toleranceSeconds).query(`
        SELECT TOP 1 *
        FROM ct_agilidade_leads_fake ctf
        WHERE ctf.easycode = @easycode
          AND ABS(DATEDIFF(SECOND, ctf.inicioguiao, @attemptStartTime)) <= @toleranceSeconds
        ORDER BY ABS(DATEDIFF(MILLISECOND, ctf.inicioguiao, @attemptStartTime)) ASC
      `);
    return result.recordset[0] ?? null;
  }

  async getCtFakeByEasycode(easycode: string): Promise<AllContacts | null> {
    const conn = await connectPluricallDb("onprem");
    const result = await conn.request().input("easycode", easycode).query(`
      SELECT TOP 1 *
      FROM ct_agilidade_leads_fake
      WHERE easycode = @easycode
    `);
    return result.recordset[0] ?? null;
  }

  async getLastSentStatus(easycode: string): Promise<string | null> {
    const conn = await connectPluricallDb("onprem");
    const result = await conn.request().input("easycode", easycode).query(`
      SELECT TOP 1 status
      FROM agilidade_contracts_repository
      WHERE easycode = @easycode
        AND send_status = 'SUCCESS'
      ORDER BY created_at DESC
    `);
    return result.recordset[0]?.status ?? null;
  }

  async logSkippedAttempt(
    itr_global: number,
    easycode: string,
    status: string,
  ): Promise<void> {
    const conn = await connectPluricallDb("onprem");
    await conn
      .request()
      .input("itr_global", itr_global)
      .input("easycode", easycode)
      .input("status", status).query(`
        INSERT INTO agilidade_contracts_repository (
          easycode, lead_id, colaborador, marca, status, telefone, email,
          num_beneficiarios, send_status, api_response, body, created_at
        )
        VALUES (
          @easycode, '', '', '', @status, '', '',
          0, 'SUCCESS', 'SKIPPED: itr_global=' + CAST(@itr_global AS VARCHAR), NULL, GETDATE()
        )
      `);
  }
}
