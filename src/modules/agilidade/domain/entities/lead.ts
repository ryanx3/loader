import { AgilidadeLeadDTO } from "../dtos/agilidade-lead.dto";
import { AgilidadeLeadProps, LeadEnvironment } from "./lead-types";

export class AgilidadeLead {
  readonly genId: string;
  readonly nome: string;
  readonly telefone: string;
  readonly email: string;
  readonly leadId: string;
  readonly distId: string;
  readonly dataEntrada: string;
  readonly dataPedido: string;
  readonly localidade: string;
  readonly adId: string;
  readonly adsetId: string;
  readonly campaignId: string;
  readonly adName: string;
  readonly adsetName: string;
  readonly campaignName: string;
  readonly formId: string;
  readonly leadSource: string;
  readonly marca: string;
  readonly phoneNumber: string;
  readonly contactList: string;
  readonly environment: LeadEnvironment;

  private static readonly API_KEY_LIVE = "GjAX34L3FayNAfgHNjNKmiMyebHo7L";
  private static readonly API_KEY_TEST = "fF7MBxxEJnD6884Db3mEtf6jBBo5cf";

  private static readonly CONTACT_LIST_LIVE = "AutoLoad_IMPROVEBYTECH";
  private static readonly CONTACT_LIST_TEST = "AutoLoad_TESTES";

  private constructor(props: AgilidadeLeadProps) {
    this.genId = props.genId;
    this.nome = props.nome;
    this.telefone = props.telefone;
    this.email = props.email;
    this.leadId = props.leadId;
    this.distId = props.distId;
    this.dataEntrada = props.dataEntrada;
    this.dataPedido = props.dataPedido;
    this.localidade = props.localidade;
    this.adId = props.adId;
    this.adsetId = props.adsetId;
    this.campaignId = props.campaignId;
    this.adName = props.adName;
    this.adsetName = props.adsetName;
    this.campaignName = props.campaignName;
    this.formId = props.formId;
    this.marca = props.marca;
    this.phoneNumber = props.phoneNumber;
    this.contactList = props.contactList;
    this.environment = props.environment;
    this.leadSource = props.leadSource;
  }

  static validateToken(token: string): boolean {
    return (
      token === AgilidadeLead.API_KEY_LIVE ||
      token === AgilidadeLead.API_KEY_TEST
    );
  }

  static resolveContactList(token: string): string {
    return token === AgilidadeLead.API_KEY_LIVE
      ? AgilidadeLead.CONTACT_LIST_LIVE
      : AgilidadeLead.CONTACT_LIST_TEST;
  }

  static resolveEnvironment(token: string): LeadEnvironment {
    return token === AgilidadeLead.API_KEY_LIVE ? "live" : "test";
  }

  static create(
    dto: AgilidadeLeadDTO,
    token: string,
    genId: string,
    phoneNumber: string,
  ): AgilidadeLead {
    if (!AgilidadeLead.validateToken(token)) {
      throw new Error("Unauthorized");
    }

    return new AgilidadeLead({
      genId,
      nome: dto.nome.trim(),
      telefone: dto.telefone,
      email: dto.email?.trim() ?? "",
      leadId: dto.leadId ?? "",
      distId: dto.distId ?? "",
      dataEntrada: dto.dataEntrada ?? "",
      dataPedido: dto.dataPedido ?? "",
      localidade: dto.localidade ?? "",
      adId: dto.adId ?? "",
      adsetId: dto.adsetId ?? "",
      campaignId: dto.campaignId ?? "",
      adName: dto.horario ?? "",
      adsetName: dto.adsetName ?? "",
      campaignName: dto.marca ?? "",
      formId: dto.formId ?? "",
      marca: dto.marca ?? "",
      leadSource: dto.leadSource ?? "",
      phoneNumber,
      contactList: AgilidadeLead.resolveContactList(token),
      environment: AgilidadeLead.resolveEnvironment(token),
    });
  }
}
