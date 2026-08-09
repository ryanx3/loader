import { AlreadyExistsError } from "../../../shared/errors/name-already-exists-error";
import {
  CreateReportParams,
  ReportsRepository,
} from "../repositories/relatorios.repository";

export class CreateReportConfigUseCase {
  constructor(private reportsRepository: ReportsRepository) {}

  async execute(data: CreateReportParams) {
    const clientNameAlreadyExists = await this.reportsRepository.findByName(
      data.clientName,
    );

    if (clientNameAlreadyExists) {
      throw new AlreadyExistsError("Report name already exists.");
    }

    await this.reportsRepository.create({
      clientName: data.clientName,
      siteId: data.siteId,
      driveId: data.driveId,
      folderPath: data.folderPath,
      status: data.status,
      foldersByDate: data.foldersByDate,
      machine: data.machine,
      schedule: data.schedule,
    });
  }
}
