import { AgilidadeLead } from "../../domain/entities/lead";
import { AgilidadeMssqlRecord } from "../types/agilidade-mssql.types";

export class AgilidadeMapper {
  private static truncate(
    value: string | undefined | null,
    maxLength: number,
  ): string {
    if (!value) return "";
    return String(value).substring(0, maxLength);
  }

  private static timestamp(): string {
    const now = new Date();
    return (
      now.getFullYear() +
      "-" +
      String(now.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(now.getDate()).padStart(2, "0") +
      " " +
      String(now.getHours()).padStart(2, "0") +
      ":" +
      String(now.getMinutes()).padStart(2, "0") +
      ":" +
      String(now.getSeconds()).padStart(2, "0")
    );
  }

  static toPersistence(
    lead: AgilidadeLead,
    requestIp: string,
    requestUrl: string,
  ): AgilidadeMssqlRecord {
    return {
      timestamp: this.timestamp(),
      request_ip: this.truncate(requestIp, 50),
      request_url: this.truncate(requestUrl, 300),
      gen_id: this.truncate(lead.genId, 70),
      campanha_easy: this.truncate("agilidade_leads", 30),
      contact_list_easy: this.truncate(lead.contactList, 50),
      bd_easy: this.truncate("UNKNOWN", 30),
      mapping_template: this.truncate("DEFAULT", 150),
      raw_phone_number: this.truncate(lead.telefone, 50),
      phone_number: this.truncate(lead.phoneNumber, 14),
      lead_status: this.truncate("RECEIVED", 100),
      nome: this.truncate(lead.nome, 120),
      email: this.truncate(lead.email, 180),
      lead_id: this.truncate(lead.leadId, 70),
      dist_id: this.truncate(lead.distId, 70),
      created_date: this.truncate(lead.dataEntrada, 80),
      posted_date: this.truncate(lead.dataPedido, 80),
      city: this.truncate(lead.localidade, 80),
      ad_id: this.truncate(lead.adId, 200),
      adset_id: this.truncate(lead.adsetId, 200),
      campaign_id: this.truncate(lead.campaignId, 200),
      ad_name: this.truncate(lead.adName, 200),
      campaign_name: this.truncate(lead.campaignName, 200),
      adset_name: this.truncate(lead.adsetName, 200),
      form_id: this.truncate(lead.formId, 200),
      formdata: JSON.stringify(lead),
    };
  }
}
