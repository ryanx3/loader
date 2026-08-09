import { ArtelecomReportService } from "../../../../shared/infra/providers/artelecom/artelecom-report.service";
import { NotificationService } from "../../../../shared/infra/notification/notification.service";
import { MssqlVmOutRepository } from "../../infra/repositories/mssql/vm-out-mssql.repository";
import { VmOutUseCase } from "../vm-out.use-case";
import { EmailChannel } from "../../../../shared/infra/notification/email/email-channel";

export function makeVmOutUseCase(): VmOutUseCase {
  const repository = new MssqlVmOutRepository();
  const emailChannel = new EmailChannel();
  const notificationService = new NotificationService({ email: emailChannel });
  const artelecomReportService = new ArtelecomReportService();

  return new VmOutUseCase(
    repository,
    notificationService,
    artelecomReportService,
  );
}
