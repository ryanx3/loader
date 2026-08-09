import { MssqlReportsRepository } from "../../repositories/mssql/relatorios.repository";
import { FindAllActiveReportsUseCase } from "../find-all";

export function makeFindAllActiveReportsUseCase() {
  const repository = new MssqlReportsRepository();

  return new FindAllActiveReportsUseCase(repository);
}
