import { EmailChannel } from "../../../../shared/infra/notification/email/email-channel";
import { NotificationService } from "../../../../shared/infra/notification/notification.service";
import { SharepointRepository } from "../../../sharepoint/infra/repositories/sharepoint-repository";
import { MssqlReportsRepository } from "../../repositories/mssql/relatorios.repository";
import { SendReportUseCase } from "../send-reports";

export function makeSendReportUseCase() {
  const reportsRepository = new MssqlReportsRepository();
  const sharepointRepository = new SharepointRepository();
  const emailChannel = new EmailChannel();
  const notificationService = new NotificationService({ email: emailChannel });
  const sendReportUseCase = new SendReportUseCase(
    reportsRepository,
    sharepointRepository,
    notificationService,
  );

  return sendReportUseCase;
}
