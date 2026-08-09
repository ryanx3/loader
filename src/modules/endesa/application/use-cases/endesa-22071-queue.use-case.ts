import { altitudeQueue } from "../../../../shared/infra/queue/altitude/altitude-queue";
import { generateDataload } from "../../../../shared/utils/generators/generate-dataload";
import { EndesaLead } from "../../domain/entities/lead";

export class Endesa22071UploadContactsUseCase {
  private buildField(Name: string, Value: any) {
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

  private readonly CONTACT_LIST = "Leads";
  private readonly CAMPAIGN_NAME = "endesa_out_leads";

  async execute(lead: EndesaLead): Promise<void> {
    const dataload = generateDataload();

    const payload = {
      campaignName: this.CAMPAIGN_NAME,
      contactCreateRequest: {
        Status: "Started",
        ContactListName: {
          RequestType: "Set",
          Value: this.CONTACT_LIST,
        },
        Attributes: [
          this.buildField("FirstName", lead.nome),
          this.buildField("MobilePhone", lead.phoneNumber),
          this.buildField("bd_telefone_original", lead.phoneNumber),
          this.buildField("apelido", lead.apelido),
          this.buildField("cp1_inst", String(lead.cp4).substring(0, 4)),
          this.buildField("cp2_inst", String(lead.cp3).substring(0, 3)),
          this.buildField("dtnascimento", lead.dataNascimento),
          this.buildField("madison_obs2", "Comercializadora:  // Origem:"),
          this.buildField("madison_obs3", "LEADS"),
          this.buildField("plc_id", lead.leadId),
          this.buildField("dataload", dataload),
        ],
      },
    };

    await altitudeQueue.add("create-contact", {
      environment: "cloud",
      payload,
      genId: lead.genId,
      repository: "endesa22071",
    });
  }
}
