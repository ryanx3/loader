import { generateGenId } from "../../../../shared/utils/generators/generate-gen-id";
import { generateNormalizedPhonePT } from "../../../../shared/utils/generators/generate-normalized-phone";
import { EndesaLeadDTO } from "../../domain/dtos/endesa-lead.dto";
import { EndesaLead } from "../../domain/entities/lead";
import { IEndesaRepository } from "../../domain/repositories/endesa-repository";
import { Endesa22071UploadContactsUseCase } from "./endesa-22071-queue.use-case";

export interface Endesa22071Request {
  body: EndesaLeadDTO;
  requestIp: string;
  requestUrl: string;
}

export interface Endesa22071Response {
  status: string;
  statusMsg: string;
  genId: string;
}

export class Endesa22071UseCase {
  constructor(
    private repository: IEndesaRepository,
    private uploadContacts: Endesa22071UploadContactsUseCase,
  ) {}

  async execute({
    body,
    requestIp,
    requestUrl,
  }: Endesa22071Request): Promise<Endesa22071Response> {
    const genId = generateGenId();
    const phoneNumber = generateNormalizedPhonePT(body.telefone);
    const lead = EndesaLead.create(body, genId, phoneNumber);
    await this.repository.save(lead, requestIp, requestUrl);
    this.uploadContacts.execute(lead);

    return {
      status: "OK",
      statusMsg: "Lead loaded with success.",
      genId: lead.genId,
    };
  }
}
