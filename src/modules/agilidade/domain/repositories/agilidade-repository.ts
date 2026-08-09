import { AgilidadeLead } from "../entities/lead";

export interface SendRecordingsToClientApiRequest {
  initialDate: string;
  endDate: string;
  includeHistorical?: boolean;
}

export interface RecordingSendLog {
  recording_key: string;
  easycode: number;
  telefone: string;
  bd_id: string;

  file_name: string;
  origem_path: string;

  status: "SUCCESS" | "ERROR";
  error_type?: "SYSTEM" | "API";
  api_response?: string;

  http_status?: number;
}

export interface RecordingRow {
  telefone: string;
  easycode: number;
  resultado: string;
  duracao: number;
  bd_id: string;
  logincontacto: string;
  recording_key: string;
  start_time: Date;
  is_historical: number;
}

export type ContractsLogData = {
  easycode: string;
  lead_id: string;
  colaborador: string;
  marca: string;
  status: string;
  telefone: string;
  email: string;

  data_assinatura?: string | null;
  periodicidade?: string | null;
  valor_ativacao?: number | null;
  mensalidade?: number | null;

  num_beneficiarios: number;

  send_status: "SUCCESS" | "ERROR";

  error_type?: "API" | "SYSTEM" | null;
  api_response?: string | null;
  http_status?: number | null;

  body?: string | null;
};

export interface AllContacts {
  easycode: string;
  bd_id: string;
  resultado: string;
  nome: string;
  enderecoemail: string;
  tel_marcado: string;
  logincontacto: string;
  datacontacto: string;
  inicioguiao?: string | Date;
  forma_pagamento: string;
  banco: string;
  balcao: string;
  conta: string;
  checksum: string;
  dia_debito: string;
  mes_debito: string;
  doc_identificacao: string;
  nif: string;
  morada: string;
  cp1: string;
  cp2: string;
  localidade: string;
  concelho: string;
  q1: string;
  q2: string;
  q3: string;
  obs: string;
  mot_nao_int: string;
}

export interface AdesaoPrincipal {
  nome: string | null;
  marca: string | null;
  data_nascimento: string | Date | null;
  logincontacto: string | null;
  preco: number | string | null;
  sexo: string | null;
}

export interface AdesaoSecundaria {
  nome: string | null;
  data_nascimento: string | Date | null;
  sexo: string | null;
  localidade: string | null;
  produto: string | null;
}

// Linha crua da itr_thread (só os campos que o fluxo de tentativas usa)
export interface CallAttempt {
  itr_global: number;
  contact: string; // = easycode
  start_time: Date;
  termination_state: number;
}

export interface IAgilidadeRepository {
  save(
    lead: AgilidadeLead,
    requestIp: string,
    requestUrl: string,
  ): Promise<void>;
  updateStatus: (gen_id: string, lead_status: string) => Promise<void>;
  getRecordingsByDay(
    data: SendRecordingsToClientApiRequest,
  ): Promise<RecordingRow[]>;
  saveSendRecordingLog: (data: RecordingSendLog) => Promise<void>;
  saveSendContractsLog(data: ContractsLogData): Promise<void>;
  getLeadsParaEnviar(date: string): Promise<AllContacts[]>;
  getAdesaoPrincipal(easycode: string): Promise<AdesaoPrincipal>;
  getAdesoesSecundarias(easycode: string): Promise<AdesaoSecundaria[]>;
  updateLeadId: (easycode: string, lead_id: string) => Promise<void>;

  // --- Fluxo de tentativas (thread) sobre ct_agilidade_leads_fake ---
  // interface
  getAttemptsParaEnviar(
    windowStart: string,
    windowEnd: string,
  ): Promise<CallAttempt[]>;
  getResultadoParaAttempt(
    easycode: string,
    attemptStartTime: Date,
    toleranceSeconds?: number,
  ): Promise<AllContacts | null>;
  getCtFakeByEasycode(easycode: string): Promise<AllContacts | null>;
  getLastSentStatus(easycode: string): Promise<string | null>;
  logSkippedAttempt(
    itr_global: number,
    easycode: string,
    status: string,
  ): Promise<void>;
}
