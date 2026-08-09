import { InvalidFormatError } from "../../../../shared/errors/invalid-format";
import { MinisomSiteRepository } from "../../repositories/minisom-site.repository";
import { isValid, parse } from "date-fns";

export class MinisomResultsByTypeUseCase {
  constructor(private minisomRepository: MinisomSiteRepository) {}

  async execute({ date }: { date: string }) {
    const parsedDate = parse(date, "yyyy-MM-dd", new Date());
    if (!isValid(parsedDate)) {
      throw new InvalidFormatError(
        "Data inválida ou formato incorreto. Use yyyy-MM-dd",
      );
    }

    const result = await this.minisomRepository.getResultsByBdType(date);

    return result;
  }
}
