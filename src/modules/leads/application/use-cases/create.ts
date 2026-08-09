import { LeadIntegrationRepository } from "../../domain/repositories/lead-integration-repository";
import { LeadMappingRepository } from "../../domain/repositories/lead-mapping-repository";
import { CreateLeadIntegrationDTO } from "../../domain/dtos/create-lead-integration.dto";
import { CreateLeadMappingDTO } from "../../domain/dtos/create-lead-mapping.dto";
import { ValidationError } from "../../../../shared/errors/validation-error";
import { AlreadyExistsError } from "../../../../shared/errors/name-already-exists-error";
import sql from "mssql";
import { connectPluricallDb } from "../../../../shared/infra/db/connect-pluricall";

export interface CreateLeadConfigUseCaseDTO {
  lead: CreateLeadIntegrationDTO;
  mapping: Omit<CreateLeadMappingDTO, "lead_config_id">[];
}

export class CreateLeadConfigUseCase {
  constructor(
    private _leadIntegrationRepository: LeadIntegrationRepository,
    private _leadMappingRepository: LeadMappingRepository,
  ) {}

  async execute({ lead, mapping }: CreateLeadConfigUseCaseDTO) {
    if (!mapping || mapping.length === 0) {
      throw new ValidationError("At least one mapping is required");
    }

    const existClientsWithSameNameCLandEnvironment =
      await this._leadIntegrationRepository.findByNameAndContactList(
        lead.campaign_name,
        lead.contact_list,
        lead.environment,
      );

    if (existClientsWithSameNameCLandEnvironment) {
      throw new AlreadyExistsError(
        "This campaign and contact list already exists",
      );
    }

    const pool = await connectPluricallDb(lead.environment);
    const transaction = new sql.Transaction(pool);

    await transaction.begin();
    try {
      const {
        id: lead_config_id,
        api_key,
        client_name,
      } = await this._leadIntegrationRepository.create(lead);

      const mappingsToSave = mapping.map((map) => ({
        ...map,
        lead_config_id,
        api_key,
      }));

      await this._leadMappingRepository.saveMany(
        lead_config_id,
        mappingsToSave,
      );

      await transaction.commit();

      return { clientName: client_name };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
