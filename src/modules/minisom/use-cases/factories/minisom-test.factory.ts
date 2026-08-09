import { MssqlMinisomRepository } from "../../repositories/mssql-minisom.repository";
import { MinisomTestUseCase } from "../test/minisom-test.use-case";
import { MinisomTestUploadContactsUseCase } from "../test/queue-test";

export function makeMinisomTestUseCase() {
  const minisomRepository = new MssqlMinisomRepository();
  const minisomTestUploadContacts = new MinisomTestUploadContactsUseCase();
  const minisomTestUseCase = new MinisomTestUseCase(
    minisomRepository,
    minisomTestUploadContacts,
  );

  return minisomTestUseCase;
}
