import { MinisomSiteRepository } from "../../repositories/minisom-site.repository";

export class MinisomLoadedContactsUseCase {
  constructor(private minisomRepository: MinisomSiteRepository) {}

  async execute() {
    return this.minisomRepository.getLoadedContacts();
  }
}
