import { FileService } from "../../../../../core/file/file.service";
import { LoggerService } from "../../../../../core/logger/logger.service";
import { LeopardRepository } from "../../../../../migrating/repositories/mssql/mssql-leopard-repository";
import { agilidadeAuthService } from "../../../../../shared/infra/providers/agilidade/authenticate";
import { AgilidadeSendRecordingsService } from "../../../../../shared/infra/providers/agilidade/send-recordings";

import { AgilidadeMssqlRepository } from "../../../infra/mssql/agilidade-mssql-repository";
import { AgilidadeRecordingsUseCase } from "../recordings/send-recordings.use-case";

export function makeAgilidadeRecordingsUseCase(): AgilidadeRecordingsUseCase {
  const repository = new AgilidadeMssqlRepository();
  const leopardRepository = new LeopardRepository();
  const apiService = new AgilidadeSendRecordingsService(agilidadeAuthService);
  const loggerService = new LoggerService();
  const fileService = new FileService();

  return new AgilidadeRecordingsUseCase(
    repository,
    apiService,
    leopardRepository,
    fileService,
    loggerService,
  );
}
