import sql from "mssql";
import {
  InsertAtLeadsCorporateRepository,
  InsertAtLeadsRepository,
  MinisomFormConfig,
  MinisomRepository,
} from "./minisom.repository";
import { connectPluricallDb } from "../../../shared/infra/db/connect-pluricall";

export class MssqlMinisomRepository implements MinisomRepository {
  private truncate(value: any, max: number): string {
    if (value === null || value === undefined) return "";
    const str = String(value);
    return str.length > max ? str.slice(0, max) : str;
  }

  async verifyIfLeadIdExists(leadId: string | number): Promise<boolean> {
    const conn = await connectPluricallDb("onprem");
    const result = await conn
      .request()
      .input("lead_id", sql.VarChar, String(leadId))
      .query(
        `SELECT COUNT(*) as count FROM minisom_leads_repository WHERE lead_id = @lead_id`,
      );
    return result.recordset[0].count > 0;
  }

  async getBdByFormId(formId: any): Promise<MinisomFormConfig> {
    const conn = await connectPluricallDb("onprem");
    const result = await conn
      .request()
      .input("form_id", String(formId))
      .query(
        `SELECT id, bd, form_id, form_name, origin FROM minisom_forms_config WHERE form_id = @form_id`,
      );
    return result.recordset[0];
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
      UPDATE minisom_leads_repository
      SET lead_status = @lead_status
      WHERE gen_id = @gen_id
    `);
  }

  async updateCorporateLeadStatus(
    genId: string | number,
    leadStatus: string,
  ): Promise<void> {
    const conn = await connectPluricallDb("onprem");

    await conn
      .request()
      .input("gen_id", sql.VarChar, String(genId))
      .input("lead_status", sql.VarChar, leadStatus).query(`
      UPDATE minisom_corporate_leads_repository
      SET lead_status = @lead_status
      WHERE gen_id = @gen_id
    `);
  }

  private getLocalTimestamp(): string {
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

  async insertAtLeadsCorporateRepository(
    data: InsertAtLeadsCorporateRepository,
  ): Promise<void> {
    const conn = await connectPluricallDb("onprem");
    const timestamp = this.getLocalTimestamp();

    await conn
      .request()
      .input("timestamp", timestamp)
      .input("request_ip", this.truncate(data.request_ip, 50))
      .input("request_url", this.truncate(data.request_url, 300))
      .input("gen_id", this.truncate(data.gen_id, 70))
      .input("campanha_easy", this.truncate(data.campaignName, 30))
      .input("contact_list_easy", this.truncate(data.contactList, 50))
      .input("bd_easy", this.truncate(data.bd, 30))
      .input("raw_phone_number", this.truncate(data.raw_phone_number, 50))
      .input("phone_number", this.truncate(data.phone_number, 14))
      .input("lead_status", this.truncate(data.lead_status, 100))
      .input("name", this.truncate(data.name, 80))
      .input("surname", this.truncate(data.surname, 80))
      .input("email", this.truncate(data.email, 180))
      .input("address", this.truncate(data.address, 250))
      .input("type_of_request", this.truncate(data.type_of_request, 50))
      .input("free_message", this.truncate(data.free_message, 500))
      .input(
        "privacy_consensus_flag",
        this.truncate(data.privacy_consensus_flag, 1),
      )
      .input(
        "marketing_consensus_flag",
        this.truncate(data.marketing_consensus_flag, 1),
      )
      .input("form_title", this.truncate(data.form_title, 250))
      .input("language", this.truncate(data.language, 20))
      .input(
        "adobe_campaign_code",
        this.truncate(data.adobe_campaign_code, 500),
      )
      .input("origem", this.truncate(data.origem, 50))
      .input("formdata", JSON.stringify(data.formData)).query(`
      INSERT INTO minisom_corporate_leads_repository (
        timestamp,
        request_ip,
        request_url,
        gen_id,
        campanha_easy,
        contact_list_easy,
        bd_easy,
        raw_phone_number,
        phone_number,
        lead_status,
        name,
        surname,
        email,
        address,
        type_of_request,
        free_message,
        privacy_consensus_flag,
        marketing_consensus_flag,
        form_title,
        language,
        adobe_campaign_code,
        origem,
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
        @raw_phone_number,
        @phone_number,
        @lead_status,
        @name,
        @surname,
        @email,
        @address,
        @type_of_request,
        @free_message,
        @privacy_consensus_flag,
        @marketing_consensus_flag,
        @form_title,
        @language,
        @adobe_campaign_code,
        @origem,
        @formdata
      )
    `);
  }

  async insertAtLeadsRepository(data: InsertAtLeadsRepository): Promise<void> {
    try {
      const conn = await connectPluricallDb("onprem");
      const timestamp = this.getLocalTimestamp();
      const result = await conn
        .request()
        .input("timestamp", timestamp)
        .input("request_ip", this.truncate(data.requestIp, 50))
        .input("request_url", this.truncate(data.requestUrl, 300))
        .input("gen_id", this.truncate(data.genId, 70))
        .input("campanha_easy", this.truncate(data.campanhaEasy, 30))
        .input("contact_list_easy", this.truncate(data.contactList, 50))
        .input("bd_easy", this.truncate(data.bd, 30))
        .input("mapping_template", this.truncate(data.mappingTemplate, 150))
        .input("raw_phone_number", this.truncate(data.rawPhoneNumber, 50))
        .input("phone_number", this.truncate(data.phoneNumber, 14))
        .input("lead_status", this.truncate(data.leadStatus, 100))
        .input("campaign", this.truncate(data.campaign, 80))
        .input("lead_id", this.truncate(data.leadId, 70))
        .input("dist_id", this.truncate(data.distId, 70))
        .input("first_name", this.truncate(data.firstName, 80))
        .input("last_name", this.truncate(data.lastName, 80))
        .input("email", this.truncate(data.email, 180))
        .input("created_date", this.truncate(data.createdDate, 80))
        .input("posted_date", this.truncate(data.postedDate, 80))
        .input("address", this.truncate(data.address, 250))
        .input("city", this.truncate(data.city, 80))
        .input("post_code", this.truncate(data.postCode, 80))
        .input("site_id", this.truncate(data.siteId, 50))
        .input("age", this.truncate(data.age, 50))
        .input("dif_auditiva", this.truncate(data.difAuditiva, 150))
        .input("origem", this.truncate(data.origem, 50))
        .input("utm_source", this.truncate(data.utmSource, 100))
        .input("notes1", this.truncate(data.notes1, 250))
        .input("notes2", this.truncate(data.notes2, 250))
        .input("notes3", this.truncate(data.notes3, 250))
        .input("aut_dados", this.truncate(data.autDados, 150))
        .input("score", this.truncate(data.score, 50))
        .input("formdata", JSON.stringify(data.formData)).query(`
      INSERT INTO minisom_leads_repository (
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
        campaign,
        lead_id,
        dist_id,
        first_name,
        last_name,
        email,
        created_date,
        posted_date,
        address,
        city,
        post_code,
        site_id,
        age,
        dif_auditiva,
        origem,
        utm_source,
        notes1,
        notes2,
        notes3,
        aut_dados,
        score,
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
        @campaign,
        @lead_id,
        @dist_id,
        @first_name,
        @last_name,
        @email,
        @created_date,
        @posted_date,
        @address,
        @city,
        @post_code,
        @site_id,
        @age,
        @dif_auditiva,
        @origem,
        @utm_source,
        @notes1,
        @notes2,
        @notes3,
        @aut_dados,
        @score,
        @formdata
      )
    `);
      if (!result.rowsAffected || result.rowsAffected[0] !== 1) {
        throw new Error("Lead was not inserted");
      }
    } catch (error: any) {
      console.error("CRITICAL - insertAtLeadsRepository failed:", error);
      throw error;
    }
  }
}
