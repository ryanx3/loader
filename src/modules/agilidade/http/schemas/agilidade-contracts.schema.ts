import { z } from "zod";

const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;

const BaseSchema = z.object({
  Id: z.string(),
  PrimeiroNome: z.string(),
  Apelido: z.string(),
  Email: z.string(),
  Telefone: z.string(),
  Marca: z.enum(["Agilcare", "Sorriso+", "SorrisoPrime"]).or(z.literal("")),
  Status: z.enum([
    "Agendada",
    "Não Atendida",
    "Sem Interesse",
    "Exausta",
    "Convertida",
  ]),
  RGPD: z.boolean(),
  NomeColaborador: z.string(),
});

const TitularSchema = z.object({
  PrimeiroNome: z.string(),
  Apelido: z.string(),
  DataNascimento: z.string().regex(dateRegex, "Formato inválido: dd/mm/yyyy"),
  NumeroDocumento: z.string(),
  NIF: z.number(),
  Sexo: z.enum(["Feminino", "Masculino"]).optional(),
  Telefone: z.string(),
  Email: z.string().email(),
  Rua: z.string(),
  CodigoPostal: z.string().regex(/^\d{4}-\d{3}$/, "Formato inválido: xxxx-xxx"),
  Cidade: z.string(),
  Concelho: z.string(),
});

export const BeneficiarioSchema = z.object({
  PrimeiroNome: z.string(),
  Apelido: z.string(),
  DataNascimento: z.string().optional(),
  Sexo: z.enum(["Feminino", "Masculino"]).optional(),
  Cidade: z.string().optional(),
  Produto: z.string(),
  Clinica: z.string().optional(),
});

const ReferenciaSchema = z.object({
  PrimeiroNome: z.string(),
  Apelido: z.string(),
  Telefone: z.string(),
});

const NaoConvertidaSchema = BaseSchema.extend({
  Status: z.enum(["Agendada", "Não Atendida", "Sem Interesse", "Exausta"]),
  MotivoNaoInteresse: z.string().optional(),
});

const ConvertidaSchema = BaseSchema.extend({
  Status: z.literal("Convertida"),
  DataNascimento: z.string().regex(dateRegex, "Formato inválido: dd/mm/yyyy"),
  DataAssinatura: z.string().regex(dateRegex, "Formato inválido: dd/mm/yyyy"),
  ValorAtivacao: z.number().multipleOf(0.01),
  Mensalidade: z.number().multipleOf(0.01),
  Pagamento: z.enum(["Débito Direto", "Transferência"]),
  Periodicidade: z.enum(["Mensal", "Anual"]),
  DataInicio: z.string().regex(dateRegex, "Formato inválido: dd/mm/yyyy"),
  ConcordaCobranca: z.boolean(),
  ConhecimentoCondicoes: z.boolean(),
  InformacoesVerdadeiras: z.boolean(),
  Banco: z.string().optional(),
  Bic: z.string().optional(),
  Iban: z.string().optional(),
  NumeroConta: z.string().optional(),
  Titular: TitularSchema,
  Beneficiarios: z.array(BeneficiarioSchema),
  Referencias: z.array(ReferenciaSchema).optional(),
});

export const sendContractsSchema = z.discriminatedUnion("Status", [
  NaoConvertidaSchema,
  ConvertidaSchema,
]);

export const sendContractSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato inválido: yyyy-mm-dd"),
});

export const sendAttemptsSchema = z.object({
  windowStart: z.string().min(1, "windowStart é obrigatório"),
  windowEnd: z.string().min(1, "windowEnd é obrigatório"),
});

export type NaoConvertidaPayload = z.infer<typeof NaoConvertidaSchema>;
export type MotivoNaoInteresse = NaoConvertidaPayload["MotivoNaoInteresse"];
export type SendContractsPayload = z.infer<typeof sendContractsSchema>;
export type BeneficiarioPayload = z.infer<typeof BeneficiarioSchema>;
