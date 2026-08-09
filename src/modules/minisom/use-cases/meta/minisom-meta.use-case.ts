import { AlreadyExistsError } from "../../../../shared/errors/name-already-exists-error";
import { NotFoundError } from "../../../../shared/errors/not-found-error";
import { generateGenId } from "../../../../shared/utils/generators/generate-gen-id";
import { generateNormalizedPhonePT } from "../../../../shared/utils/generators/generate-normalized-phone";
import { MinisomRepository } from "../../repositories/minisom.repository";
import { MinisomMetaDTO } from "../../schemas/minisom-meta.schema";
import { MinisomMetaUploadContactsUseCase } from "./queue";

export interface MinisomMetaRequest {
  bodyRequest: MinisomMetaDTO;
  requestIp: string;
  requestUrl: string;
}

export class MinisomMetaUseCase {
  constructor(
    private minisomRepository: MinisomRepository,
    private minisomMetaUploadContacts: MinisomMetaUploadContactsUseCase,
  ) {}

  private readonly YEAR = new Date().getFullYear();
  private readonly CAMPAIGN = "MinisomExtNet";
  private readonly CONTACTLIST = `Net${this.YEAR}`;
  private readonly ORIGEM = "FACEBOOK";

  async execute({ bodyRequest, requestIp, requestUrl }: MinisomMetaRequest) {
    const normalizedPhoneNumber = generateNormalizedPhonePT(
      bodyRequest.phone_number,
    );

    const bd = await this.minisomRepository.getBdByFormId(bodyRequest.form_id);
    if (!bd) {
      throw new NotFoundError("Form Id not found");
    }

    const duplicatedLead = await this.minisomRepository.verifyIfLeadIdExists(
      bodyRequest.lead_id,
    );

    if (duplicatedLead) {
      throw new AlreadyExistsError("Lead ID already exists");
    }

    const genId = generateGenId();

    await this.minisomRepository.insertAtLeadsRepository({
      bd: bd.bd,
      genId,
      campaign: bodyRequest.form_id,
      leadId: bodyRequest.lead_id,
      rawPhoneNumber: bodyRequest.phone_number,
      phoneNumber: normalizedPhoneNumber,
      email: bodyRequest.email || "",
      firstName: bodyRequest.full_name || "",
      requestIp: requestIp || "",
      requestUrl: requestUrl || "",
      formData: bodyRequest || "",
      mappingTemplate: "DEFAULT",
      utmSource: "",
      address: "",
      city: "",
      createdDate: "",
      lastName: "",
      postedDate: "",
      autDados: "",
      age: "",
      difAuditiva: "",
      distId: "",
      notes1: "",
      notes2: "",
      notes3: "",
      postCode: "",
      score: "",
      siteId: "",
      campanhaEasy: this.CAMPAIGN,
      contactList: this.CONTACTLIST,
      origem: this.ORIGEM,
      leadStatus: "RECEIVED",
    });

    this.minisomMetaUploadContacts
      .execute({
        bd: bd.bd,
        genId,
        email: bodyRequest.email,
        leadId: bodyRequest.lead_id,
        name: bodyRequest.full_name,
        phoneNumber: normalizedPhoneNumber,
        contactList: this.CONTACTLIST,
        campaign: this.CAMPAIGN,
      })
      .catch((err) => {
        console.error(`[minisomMeta] Falha ao enfileirar lead ${genId}:`, err);
      });

    return { status: "OK", statusMsg: "Lead loaded with success.", genId };
  }
}
