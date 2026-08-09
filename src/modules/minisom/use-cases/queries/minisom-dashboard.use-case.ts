import { InvalidFormatError } from "../../../../shared/errors/invalid-format";
import { MinisomSiteRepository } from "../../repositories/minisom-site.repository";
import { format, isValid, parse, startOfMonth } from "date-fns";
import { MinisomDashboardDTO } from "../../schemas/minisom-dashboard.schema";

export class MinisomDashboardUseCase {
  constructor(private minisomRepository: MinisomSiteRepository) {}

  async execute(dto: MinisomDashboardDTO) {
    const today = new Date();

    const startDate =
      dto.startDate ?? format(startOfMonth(today), "yyyy-MM-dd");
    const endDate = dto.endDate ?? format(today, "yyyy-MM-dd");

    const parsedStart = parse(startDate, "yyyy-MM-dd", new Date());
    const parsedEnd = parse(endDate, "yyyy-MM-dd", new Date());

    if (!isValid(parsedStart) || !isValid(parsedEnd)) {
      throw new InvalidFormatError(
        "Data inválida ou formato incorreto. Use yyyy-MM-dd",
      );
    }

    if (parsedStart > parsedEnd) {
      throw new InvalidFormatError(
        "startDate não pode ser posterior a endDate",
      );
    }

    return this.minisomRepository.getDashboard({
      ...dto,
      startDate,
      endDate,
    });
  }
}
