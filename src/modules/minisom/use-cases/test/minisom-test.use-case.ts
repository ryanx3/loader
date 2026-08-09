import { FieldRequiredError } from "../../../../shared/errors/field-required";
import { AlreadyExistsError } from "../../../../shared/errors/name-already-exists-error";
import { generateGenId } from "../../../../shared/utils/generators/generate-gen-id";
import { generateNormalizedPhonePT } from "../../../../shared/utils/generators/generate-normalized-phone";
import { MinisomRepository } from "../../repositories/minisom.repository";
import { MinisomTestDTO } from "../../schemas/minisom-test.schema";
import { MinisomTestUploadContactsUseCase } from "./queue-test";

export interface MinisomTestRequest {
  bodyRequest: MinisomTestDTO;
  requestIp: string;
  requestUrl: string;
}

export class MinisomTestUseCase {
  constructor(
    private minisomRepository: MinisomRepository,
    private minisomTestUploadContacts: MinisomTestUploadContactsUseCase,
  ) {}

  private readonly CAMPAIGN = "MinisomExtNet";
  private readonly CONTACTLIST = `LeadsTest`;
  private readonly ORIGEM = "TEST";

  async execute({ bodyRequest, requestIp, requestUrl }: MinisomTestRequest) {
    if (!bodyRequest.bd) {
      throw new FieldRequiredError("BD is required");
    }

    const duplicatedLead = await this.minisomRepository.verifyIfLeadIdExists(
      bodyRequest.lead_id,
    );

    if (duplicatedLead) {
      throw new AlreadyExistsError("Lead ID already exists");
    }

    const genId = generateGenId();
    const normalizedPhoneNumber = generateNormalizedPhonePT(
      bodyRequest.phone_number,
    );
    const fullName =
      `${bodyRequest.first_name} ${bodyRequest.last_name || ""}`.trim();

    await this.minisomRepository.insertAtLeadsRepository({
      leadId: bodyRequest.lead_id || "",
      campaign: bodyRequest.form_id || "",
      email: bodyRequest.email || "",
      bd: bodyRequest.bd || "",
      firstName: bodyRequest.first_name || "",
      rawPhoneNumber: bodyRequest.phone_number,
      phoneNumber: normalizedPhoneNumber,
      genId,
      utmSource: bodyRequest.utm_source || "",
      requestIp: requestIp || "",
      requestUrl: requestUrl || "",
      formData: bodyRequest || "",
      address: bodyRequest.address || "",
      city: bodyRequest.city || "",
      createdDate: bodyRequest.created_date || "",
      lastName: bodyRequest.last_name || "",
      postedDate: bodyRequest.posted_date || "",
      mappingTemplate: "TEST",
      autDados: bodyRequest.privacy || "",
      age: bodyRequest.birth_date || "",
      difAuditiva: bodyRequest.dif_auditiva || "",
      distId: bodyRequest.partner_id || "",
      notes1: "",
      notes2: bodyRequest.additional2 || "",
      notes3: bodyRequest.additional3 || "",
      postCode: bodyRequest.post_code || "",
      score: bodyRequest.marketing || "",
      siteId: bodyRequest.site_id || "",
      campanhaEasy: this.CAMPAIGN,
      contactList: this.CONTACTLIST,
      origem: this.ORIGEM,
      leadStatus: "RECEIVED",
    });

    this.minisomTestUploadContacts.execute({
      phoneNumber: normalizedPhoneNumber,
      name: fullName,
      genId,
      email: bodyRequest.email || "",
      bd: bodyRequest.bd,
      birthDate: bodyRequest.birth_date || "",
      city: bodyRequest.city || "",
      leadId: bodyRequest.lead_id || "",
      utmSource: bodyRequest.utm_source || "",
      campaign: this.CAMPAIGN,
      contactList: this.CONTACTLIST,
      origem: this.ORIGEM,
      privacy: bodyRequest.privacy || "",
      marketing: bodyRequest.marketing || "",
    });

    return { status: "OK", statusMsg: "Lead loaded with success.", genId };
  }
}
