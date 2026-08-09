import { connectPluricallDb } from "../../../../shared/infra/db/connect-pluricall";
import { EndesaLead } from "../../domain/entities/lead";
import { IEndesaRepository } from "../../domain/repositories/endesa-repository";
import { EndesaMapper } from "../mappers/endesa-mapper";

export class EndesaMssqlRepository implements IEndesaRepository {
  async save(
    lead: EndesaLead,
    requestIp: string,
    requestUrl: string,
  ): Promise<void> {
    const record = EndesaMapper.toPersistence(lead, requestIp, requestUrl);
    const conn = await connectPluricallDb("onprem");

    await conn
      .request()
      .input("timestamp", record.timestamp)
      .input("request_ip", record.request_ip)
      .input("request_url", record.request_url)
      .input("gen_id", record.gen_id)
      .input("campanha_easy", record.campanha_easy)
      .input("contact_list_easy", record.contact_list_easy)
      .input("plc_cod_bd_easy", record.plc_cod_bd_easy)
      .input("mapping_template", record.mapping_template)
      .input("raw_phone_number", record.raw_phone_number)
      .input("phone_number", record.phone_number)
      .input("lead_status", record.lead_status)
      .input("lead_id", record.lead_id)
      .input("nome", record.nome)
      .input("apelido", record.apelido)
      .input("genero", record.genero)
      .input("data_nascimento", record.data_nascimento)
      .input("cp4", record.cp4)
      .input("cp3", record.cp3)
      .input("comercializadora", record.comercializadora)
      .input("titular_fatura", record.titular_fatura)
      .input("source", record.source)
      .input("data_integracao", record.data_integracao)
      .input("formdata", String(record.formdata)).query(`
    INSERT INTO endesa_leads_repository (
      timestamp,
      request_ip,
      request_url,
      gen_id,
      campanha_easy,
      contact_list_easy,
      plc_cod_bd_easy,
      mapping_template,
      raw_phone_number,
      phone_number,
      lead_status,
      lead_id,
      nome,
      apelido,
      genero,
      data_nascimento,
      cp4,
      cp3,
      comercializadora,
      titular_fatura,
      source,
      data_integracao,
      formdata
    )
    VALUES (
      @timestamp,
      @request_ip,
      @request_url,
      @gen_id,
      @campanha_easy,
      @contact_list_easy,
      @plc_cod_bd_easy,
      @mapping_template,
      @raw_phone_number,
      @phone_number,
      @lead_status,
      @lead_id,
      @nome,
      @apelido,
      @genero,
      @data_nascimento,
      @cp4,
      @cp3,
      @comercializadora,
      @titular_fatura,
      @source,
      @data_integracao,
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
        UPDATE endesa_leads_repository
        SET lead_status = @lead_status
        WHERE gen_id = @gen_id
      `);
  }
}
