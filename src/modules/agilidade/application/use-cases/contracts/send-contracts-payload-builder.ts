import {
  AdesaoPrincipal,
  AdesaoSecundaria,
  AllContacts,
} from "../../../domain/repositories/agilidade-repository";
import {
  MotivoNaoInteresse,
  NaoConvertidaPayload,
  SendContractsPayload,
} from "../../../http/schemas/agilidade-contracts.schema";

export class AgilidadeContractsPayloadBuilder {
  buildPayloadConvertida(
    ct: AllContacts,
    principal: AdesaoPrincipal,
    secundarios: AdesaoSecundaria[],
  ): SendContractsPayload {
    return {
      Id: ct.bd_id ?? "",
      PrimeiroNome: principal.nome ?? "",
      Apelido: "",
      Email: ct.enderecoemail ?? "",
      Telefone: String(ct.tel_marcado),
      Marca: this.mapMarca(principal.marca),
      DataNascimento: this.formatDateToApi(principal.data_nascimento),
      Status: "Convertida",
      RGPD: false,
      NomeColaborador: ct.logincontacto,
      DataAssinatura: this.formatDateToApi(ct.datacontacto),
      ValorAtivacao: Number(principal.preco),
      Mensalidade: Number(principal.preco),
      Pagamento: "Débito Direto",
      Periodicidade: this.mapPeriodicidade(ct.forma_pagamento),
      Banco: ct.banco ?? "",
      Bic: ct.balcao ?? "",
      Iban: this.buildIban(ct),
      NumeroConta: ct.conta ?? "",
      DataInicio: this.formatDebito(ct),
      ConcordaCobranca: ct.q1 === "Sim",
      ConhecimentoCondicoes: ct.q2 === "Sim",
      InformacoesVerdadeiras: ct.q3 === "Sim",
      Titular: {
        PrimeiroNome: principal.nome ?? "",
        Apelido: "",
        DataNascimento: this.formatDateToApi(principal.data_nascimento),
        NumeroDocumento: String(ct.doc_identificacao),
        NIF: Number(ct.nif),
        Sexo: this.mapSexo(principal.sexo),
        Telefone: String(ct.tel_marcado),
        Email: ct.enderecoemail ?? "",
        Rua: ct.morada,
        CodigoPostal: `${ct.cp1}-${ct.cp2}`,
        Cidade: ct.localidade,
        Concelho: ct.concelho,
      },
      Beneficiarios: secundarios.map((ad) => ({
        PrimeiroNome: ad.nome ?? "",
        Apelido: "",
        DataNascimento: this.formatDateToApi(ad.data_nascimento),
        Sexo: this.mapSexo(ad.sexo),
        Cidade: ad.localidade ?? undefined,
        Produto: ad.produto ?? "",
      })),
      Referencias: [{ PrimeiroNome: ct.nome ?? "", Apelido: "", Telefone: "" }],
    };
  }

  buildPayloadNaoConvertida(
    ct: any,
    status: NaoConvertidaPayload["Status"],
  ): NaoConvertidaPayload {
    let motivo: MotivoNaoInteresse;
    let rgpd = false;

    switch (ct.resultado) {
      case "3":
        motivo = ct.mot_nao_int;
        break;
      case "E":
        motivo = "Nº Errado";
        break;
      case "M":
        motivo = "Excesso de Tentativas";
        break;
      case "Y":
        motivo = "Não quer ser mais contactado";
        break;
      case "Z":
        motivo = "Não quer ser mais contactado";
        rgpd = true;
        break;
      case "Q":
        motivo = "Não tem interesse";
        break;
      case "C":
        motivo = "Pensava que era Clinica";
        break;
    }

    return {
      Id: ct.bd_id ?? "",
      PrimeiroNome: ct.nome ?? "",
      Apelido: "",
      Email: ct.enderecoemail ?? "",
      Telefone: ct.tel_marcado ? String(ct.tel_marcado) : "",
      Marca: "",
      Status: status,
      MotivoNaoInteresse: motivo,
      RGPD: rgpd,
      NomeColaborador: ct.logincontacto ?? "Sistema",
    };
  }

  mapStatus(resultado: string): NaoConvertidaPayload["Status"] {
    switch (resultado) {
      case "2":
      case "I":
        return "Agendada";

      case "3":
      case "E":
      case "M":
      case "Q":
      case "C":
        return "Sem Interesse";

      case "Y":
      case "Z":
        return "Exausta";

      default:
        return "Não Atendida";
    }
  }

  private mapSexo(sexo: string | null): "Feminino" | "Masculino" | undefined {
    if (sexo === "F") return "Feminino";
    if (sexo === "M") return "Masculino";
    return undefined;
  }

  private mapPeriodicidade(value: string | null): "Mensal" | "Anual" {
    return value?.toUpperCase() === "ANUAL" ? "Anual" : "Mensal";
  }

  private mapMarca(
    marca: string | null,
  ): "" | "Agilcare" | "Sorriso+" | "SorrisoPrime" {
    const allowed = ["Agilcare", "Sorriso+", "SorrisoPrime"];
    return allowed.includes(marca ?? "") ? (marca as any) : "";
  }

  private buildIban(ct: any): string {
    return `PT50${ct.banco}${ct.balcao}${ct.conta}${ct.checksum}`;
  }

  private formatDateToApi(date: string | Date | null | undefined): string {
    if (!date) return "";
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  private formatDebito(ct: any): string {
    if (!ct.dia_debito || !ct.mes_debito) return "";
    const year = new Date(ct.datacontacto).getFullYear();
    const month = String(ct.mes_debito).padStart(2, "0");
    const day = String(ct.dia_debito).padStart(2, "0");
    return `${day}/${month}/${year}`;
  }
}
