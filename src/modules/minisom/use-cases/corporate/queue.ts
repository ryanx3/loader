import { altitudeQueue } from "../../../../shared/infra/queue/altitude/altitude-queue";
import { generateDataload } from "../../../../shared/utils/generators/generate-dataload";
import { generatePlcId } from "../../../../shared/utils/generators/generate-plc-id";
import { MinisomGetPriorityService } from "../../services/get-priority";

interface UploadContactsCorporate {
  phoneNumber: string | number;
  email: any;
  name: any;
  bd: any;
  formTitle: any;
  adobeCampaignCode: any;
  marketingConsensusFlag: any;
  privacyConsensusFlag: any;
  address: any;
  language: any;
  genId: any;
  campaign: any;
  contactList: any;
  origem: any;
}

export class MinisomCorporateUploadContactsUseCase {
  private buildAltitudeField(Name: string, Value: any) {
    if (Name === "FirstName" && typeof Value === "string") {
      Value = Value.substring(0, 100);
    }

    if (Name === "MobilePhone" || Name === "HomePhone") {
      Value = String(Value ?? "").slice(-9);
    }
    return {
      discriminator: "DatabaseFields",
      Name,
      Value: Value ?? "",
      IsAnonymized: false,
    };
  }

  async execute({
    phoneNumber,
    formTitle,
    name,
    bd,
    email,
    genId,
    adobeCampaignCode,
    campaign,
    contactList,
    origem,
    address,
    marketingConsensusFlag,
    privacyConsensusFlag,
    language,
  }: UploadContactsCorporate) {
    const dataload = generateDataload();
    const priority = MinisomGetPriorityService.calculate();
    const plcId = generatePlcId();
    const origemAndSource = `${origem} ${adobeCampaignCode || ""}`.trim();
    let fieldToLoadPhoneNumber: string = "HomePhone";

    if (
      String(phoneNumber).startsWith("91") ||
      String(phoneNumber).startsWith("92") ||
      String(phoneNumber).startsWith("93") ||
      String(phoneNumber).startsWith("96")
    ) {
      fieldToLoadPhoneNumber = "MobilePhone";
    }

    const payload = {
      campaignName: campaign,
      contactCreateRequest: {
        Status: "Started",
        ContactListName: { RequestType: "Set", Value: contactList },
        Priority: {
          RequestType: "Set",
          Value: priority,
        },
        Attributes: [
          this.buildAltitudeField(fieldToLoadPhoneNumber, phoneNumber),
          this.buildAltitudeField("id_cliente", String(genId)),
          this.buildAltitudeField("Email1", String(email)),
          this.buildAltitudeField("FirstName", String(name)),
          this.buildAltitudeField("HomeStreet", String(address)),
          this.buildAltitudeField("Manager", String(privacyConsensusFlag)),
          this.buildAltitudeField("Assistant", String(marketingConsensusFlag)),
          this.buildAltitudeField(
            "realizou_exame_tempo",
            String(origemAndSource),
          ),
          this.buildAltitudeField("BusinessStreet", String(formTitle)),
          this.buildAltitudeField("PreferredLanguage", String(language)),
          this.buildAltitudeField("bd", String(bd)),
          this.buildAltitudeField("dataload", String(dataload)),
          this.buildAltitudeField("plc_id", String(plcId)),
        ],
      },
    };

    await altitudeQueue.add("create-contact", {
      environment: "cloud",
      payload,
      genId,
      repository: "minisomCorporate",
    });
  }
}
