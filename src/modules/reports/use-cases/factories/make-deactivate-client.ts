import { MssqlReportsRepository } from "../../repositories/mssql/relatorios.repository";
import { DeactivateClientUseCase } from "../deactivate-client";

export function makeDeactivateClientUseCase() {
  const repository = new MssqlReportsRepository();

  return new DeactivateClientUseCase(repository);
}
