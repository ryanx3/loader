import { AltitudeCreateContact } from "../../../../shared/infra/providers/altitude/create-contact.service";
import { AltitudeUploadContact } from "../../../../shared/infra/providers/altitude/upload-contact.service";
import { AltitudeApiError } from "../../../../shared/errors/altitude-error";
import { LeadIntegration } from "../../domain/entities/lead-integration";
import { LeadLogsRepository } from "../../domain/repositories/lead-logs-repository";
import { LeadMappingRepository } from "../../domain/repositories/lead-mapping-repository";
import { AltitudeEnvironment } from "../../../../shared/infra/providers/altitude/utils/resolve-altitude-config";
import { generatePlcId } from "../../../../shared/utils/generators/generate-plc-id";

export interface LeadLoadResult {
  lead: any;
  success: boolean;
  error?: string;
}

export class LoadLeadsUseCase {
  private MAX_PARALLEL = 500;

  constructor(
    private leadLogsRepository: LeadLogsRepository,
    private leadMappingRepository: LeadMappingRepository,
    private createContact: AltitudeCreateContact,
    private uploadContact: AltitudeUploadContact,
  ) {}

  private normalizePhone(value: unknown): string {
    if (value === null || value === undefined) return "";

    let normalized = String(value).replace(/\D/g, "");

    if (normalized.startsWith("351")) {
      normalized = normalized.slice(3);
    }

    return normalized;
  }

  private normalizeLead(lead: any, mapping: any[]) {
    const normalizedLead = { ...lead };

    for (const m of mapping) {
      if (m.is_phone_number && normalizedLead[m.source_field]) {
        normalizedLead[m.source_field] = this.normalizePhone(
          normalizedLead[m.source_field],
        );
      }
    }

    return normalizedLead;
  }

