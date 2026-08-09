import { SendContractsPayload } from "../../../http/schemas/agilidade-contracts.schema";

export enum TerminationState {
  NoValue = -1,
  Handled = 1,
  Busy = 2,
  Machine = 3,
  NoAnswer = 4,
  Nuisance = 5,
  Abandoned = 6,
  Rejected = 7,
  InvalidNumber = 8,
  Overflow = 9,
  TrunkLineOverflow = 10,
  Redirected = 11,
  Modem = 12,
  Fax = 13,
  Discarded = 14,
  Routed = 15,
  AbortedByAgentLost = 16,
  Canceled = 17,
  ReEnqueued = 18,
}

// Tradução dos termination_state da itr_thread.
// Hoje TODOS mapeiam pra "Não Atendida" (decisão atual do negócio),
// mas fica pronta pra diferenciar no futuro sem mexer no use case.
// Handled (1) não entra aqui: quando Handled, quem manda é ct.resultado (mapStatus), não essa tabela.
export const TERMINATION_STATE_MAP: Record<
  number,
  SendContractsPayload["Status"]
> = {
  [TerminationState.NoValue]: "Não Atendida",
  [TerminationState.Busy]: "Não Atendida",
  [TerminationState.Machine]: "Não Atendida",
  [TerminationState.NoAnswer]: "Não Atendida",
  [TerminationState.Nuisance]: "Não Atendida",
  [TerminationState.Abandoned]: "Não Atendida",
  [TerminationState.Rejected]: "Não Atendida",
  [TerminationState.InvalidNumber]: "Não Atendida",
  [TerminationState.Overflow]: "Não Atendida",
  [TerminationState.TrunkLineOverflow]: "Não Atendida",
  [TerminationState.Redirected]: "Não Atendida",
  [TerminationState.Modem]: "Não Atendida",
  [TerminationState.Fax]: "Não Atendida",
  [TerminationState.Discarded]: "Não Atendida",
  [TerminationState.Routed]: "Não Atendida",
  [TerminationState.AbortedByAgentLost]: "Não Atendida",
  [TerminationState.Canceled]: "Não Atendida",
  [TerminationState.ReEnqueued]: "Não Atendida",
};
