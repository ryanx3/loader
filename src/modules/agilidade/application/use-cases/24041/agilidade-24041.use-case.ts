import { UnauthorizedError } from "../../../../../shared/errors/unauthorized-error";
import { generateGenId } from "../../../../../shared/utils/generators/generate-gen-id";
import { generateNormalizedPhonePT } from "../../../../../shared/utils/generators/generate-normalized-phone";
import { AgilidadeLeadDTO } from "../../../domain/dtos/agilidade-lead.dto";
import { AgilidadeLead } from "../../../domain/entities/lead";
import { IAgilidadeRepository } from "../../../domain/repositories/agilidade-repository";
import { Agilidade24041UploadContactsUseCase } from "./agilidade-24041-queue.use-case";

export interface Agilidade24041Request {
  body: AgilidadeLeadDTO;
  requestIp: string;
  requestUrl: string;
  token: string;
}

export interface Agilidade24041Response {
  status: string;
  statusMsg: string;
  genId: string;
}

export class Agilidade24041UseCase {
  constructor(
    private repository: IAgilidadeRepository,
    private uploadContacts: Agilidade24041UploadContactsUseCase,
  ) {}

  async execute({
    body,
    requestIp,
    requestUrl,
    token,
  }: Agilidade24041Request): Promise<Agilidade24041Response> {
    if (!AgilidadeLead.validateToken(token)) {
      throw new UnauthorizedError("Unauthorized");
    }

    const genId = generateGenId();
    const phoneNumber = generateNormalizedPhonePT(body.telefone);
    const lead = AgilidadeLead.create(body, token, genId, phoneNumber);
    await this.repository.save(lead, requestIp, requestUrl);
    this.uploadContacts.execute(lead);

    return {
      status: "OK",
      statusMsg: "Lead loaded with success.",
      genId: lead.genId,
    };
  }
}
