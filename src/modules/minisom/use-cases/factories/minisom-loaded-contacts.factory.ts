import { MssqlMinisomSiteRepository } from "../../repositories/mssql-minisom-site.repository";
import { MinisomLoadedContactsUseCase } from "../queries/minisom-loaded-contacts.use-case";

export function makeMinisomLoadedContactsUseCase() {
  const minisomRepository = new MssqlMinisomSiteRepository();
  const minisomLoadedContactsUseCase = new MinisomLoadedContactsUseCase(
    minisomRepository,
  );

  return minisomLoadedContactsUseCase;
}
