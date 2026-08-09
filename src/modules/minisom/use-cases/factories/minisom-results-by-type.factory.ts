import { MssqlMinisomSiteRepository } from "../../repositories/mssql-minisom-site.repository";
import { MinisomResultsByTypeUseCase } from "../queries/minisom-results-by-type.use-case";

export function makeMinisomResultsByTypeUseCase() {
  const minisomRepository = new MssqlMinisomSiteRepository();
  const minisomResultsByTypeUseCase = new MinisomResultsByTypeUseCase(
    minisomRepository,
  );

  return minisomResultsByTypeUseCase;
}
