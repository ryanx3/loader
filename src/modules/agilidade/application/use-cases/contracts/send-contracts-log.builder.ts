import { SendContractsPayload } from "../../../http/schemas/agilidade-contracts.schema";

export class AgilidadeContractsLogBuilder {
  build(payload: SendContractsPayload, easycode: string) {
    if (payload.Status === "Convertida") {
      return {
        easycode,
        lead_id: payload.Id,
        colaborador: payload.NomeColaborador,
        marca: payload.Marca,
        status: payload.Status,
        telefone: payload.Telefone,
        email: payload.Email,
        data_assinatura: payload.DataAssinatura,
        periodicidade: payload.Periodicidade,
        valor_ativacao: payload.ValorAtivacao,
        mensalidade: payload.Mensalidade,
        num_beneficiarios: payload.Beneficiarios.length,
      };
    }

    return {
      easycode,
      lead_id: payload.Id,
      colaborador: payload.NomeColaborador,
      marca: payload.Marca,
      status: payload.Status,
      telefone: payload.Telefone,
      email: payload.Email,
      data_assinatura: null,
      periodicidade: null,
      valor_ativacao: null,
      mensalidade: null,
      num_beneficiarios: 0,
    };
  }
}
