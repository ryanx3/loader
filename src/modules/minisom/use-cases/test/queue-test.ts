import { altitudeQueue } from "../../../../shared/infra/queue/altitude/altitude-queue";
import { generateDataload } from "../../../../shared/utils/generators/generate-dataload";
import { generatePlcId } from "../../../../shared/utils/generators/generate-plc-id";
import { MinisomGetPriorityService } from "../../services/get-priority";

interface UploadContactsTest {
  phoneNumber: string | number;
  leadId: any;
  name: any;
  bd: any;
  campaign: any;
  contactList: any;
  origem: any;
  email: any;
  genId: any;
  birthDate: any;
  utmSource: any;
  city: any;
  privacy: any;
  marketing: any;
}

export class MinisomTestUploadContactsUseCase {
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
    leadId,
    name,
    bd,
    email,
    genId,
    utmSource,
    city,
    campaign,
    contactList,
    origem,
    privacy,
    marketing,
  }: UploadContactsTest) {
    const dataload = generateDataload();
    const priority = MinisomGetPriorityService.calculate();
    const plcId = generatePlcId();
    const origemAndSource = `${origem} ${utmSource || ""}`.trim();
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
          this.buildAltitudeField("FirstName", String(name)),
          this.buildAltitudeField("bd", String(bd)),
          this.buildAltitudeField(
            "realizou_exame_tempo",
            String(origemAndSource),
          ),
          this.buildAltitudeField("HomeCity", String(city)),
          this.buildAltitudeField("dataload", String(dataload)),
          this.buildAltitudeField("plc_id", String(plcId)),
          this.buildAltitudeField("Manager", String(privacy)),
          this.buildAltitudeField("Assistant", String(marketing)),
        ],
      },
    };

    console.log(
      "Payload a ser enviado para a fila:",
      JSON.stringify(payload, null, 2),
    );

    await altitudeQueue.add("create-contact", {
      environment: "cloud",
      payload,
      genId,
      repository: "minisomTest",
    });
  }
}
