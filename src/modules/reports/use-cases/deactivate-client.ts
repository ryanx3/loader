import { ReportsRepository } from "../repositories/relatorios.repository";

export class DeactivateClientUseCase {
  constructor(private reportsRepository: ReportsRepository) {}

  async execute(clientName: string) {
    const config = await this.reportsRepository.findByName(clientName);

    if (!config) {
      throw new Error("Client config not found");
    }

    return await this.reportsRepository.deactivateClient(clientName);
  }
}
