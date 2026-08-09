import { FtpRepository } from "../../../../core/ftp/ftp.service";
import { LoggerService } from "../../../../core/logger/logger.service";
import { env } from "../../../../env";
import { PlenitudeMssqlRepository } from "../../infra/mssql/plenitude-mssql-repository";
import { PlenitudeRecordingsUseCase } from "../use-cases/send-recordings.use-case";
export function makePlenitudeRecordingsUseCase() {
  const plenitudeRepository = new PlenitudeMssqlRepository();
  const logger = new LoggerService();

  const ftpRepository = new FtpRepository(
    {
      host: env.FTPS_INTERNAL_HOST,
      port: env.FTPS_INTERNAL_PORT,
      user: env.FTPS_INTERNAL_USER,
      password: env.FTPS_INTERNAL_PASSWORD,
      secure: "implicit",
      secureOptions: { rejectUnauthorized: false },
    },
    {
      host: env.SFTP_PLENITUDE_HOST,
      port: env.SFTP_PLENITUDE_PORT,
      username: env.SFTP_PLENITUDE_USER,
      password: env.SFTP_PLENITUDE_PASSWORD,
    },
  );

  return new PlenitudeRecordingsUseCase(
    plenitudeRepository,
    ftpRepository,
    logger,
  );
}
