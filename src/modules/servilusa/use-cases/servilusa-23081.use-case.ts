import { generateGenId } from "../../../shared/utils/generators/generate-gen-id";
import { generateNormalizedPhonePT } from "../../../shared/utils/generators/generate-normalized-phone";
import { ServilusaEncuestaSchema } from "../http/controllers/servilusa-23081.controller";
import { ServilusaRepository } from "../repositories/servilusa.repository";
import { Servilusa23081UploadContactsUseCase } from "./queue";

export class Servilusa23081UseCase {
  constructor(
    private servilusaRepository: ServilusaRepository,
    private servilusa23081UploadContacts: Servilusa23081UploadContactsUseCase,
  ) {}

  private CAMPAIGN = "servilusa_out";
  private CONTACT_LIST = "Autoload";
  private PLC_COD_BD = "UNDEFINED";
  private MAPPING_TEMPLATE = "DEFAULT";
  private LEAD_STATUS = "PENDING";

  async execute(
    request: ServilusaEncuestaSchema,
    requestIp: string,
    requestUrl: string,
  ) {
    try {
      const genId = generateGenId();

      const rawPhoneNumber = String(request.telefono || "");
      const normalizedPhoneNumber = generateNormalizedPhonePT(rawPhoneNumber);

      await this.servilusaRepository.insertAtServilusaLeadsRepository({
        lead_id: request.id,
        encuesta_id: request.id,
        gen_id: genId,
        timestamp: new Date(),
        request_ip: requestIp || "",
        request_url: requestUrl || "",
        campanha_easy: this.CAMPAIGN,
        contact_list_easy: this.CONTACT_LIST,
        plc_cod_bd_easy: this.PLC_COD_BD,
        mapping_template: this.MAPPING_TEMPLATE,
        raw_phone_number: rawPhoneNumber || "",
        phone_number: normalizedPhoneNumber || "",
        email: request.email || "",
        telefono: normalizedPhoneNumber || "",
        lead_status: this.LEAD_STATUS || "",
        nif_cliente: request.nif_cliente || "",
        codigo_centro: String(request.codigo_centro || "").substring(0, 5),
        codigo_campanya: String(request.codigo_campanya || "").substring(0, 5),
        codigo_oleada: String(request.codigo_oleada || "").substring(0, 10),
        codigo_interno_cliente: request.codigo_interno_cliente || "",
        codigo_pregunta: String(request.codigo_pregunta || "").substring(0, 5),
        nombre_centro: request.nombre_centro || "",
        nombre_encuestado: request.nombre_encuestado || "",
        idioma: request.idioma || "pt",
        fecha_crea: request.fecha_crea || "",
        campo01: request.campo01 || "",
        campo02: request.campo02 || "",
        campo03: request.campo03 || "",
        campo04: request.campo04 || "",
        campo05: request.campo05 || "",
        campo06: request.campo06 || "",
        campo07: request.campo07 || "",
        campo08: request.campo08 || "",
        campo09: request.campo09 || "",
        campo10: request.campo10 || "",
        otrosdatos: request.otrosdatos || "",
        observaciones: request.observaciones || "",
        skey: request.skey || "",
        formdata: request,
      });

      await this.servilusa23081UploadContacts.execute({
        genId,
        campaign: this.CAMPAIGN,
        contactList: this.CONTACT_LIST,
        campo01: request.campo01,
        campo02: request.campo02,
        campo03: request.campo03,
        campo04: request.campo04,
        campo05: request.campo05,
        campo06: request.campo06,
        campo07: request.campo07,
        campo08: request.campo08,
        campo09: request.campo09,
        campo10: request.campo10,
        codigo_campanya: String(request.codigo_campanya || "").substring(0, 5),
        codigo_centro: String(request.codigo_centro || "").substring(0, 5),
        codigo_interno_cliente: request.codigo_interno_cliente,
        codigo_oleada: request.codigo_oleada,
        codigo_pregunta: request.codigo_pregunta,
        email: request.email,
        fecha_crea: request.fecha_crea,
        id: request.id,
        idioma: request.idioma,
        nif_cliente: request.nif_cliente,
        nombre_centro: request.nombre_centro,
        nombre_encuestado: request.nombre_encuestado,
        observaciones: request.observaciones,
        otrosdatos: request.otrosdatos,
        phoneNumber: normalizedPhoneNumber,
        skey: request.skey,
        telefono: request.telefono,
      });

      return { status: "OK", statusMsg: "Lead loaded with success.", genId };
    } catch (error: any) {
      console.error("❌ Erro ao salvar lead:", error);
      return {
        status: "error",
        status_msg: error.message || "Erro interno ao processar",
        gen_id: "",
      };
    }
  }
}
