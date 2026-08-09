import { altitudeQueue } from "../../../../../shared/infra/queue/altitude/altitude-queue";
import { generateDataload } from "../../../../../shared/utils/generators/generate-dataload";
import { AgilidadeLead } from "../../../domain/entities/lead";

export class Agilidade24041UploadContactsUseCase {
  private buildField(Name: string, Value: any) {
    if (Name === "FirstName" && typeof Value === "string") {
      Value = Value.substring(0, 100);
    }

    if (Name === "MobilePhone" || Name === "HomePhone" || Name === "telefone") {
      Value = String(Value ?? "").slice(-9);
    }

    return {
      discriminator: "DatabaseFields",
      Name,
      Value: Value ?? "",
      IsAnonymized: false,
    };
  }

  async execute(lead: AgilidadeLead): Promise<void> {
    const dataload = generateDataload();

    const payload = {
      campaignName: "agilidade_leads",
      contactCreateRequest: {
        Status: "Started",
        ContactListName: {
          RequestType: "Set",
          Value: lead.contactList,
        },
        Attributes: [
          this.buildField("HomePhone", lead.phoneNumber),
          this.buildField("telefone", lead.phoneNumber),
          this.buildField("enderecoemail", lead.email),
          this.buildField("nome", lead.nome),
          this.buildField("FirstName", lead.nome),
          this.buildField("localidade", lead.localidade),
          this.buildField("bd_id", lead.leadId),
          this.buildField("bd_created_time", lead.dataEntrada),
          this.buildField("bd_ad_id", lead.adId),
          this.buildField("bd_ad_name", lead.adName),
          this.buildField("bd_adset_id", lead.adsetId),
          this.buildField("bd_adset_name", lead.adsetName),
          this.buildField("bd_campaign_id", lead.campaignId),
          this.buildField("bd_campaign_name", lead.campaignName),
          this.buildField("bd_form_id", lead.formId),
          this.buildField("plc_id", lead.genId),
          this.buildField("dataload", dataload),
          this.buildField("bd_campaign_name", lead.leadSource),
        ],
      },
    };

    await altitudeQueue.add("create-contact", {
      environment: "onprem",
      payload,
      genId: lead.genId,
      repository: "agilidade24041",
    });
  }
}
