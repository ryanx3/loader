export type LeadEnvironment = "live" | "test";

export interface AgilidadeLeadProps {
  genId: string;
  nome: string;
  telefone: string;
  email: string;
  leadId: string;
  distId: string;
  dataEntrada: string;
  dataPedido: string;
  localidade: string;
  adId: string;
  adsetId: string;
  campaignId: string;
  adName: string;
  adsetName: string;
  campaignName: string;
  formId: string;
  marca: string;
  phoneNumber: string;
  leadSource: string;
  contactList: string;
  environment: LeadEnvironment;
}