  async execute(
    client: LeadIntegration,
    leads: any[],
  ): Promise<LeadLoadResult[]> {
    const dataload = new Date().toISOString().split("T")[0];
    const plc_id = generatePlcId();

    const mapping = await this.leadMappingRepository.findByLeadConfigId(
      client.id,
    );

    if (!mapping || mapping.length === 0)
      throw new Error("Missing field mapping");

    const results: LeadLoadResult[] = [];

    const validatedLeads = leads.map((lead) => {
      const errors: string[] = [];

      for (const map of mapping) {
        if (map.is_required && !lead[map.source_field]) {
          errors.push(`Missing required field: ${map.source_field}`);
        }
      }

      const allowedFields = new Set(mapping.map((m) => m.source_field));
      const extraFields = Object.keys(lead).filter(
        (k) => !allowedFields.has(k),
      );

      if (extraFields.length > 0) {
        errors.push(`Unknown fields sent: ${extraFields.join(", ")}`);
      }

      return { lead, errors };
    });

    const validLeads = validatedLeads.filter((l) => l.errors.length === 0);
    const invalidLeads = validatedLeads.filter((l) => l.errors.length > 0);

    for (const il of invalidLeads) {
      results.push({
        lead: il.lead,
        success: false,
        error: il.errors.join("; "),
      });

      await this.leadLogsRepository.save({
        lead_config_id: client.id,
        received_payload: JSON.stringify(il.lead),
        altitude_payload: "{}",
        altitude_response: null,
        success: false,
        error_message: il.errors.join("; "),
      });
    }

    if (validLeads.length === 0) return results;

    if (validLeads.length === 1) {
      const originalLead = validLeads[0].lead;
      const normalizedLead = this.normalizeLead(originalLead, mapping);

      const attributes = mapping.map((m) => ({
        discriminator: "Attribute",
        Name: m.altitude_field,
        Value: normalizedLead[m.source_field] ?? "",
        IsAnonymized: false,
      }));

      const hasPlcId = mapping.some(
        (m) => m.altitude_field === "plc_id" && normalizedLead[m.source_field],
      );

      attributes.push({
        discriminator: "Attribute",
        Name: "dataload",
        Value: dataload,
        IsAnonymized: false,
      });

      if (!hasPlcId) {
        attributes.push({
          discriminator: "Attribute",
          Name: "plc_id",
          Value: plc_id,
          IsAnonymized: false,
        });
      }

      const payload = {
        campaignName: client.campaign_name,
        contactCreateRequest: {
          discriminator: "ContactCreateRequest",
          Status: client.default_status,
          ContactListName: { RequestType: "Set", Value: client.contact_list },
          Attributes: attributes,
        },
      };

      try {
        const response = await this.createContact.execute({
          payload,
          environment: client.environment as AltitudeEnvironment,
        });

        results.push({ lead: originalLead, success: true });

        await this.leadLogsRepository.save({
          lead_config_id: client.id,
          received_payload: JSON.stringify(originalLead),
          altitude_payload: JSON.stringify({
            normalizedLead,
            payload,
          }),
          altitude_response: JSON.stringify(response),
          success: true,
        });
      } catch (err: any) {
        const errorMessage =
          err instanceof AltitudeApiError
            ? `Altitude: ${err.message}`
            : err.message;

        results.push({
          lead: originalLead,
          success: false,
          error: errorMessage,
        });

        await this.leadLogsRepository.save({
          lead_config_id: client.id,
          received_payload: JSON.stringify(originalLead),
          altitude_payload: JSON.stringify({
            normalizedLead,
            payload,
          }),
          altitude_response: null,
          success: false,
          error_message: errorMessage,
        });
      }

      return results;
    }

    const batches: any[][] = [];
    for (let i = 0; i < validLeads.length; i += this.MAX_PARALLEL) {
      batches.push(validLeads.slice(i, i + this.MAX_PARALLEL));
    }

    for (const batch of batches) {
      const requests = batch.map(({ lead }) => {
        const normalizedLead = this.normalizeLead(lead, mapping);

        const attributes = mapping.map((m) => ({
          discriminator: "Attribute",
          Name: m.altitude_field,
          Value: normalizedLead[m.source_field] ?? "",
          IsAnonymized: false,
        }));

        attributes.push({
          discriminator: "Attribute",
          Name: "dataload",
          Value: dataload,
          IsAnonymized: false,
        });

        const hasPlcId = attributes.some((attr) => attr.Name === "plc_id");

        if (!hasPlcId) {
          attributes.push({
            discriminator: "Attribute",
            Name: "plc_id",
            Value: plc_id,
            IsAnonymized: false,
          });
        }

        return {
          originalLead: lead,
          normalizedLead,
          request: {
            RequestType: "Insert",
            Value: {
              discriminator: "ContactUploadRequest",
              ContactStatus: { Value: client.default_status },
              ContactListName: {
                RequestType: "Set",
                Value: client.contact_list,
              },
              Attributes: attributes,
            },
          },
        };
      });

      try {
        const resp = await this.uploadContact.execute({
          payload: {
            campaignName: client.campaign_name,
            requests: requests.map((r) => r.request),
          },
          environment: client.environment as AltitudeEnvironment,
        });

        for (const r of requests) {
          results.push({ lead: r.originalLead, success: true });

          await this.leadLogsRepository.save({
            lead_config_id: client.id,
            received_payload: JSON.stringify(r.originalLead),
            altitude_payload: JSON.stringify({
              normalizedLead: r.normalizedLead,
              payload: r.request,
            }),
            altitude_response: JSON.stringify(resp),
            success: true,
          });
        }
      } catch (err: any) {
        const errorMessage =
          err instanceof AltitudeApiError
            ? `Altitude: ${err.details?.message || err.message}`
            : err.message;

        for (const r of requests) {
          results.push({
            lead: r.originalLead,
            success: false,
            error: errorMessage,
          });

          await this.leadLogsRepository.save({
            lead_config_id: client.id,
            received_payload: JSON.stringify(r.originalLead),
            altitude_payload: JSON.stringify({
              normalizedLead: r.normalizedLead,
              payload: r.request,
            }),
            altitude_response: null,
            success: false,
            error_message: errorMessage,
          });
        }
      }
    }

    return results;
  }
}
