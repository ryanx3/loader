import sql from "mssql";
import {
  InsertAtServilusaLeadsRepository,
  ServilusaRepository,
} from "./servilusa.repository";
import { connectPluricallDb } from "../../../shared/infra/db/connect-pluricall";

export class MssqlServilusaRepository implements ServilusaRepository {
  private truncate(value: any, max: number): string {
    if (value === null || value === undefined) return "";
    const str = String(value);
    return str.length > max ? str.slice(0, max) : str;
  }

  async insertAtServilusaLeadsRepository(
    data: InsertAtServilusaLeadsRepository,
  ): Promise<void> {
    const conn = await connectPluricallDb("onprem");
    const timestamp = new Date()
      .toISOString()
      .replace("T", " ")
      .replace("Z", "");
    await conn
      .request()
      .input("lead_id", this.truncate(data.lead_id, 70))
      .input("encuesta_id", this.truncate(data.encuesta_id, 15))
      .input("gen_id", this.truncate(data.gen_id, 70))
      .input("timestamp", timestamp)
      .input("request_ip", this.truncate(data.request_ip, 50))
      .input("request_url", this.truncate(data.request_url, 300))
      .input("campanha_easy", this.truncate(data.campanha_easy, 30))
      .input("contact_list_easy", this.truncate(data.contact_list_easy, 50))
      .input("plc_cod_bd_easy", this.truncate(data.plc_cod_bd_easy, 30))
      .input("mapping_template", this.truncate(data.mapping_template, 150))
      .input("raw_phone_number", this.truncate(data.raw_phone_number, 50))
      .input("phone_number", this.truncate(data.phone_number, 14))
      .input("lead_status", this.truncate(data.lead_status, 100))
      .input("nif_cliente", this.truncate(data.nif_cliente, 10))
      .input("codigo_centro", this.truncate(data.codigo_centro, 5))
      .input("codigo_campanya", this.truncate(data.codigo_campanya, 5))
      .input("codigo_oleada", this.truncate(data.codigo_oleada, 10))
      .input(
        "codigo_interno_cliente",
        this.truncate(data.codigo_interno_cliente, 100),
      )
      .input("codigo_pregunta", this.truncate(data.codigo_pregunta, 5))
      .input("nombre_centro", this.truncate(data.nombre_centro, 100))
      .input("email", this.truncate(data.email, 180))
      .input("telefono", this.truncate(data.telefono, 15))
      .input("nombre_encuestado", this.truncate(data.nombre_encuestado, 180))
      .input("idioma", this.truncate(data.idioma, 5))
      .input("fecha_crea", this.truncate(data.fecha_crea, 25))
      .input("campo01", this.truncate(data.campo01, 150))
      .input("campo02", this.truncate(data.campo02, 150))
      .input("campo03", this.truncate(data.campo03, 150))
      .input("campo04", this.truncate(data.campo04, 150))
      .input("campo05", this.truncate(data.campo05, 150))
      .input("campo06", this.truncate(data.campo06, 150))
      .input("campo07", this.truncate(data.campo07, 150))
      .input("campo08", this.truncate(data.campo08, 150))
      .input("campo09", this.truncate(data.campo09, 150))
      .input("campo10", this.truncate(data.campo10, 150))
      .input("otrosdatos", this.truncate(data.otrosdatos, 150))
      .input("observaciones", this.truncate(data.observaciones, 250))
      .input("skey", this.truncate(data.skey, 100))
      .input("formdata", String(data.formdata)).query(`
    INSERT INTO servilusa_leads_repository (
      lead_id,
      encuesta_id,
      gen_id,
      timestamp,
      request_ip,
      request_url,
      campanha_easy,
      contact_list_easy,
      plc_cod_bd_easy,
      mapping_template,
      raw_phone_number,
      phone_number,
      email,
      telefono,
      lead_status,
      nif_cliente,
      codigo_centro,
      codigo_campanya,
      codigo_oleada,
      codigo_interno_cliente,
      codigo_pregunta,
      nombre_centro,
      nombre_encuestado,
      idioma,
      fecha_crea,
      campo01,
      campo02,
      campo03,
      campo04,
      campo05,
      campo06,
      campo07,
      campo08,
      campo09,
      campo10,
      otrosdatos,
      observaciones,
      skey,
      formdata
    ) VALUES (
      @lead_id,
      @encuesta_id,
      @gen_id,
      @timestamp,
      @request_ip,
      @request_url,
      @campanha_easy,
      @contact_list_easy,
      @plc_cod_bd_easy,
      @mapping_template,
      @raw_phone_number,
      @phone_number,
      @email,
      @telefono,
      @lead_status,
      @nif_cliente,
      @codigo_centro,
      @codigo_campanya,
      @codigo_oleada,
      @codigo_interno_cliente,
      @codigo_pregunta,
      @nombre_centro,
      @nombre_encuestado,
      @idioma,
      @fecha_crea,
      @campo01,
      @campo02,
      @campo03,
      @campo04,
      @campo05,
      @campo06,
      @campo07,
      @campo08,
      @campo09,
      @campo10,
      @otrosdatos,
      @observaciones,
      @skey,
      @formdata
    )
  `);
  }

  async updateStatus(
    genId: string | number,
    leadStatus: string,
  ): Promise<void> {
    const conn = await connectPluricallDb("onprem");

    await conn
      .request()
      .input("gen_id", sql.VarChar, String(genId))
      .input("lead_status", sql.VarChar, leadStatus).query(`
      UPDATE servilusa_leads_repository
      SET lead_status = @lead_status
      WHERE gen_id = @gen_id
    `);
  }
}
