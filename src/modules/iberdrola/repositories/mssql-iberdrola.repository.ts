import { connectPluricallDb } from "../../../shared/infra/db/connect-pluricall";
import {
  IberdrolaRepository,
  InsertAnswerParams,
  SendedMessagesParams,
  WebhookPdfResponse,
} from "./iberdrola.repository";

export class MssqlIberdrolaRepository implements IberdrolaRepository {
  async sendedMessages(data: SendedMessagesParams): Promise<void> {
    const conn = await connectPluricallDb("onprem");
    await conn
      .request()
      .input("contract_id", data.contractId)
      .input("phone_number", data.phoneNumber)
      .input("message", data.message)
      .input("easycode", data.easycode)
      .input("campaign", data.campaign)
      .query(
        `INSERT INTO iberdrola_sms_send_log 
         (contract_id, phone_number, message, easycode, campaign, timestamp) 
         VALUES 
         (@contract_id, @phone_number, @message, @easycode, @campaign, GETDATE())`,
      );
  }

  async insertAnswer(data: InsertAnswerParams) {
    const conn = await connectPluricallDb("onprem");
    const systemTimeStamp = new Date();

    await conn
      .request()
      .input("rawID", data.contractId)
      .input("hostedNumber", data.hostedNumber)
      .input("senderNumber", data.senderNumber)
      .input("messageBody", data.response)
      .input("messageTimeStamp", new Date())
      .input("systemTimeStamp", systemTimeStamp).query(`
      INSERT INTO iberdrola_sms_inbox_log 
      (rawID, hostedNumber, senderNumber, messageBody, messageTimeStamp, systemTimeStamp) 
      VALUES 
      (@rawID, @hostedNumber, @senderNumber, @messageBody, @messageTimeStamp, @systemTimeStamp)
    `);
  }

  async webhookPdfResponse(data: WebhookPdfResponse): Promise<void> {
    const conn = await connectPluricallDb("onprem");
    const cleanedSrc = data.src ? data.src.trim().replace(/\s+/g, "") : "";
    const cleanedDst = data.dst ? data.dst.trim().replace(/\s+/g, "") : "";
    await conn
      .request()
      .input("ref_tsa", data.ref_tsa)
      .input("cert_type", data.cert_type)
      .input("mo", data.mo)
      .input("mt", data.mt)
      .input("mt_id", data.mt_id)
      .input("event", data.event)
      .input("lang", data.lang)
      .input("src", cleanedSrc)
      .input("dst", cleanedDst).query(`
        INSERT INTO iberdrola_sms_pdf
        (ref_tsa, cert_type, mo, mt, mt_id, event, lang, src, dst, received_at)
        VALUES
        (@ref_tsa, @cert_type, @mo, @mt, @mt_id, @event, @lang, @src, @dst, GETDATE())
      `);
  }
}
