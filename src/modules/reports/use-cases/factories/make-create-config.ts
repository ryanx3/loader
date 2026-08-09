import { MssqlReportsRepository } from "../../repositories/mssql/relatorios.repository";
import { CreateReportConfigUseCase } from "../create-config";

export function makeCreateReportConfigUseCase() {
  const reportsRepository = new MssqlReportsRepository();
  const createReportConfigUseCase = new CreateReportConfigUseCase(
    reportsRepository,
  );

  return createReportConfigUseCase;
}
