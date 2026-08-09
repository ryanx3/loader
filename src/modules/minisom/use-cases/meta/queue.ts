import { altitudeQueue } from "../../../../shared/infra/queue/altitude/altitude-queue";
import { generateDataload } from "../../../../shared/utils/generators/generate-dataload";
import { generatePlcId } from "../../../../shared/utils/generators/generate-plc-id";
import { MinisomGetPriorityService } from "../../services/get-priority";

interface UploadContactsMeta {
  phoneNumber: string | number;
  name: any;
  bd: any;
  email: any;
  genId: any;
  campaign: any;
  contactList: any;
  leadId: any;
}

export class MinisomMetaUploadContactsUseCase {
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
    name,
    bd,
    email,
    genId,
    campaign,
    contactList,
    leadId,
  }: UploadContactsMeta) {
    const dataload = generateDataload();
    const priority = MinisomGetPriorityService.calculate();
    const plcId = generatePlcId();

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
        ContactListName: {
          RequestType: "Set",
          Value: contactList,
        },
        Priority: {
          RequestType: "Set",
          Value: priority,
        },
        Attributes: [
          this.buildAltitudeField(fieldToLoadPhoneNumber, phoneNumber),
          this.buildAltitudeField("id_cliente", String(leadId)),
          this.buildAltitudeField("Email1", String(email)),
          this.buildAltitudeField("bd", String(bd)),
          this.buildAltitudeField("dataload", String(dataload)),
          this.buildAltitudeField("plc_id", String(plcId)),
          this.buildAltitudeField("FirstName", String(name)),
        ],
      },
    };

    await altitudeQueue.add("create-contact", {
      environment: "cloud",
      payload,
      genId,
      repository: "minisomMeta",
    });
  }
}
