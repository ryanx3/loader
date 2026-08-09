import { MssqlMinisomSiteRepository } from "../../repositories/mssql-minisom-site.repository";
import { MinisomDashboardUseCase } from "../queries/minisom-dashboard.use-case";

export function makeMinisomDashboardUseCase() {
  const minisomRepository = new MssqlMinisomSiteRepository();
  const minisomDashboardUseCase = new MinisomDashboardUseCase(
    minisomRepository,
  );

  return minisomDashboardUseCase;
}
