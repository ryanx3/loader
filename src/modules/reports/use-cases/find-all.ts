import { ReportsRepository } from "../repositories/relatorios.repository";

export class FindAllActiveReportsUseCase {
  constructor(private reportsRepository: ReportsRepository) {}

  async execute() {
    const reports = await this.reportsRepository.findAllActive();

    return reports;
  }
}
