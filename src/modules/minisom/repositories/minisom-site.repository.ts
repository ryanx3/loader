import { MinisomDashboardDTO } from "../schemas/minisom-dashboard.schema";

export interface MinisomLoadedContact {
  BD: string;
  TipoBD: string;
  Data: string;
  Carregados: number;
  UC: number;
  Marcacoes: number;
  Appt_UC: number;
  Appt_Carregados: number;
  Tentativas: number;
  SaturationRate: number;
}

export interface MinisomDashboardRow {
  Data: string;
  TipoBD: string;
  BD: string;
  Carregados: number;
  Marcacoes: number;
  Contatos_uteis: number;
  Contatos_fechados: number;
  Virgens: number;
}

export interface MinisomDashboardBd {
  BD: string;
}

export interface MinisomDashboardTipoBD {
  TipoBD: string;
}

export interface MinisomDashboardResponse {
  data: MinisomDashboardRow[];
  bds: MinisomDashboardBd[];
  tipoBDs: MinisomDashboardTipoBD[];
}

export interface MinisomResultsBdType {
  Data: string;
  TipoBD: "CL" | "PC" | "DIGITAL" | "LD";
  Marcacoes: number;
}

export interface MinisomSiteRepository {
  getResultsByBdType: (date: string) => Promise<MinisomResultsBdType[]>;
  getLoadedContacts(): Promise<MinisomLoadedContact[]>;
  getDashboard({
    startDate,
    endDate,
    bd,
    tipoBD,
  }: MinisomDashboardDTO): Promise<MinisomDashboardResponse>;
}
