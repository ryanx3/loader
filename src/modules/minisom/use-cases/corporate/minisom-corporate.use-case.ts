import { generateGenId } from "../../../../shared/utils/generators/generate-gen-id";
import { generateNormalizedPhonePT } from "../../../../shared/utils/generators/generate-normalized-phone";
import { MinisomRepository } from "../../repositories/minisom.repository";
import { MinisomCorporateDTO } from "../../schemas/minisom-corporate.schema";
import { MinisomCorporateUploadContactsUseCase } from "./queue";

export interface MinisomCorporateRequest {
  bodyRequest: MinisomCorporateDTO;
  requestIp: string;
  requestUrl: string;
}

export class MinisomCorporateUseCase {
  constructor(
    private minisomRepository: MinisomRepository,
    private minisomCorporateUploadContacts: MinisomCorporateUploadContactsUseCase,
  ) {}

  private readonly YEAR = new Date().getFullYear();
  private readonly CAMPAIGN = "MinisomExtNet";
  private readonly CONTACTLIST = `Net${this.YEAR}`;
  private readonly ORIGEM = "WEBSERVICE";
  private readonly LANGUAGE = "pt_PT";

  private readonly GSB_CODES = [
    "PTSEM102PPXHA00",
    "PTSEM102PGO9ANI",
    "PTSEM102PIHTANI",
    "PTSEM102P2JHA00",
    "PTSEM102PLESA00",
    "PTSEM102PYRBA00",
    "PTSEM102PMQIA00",
    "PTSEM102PEUAA00",
    "PTSEM102PAB5A00",
    "PTSEM102PIEHA00",
    "PTSEM102PGO9AN",
    "PTSEM102PCRXA00",
    "PTSEM102PB3HA00",
  ];

  private readonly GSG_CODES = [
    "PTSEM102PHYAANI",
    "PTSEM102PPVWANI",
    "PTSEM102PPGMANI",
    "PTSEM102PPIWANI",
    "PTSEM102PHEOANI",
    "PTSEM102PXK4ANI",
    "PTSEM102PCZNANI",
    "PTSEM102PDMDANI",
    "PTSEM102P59XANI",
    "PTSEM102PSWCANI",
    "PTSEM102PPL2ANI",
    "PTSEM102POF8ANI",
    "PTSEM102PBLIANI",
    "PTSEM102PFGHANI",
    "PTSEM102P4VTANI",
    "PTSEM102P2OYA00",
    "PTSEM102PJJYA00",
    "PTSEM102PJ0PA00",
    "PTSEM102P4X1A00",
    "PTSEM102PLNAA00",
    "PTSEM102P1FUA00",
    "PTSEM102P5AYA00",
    "PTSEM102PVDHA00",
    "PTSEM102PGKMA00",
    "PTSEM102PAMWA00",
    "PTSEM102PYZYA00",
    "PTSEM102P20SA00",
    "PTSEM102PO0QA00",
    "PTSEM102PJW2A00",
    "PTSEM102P1N0A00",
    "PTSEM102P9NKA00",
    "PTSEM102PV2DA00",
    "PTSEM102PU1DA00",
    "PTSEM102POJ9A00",
    "PTSEM102PZZDA00",
    "PTSEM102PYOQA00",
  ];

  private resolveBdEasy(originalBd: string, adobeCampaignCode: string): string {
    if (originalBd !== "IWEB25") {
      return originalBd;
    }

    if (adobeCampaignCode.startsWith("PTPMX")) {
      return "IWEPMX";
    }

    if (this.GSB_CODES.some((code) => adobeCampaignCode.includes(code))) {
      return "IWEGSB";
    }

    if (this.GSG_CODES.some((code) => adobeCampaignCode.includes(code))) {
      return "IWEGSG";
    }

    return "IWEOTH";
  }

  async execute({
    bodyRequest,
    requestIp,
    requestUrl,
  }: MinisomCorporateRequest) {
    const genId = generateGenId();
    const normalizedPhoneNumber = generateNormalizedPhonePT(
      bodyRequest.phone_number,
    );
    const originalBd = "IWEB25";
    const bd = this.resolveBdEasy(originalBd, bodyRequest.adobe_campaign_code);
    const fullName = `${bodyRequest.name} ${bodyRequest.surname || ""}`.trim();

    await this.minisomRepository.insertAtLeadsCorporateRepository({
      bd,
      gen_id: genId,
      phone_number: normalizedPhoneNumber,
      raw_phone_number: bodyRequest.phone_number,
      marketing_consensus_flag: bodyRequest.marketing_consensus_flag || "",
      privacy_consensus_flag: bodyRequest.privacy_consensus_flag || "",
      name: bodyRequest.name || "",
      surname: bodyRequest.surname || "",
      form_title: bodyRequest.form_title || "",
      adobe_campaign_code: bodyRequest.adobe_campaign_code || "",
      free_message: bodyRequest.free_message || "",
      type_of_request: bodyRequest.type_of_request || "",
      utm_source: bodyRequest.utm_source || "",
      address: bodyRequest.address || "",
      email: bodyRequest.email || "",
      request_ip: requestIp,
      request_url: requestUrl,
      formData: bodyRequest,
      campaignName: this.CAMPAIGN,
      contactList: this.CONTACTLIST,
      origem: this.ORIGEM,
      language: this.LANGUAGE,
      lead_status: "RECEIVED",
    });

    await this.minisomCorporateUploadContacts
      .execute({
        adobeCampaignCode: bodyRequest.adobe_campaign_code,
        phoneNumber: normalizedPhoneNumber,
        name: fullName,
        bd,
        genId,
        formTitle: bodyRequest.form_title || "",
        marketingConsensusFlag: bodyRequest.marketing_consensus_flag || "",
        privacyConsensusFlag: bodyRequest.privacy_consensus_flag || "",
        address: bodyRequest.address || "",
        email: bodyRequest.email || "",
        campaign: this.CAMPAIGN,
        contactList: this.CONTACTLIST,
        origem: this.ORIGEM,
        language: this.LANGUAGE,
      })
      .catch((err) => {
        console.error(
          `[minisomCorporate] Falha ao enfileirar lead ${genId}:`,
          err,
        );
      });

    return { status: "OK", statusMsg: "", genId };
  }
}
