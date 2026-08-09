import { NotificationService } from "../../../shared/infra/notification/notification.service";
import { ISharepointRepository } from "../../sharepoint/domain/repositories/sharepoint-repository";
import { ReportsRepository } from "../repositories/relatorios.repository";

export class SendReportUseCase {
  constructor(
    private reportsRepository: ReportsRepository,
    private sharepointRepository: ISharepointRepository,
    private notification: NotificationService,
  ) {}

  private emailRecipients = ["gestao@pluricall.pt", "it.servicos@pluricall.pt"];

  async execute({
    clientName,
    fileName,
    fileBuffer,
  }: {
    clientName: string;
    fileName: string;
    fileBuffer: Buffer;
  }) {
    const config = await this.reportsRepository.findByName(clientName);

    if (!config) {
      throw new Error("Client config not found");
    }

    if (!config.drive_id || !config.folder_path) {
      throw new Error("Invalid SharePoint config");
    }

    const dateFolder = new Date().toISOString().slice(0, 10);

    const basePath = config.folders_by_date
      ? `${config.folder_path}/${dateFolder}`
      : config.folder_path;

    const filePath = `${basePath}/${fileName}`.replace("//", "/");

    try {
      await this.sharepointRepository.uploadFile({
        driveId: config.drive_id,
        filePath,
        fileBuffer,
      });

      await this.reportsRepository.updateStatus({
        id: config.id,
        lastStatus: "SUCCESS",
        error: "",
        fileSize: fileBuffer.length,
      });

      const isMinisomEmail = config.client_name
        .toLowerCase()
        .includes("minisom");
      return await this.notification.send("email", {
        to: isMinisomEmail
          ? "minisom@pluricall.pt, elisabete.correia@pluricall.pt, " +
            this.emailRecipients.join(", ")
          : this.emailRecipients,
        subject: `Relatório enviado - ${clientName} ${new Date().toLocaleString("pt-PT")}`,
        html: `Relatório <strong>${fileName}</strong> enviado com sucesso para o SharePoint do cliente <strong>${clientName}</strong> na pasta <strong>${config.folder_path}</strong>.`,
      });
    } catch (error: any) {
      const isMinisomEmail = config.client_name
        .toLowerCase()
        .includes("minisom");
      await this.reportsRepository.updateStatus({
        id: config.id,
        lastStatus: "ERROR",
        error: error.message,
      });

      await this.notification.send("email", {
        to: isMinisomEmail
          ? "minisom@pluricall.pt, elisabete.correia@pluricall.pt, " +
            this.emailRecipients.join(", ")
          : this.emailRecipients,
        subject: `Erro ao enviar relatório - ${clientName} ${new Date().toLocaleString("pt-PT")}`,
        html: `Relatório <strong>${fileName}</strong> falhou ao ser enviado para o SharePoint do cliente <strong>${clientName}</strong> na pasta <strong>${config.folder_path}</strong>.
        Erro: ${error.message}
        `,
      });

      throw error;
    }
  }
}
