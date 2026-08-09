import { LoggerService } from "../../../../../core/logger/logger.service";
import { agilidadeAuthService } from "../../../../../shared/infra/providers/agilidade/authenticate";
import { AgilidadeSendContractsService } from "../../../../../shared/infra/providers/agilidade/send-contracts";
import { AgilidadeMssqlRepository } from "../../../infra/mssql/agilidade-mssql-repository";
import { AgilidadeContractsLogBuilder } from "../contracts/send-contracts-log.builder";
import { AgilidadeContractsPayloadBuilder } from "../contracts/send-contracts-payload-builder";
import { AgilidadeContractsUseCase } from "../contracts/send-contracts.use-case";

export function makeSendContractsUseCase(): AgilidadeContractsUseCase {
  const repository = new AgilidadeMssqlRepository();
  const apiService = new AgilidadeSendContractsService(agilidadeAuthService);
  const payloadBuilder = new AgilidadeContractsPayloadBuilder();
  const logBuilder = new AgilidadeContractsLogBuilder();
  const loggerService = new LoggerService();

  return new AgilidadeContractsUseCase(
    repository,
    apiService,
    payloadBuilder,
    logBuilder,
    loggerService,
  );
}
