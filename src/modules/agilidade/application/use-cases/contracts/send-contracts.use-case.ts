import { IAgilidadeRepository } from "../../../domain/repositories/agilidade-repository";
import { ILogger } from "../../../../../core/logger/interfaces/logger.types";
import {
  SendContractsPayload,
  sendContractsSchema,
} from "../../../http/schemas/agilidade-contracts.schema";
import {
  AgilidadeSendContractsService,
  SendContractsResponse,
} from "../../../../../shared/infra/providers/agilidade/send-contracts";
import { AgilidadeContractsPayloadBuilder } from "./send-contracts-payload-builder";
import { AgilidadeContractsLogBuilder } from "./send-contracts-log.builder";
import { TerminationState } from "./termination-state";

interface ExecuteBatchDTO {
  date: string;
}

interface ExecuteDTO {
  payload: SendContractsPayload;
  easycode: string;
}

interface ExecuteAttemptsBatchDTO {
  windowStart: string;
  windowEnd: string;
}

interface BatchResult {
  total: number;
  success: number;
  failed: number;
  errors: Array<{ easycode: string; reason: string }>;
}

interface Attempt {
  itr_global: number;
  contact: string;
  start_time: Date;
  termination_state: number;
}

export class AgilidadeContractsUseCase {
  constructor(
    private agilidadeRepository: IAgilidadeRepository,
    private agilidadeApiService: AgilidadeSendContractsService,
    private payloadBuilder: AgilidadeContractsPayloadBuilder,
    private logBuilder: AgilidadeContractsLogBuilder,
    private logger: ILogger,
  ) {}

  async executeBatch({ date }: ExecuteBatchDTO): Promise<BatchResult> {
    const leads = await this.agilidadeRepository.getLeadsParaEnviar(date);
    const results = this.emptyResult(leads.length);

    for (const ct of leads) {
      await this.track(results, ct.easycode, async () => {
        const status = this.payloadBuilder.mapStatus(ct.resultado);
        await this.processContract(ct.easycode, status, ct);
      });
    }

    return results;
  }

  // ==========================================================
  // Fluxo de tentativas (thread + ct_agilidade_leads_fake).
  //
  // Regra: a ct é sempre o resultado MAIS ATUAL de um easycode —
  // quando há mais de um Handled pro mesmo contato (ex.: agendamento
  // às 11h, venda às 12h), a ct já reflete só o último. Por isso NÃO
  // tentamos correlacionar cada attempt individual por proximidade de
  // horário (isso já se mostrou não confiável — inicioguiao pode
  // divergir do start_time do Handled mais recente por minutos).
  //
  // Em vez disso, por easycode dentro da janela:
  //   - Se existe QUALQUER Handled entre os attempts -> status vem de
  //     mapStatus(ct.resultado), seja qual for o Handled que gerou isso.
  //   - Se não existe nenhum Handled -> "Não Atendida".
  //
  // No máximo um envio por easycode por execução. O skip por último
  // status enviado continua garantindo que não reenviamos repetido
  // entre janelas diferentes.
  // ==========================================================

  async executeAttemptsBatch({
    windowStart,
    windowEnd,
  }: ExecuteAttemptsBatchDTO): Promise<BatchResult> {
    const attempts: Attempt[] =
      await this.agilidadeRepository.getAttemptsParaEnviar(
        windowStart,
        windowEnd,
      );

    const byEasycode = attempts.reduce<Record<string, Attempt[]>>((acc, a) => {
      (acc[a.contact] ??= []).push(a);
      return acc;
    }, {});

    const easycodes = Object.keys(byEasycode);
    const results = this.emptyResult(easycodes.length);

    for (const easycode of easycodes) {
      const contactAttempts = byEasycode[easycode];
      const lastAttempt = contactAttempts.sort(
        (a, b) => +a.start_time - +b.start_time,
      )[contactAttempts.length - 1];

      await this.track(results, easycode, async () => {
        const resolved = await this.resolveStatusAndCt(
          contactAttempts,
          easycode,
        );
        if (!resolved) return;

        const { status, ct } = resolved;

        const lastStatus =
          await this.agilidadeRepository.getLastSentStatus(easycode);
        if (lastStatus === status) {
          await this.agilidadeRepository.logSkippedAttempt(
            lastAttempt.itr_global,
            easycode,
            status,
          );
          return;
        }

        await this.processContract(easycode, status, ct);
      });
    }

    return results;
  }

  private async resolveStatusAndCt(
    attempts: Attempt[],
    easycode: string,
  ): Promise<{ status: SendContractsPayload["Status"]; ct: any } | null> {
    const ct = await this.agilidadeRepository.getCtFakeByEasycode(easycode);

    if (!ct) {
      this.logger.warn(
        { easycode },
        "Sem dados de contato para montar payload. Pulando...",
      );
      return null;
    }

    const hasHandled = attempts.some(
      (a) => a.termination_state === TerminationState.Handled,
    );

    if (hasHandled) {
      return { status: this.payloadBuilder.mapStatus(ct.resultado), ct };
    }

    return { status: "Não Atendida", ct: { ...ct, resultado: "F" } };
  }

  private emptyResult(total: number): BatchResult {
    return { total, success: 0, failed: 0, errors: [] };
  }

  private async track(
    results: BatchResult,
    easycode: string,
    fn: () => Promise<void>,
  ): Promise<void> {
    try {
      await fn();
      results.success++;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      this.logger.error(
        { easycode, error: message },
        "Erro ao processar contrato",
      );
      results.failed++;
      results.errors.push({ easycode, reason: message });
    }
  }

  private async processContract(
    easycode: string,
    status: SendContractsPayload["Status"],
    ct: any,
  ): Promise<void> {
    const payload =
      status === "Convertida"
        ? this.payloadBuilder.buildPayloadConvertida(
            ct,
            await this.requirePrincipal(easycode),
            await this.agilidadeRepository.getAdesoesSecundarias(easycode),
          )
        : this.payloadBuilder.buildPayloadNaoConvertida(ct, status);

    const currentBdId = ct.bd_id ?? "";

    const { lead_id } = await this.execute({ easycode, payload });

    if (lead_id && lead_id !== currentBdId) {
      await this.agilidadeRepository.updateLeadId(easycode, lead_id);
    }
  }

  private async requirePrincipal(easycode: string) {
    const principal =
      await this.agilidadeRepository.getAdesaoPrincipal(easycode);
    if (!principal) {
      this.logger.warn({ easycode }, "Sem titular");
      throw new Error("Sem titular");
    }
    return principal;
  }

  async execute({
    easycode,
    payload,
  }: ExecuteDTO): Promise<SendContractsResponse> {
    sendContractsSchema.parse(payload);

    this.logger.info(
      {
        id: payload.Id,
        status: payload.Status,
        marca: payload.Marca,
        colaborador: payload.NomeColaborador,
        easycode,
      },
      "Iniciando envio de assinatura",
    );

    try {
      const response = await this.agilidadeApiService.sendSubscription(payload);

      await this.logSuccess(payload, easycode, response).catch((err) =>
        this.logger.error(
          { easycode, error: err.message },
          "Falha ao guardar log de sucesso",
        ),
      );

      this.logger.info(
        { id: payload.Id, easycode, status: payload.Status },
        "Contrato enviado com sucesso",
      );
      return response;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error");

      await this.logError(payload, easycode, error).catch((logErr) =>
        this.logger.error(
          { easycode, error: logErr.message },
          "Falha ao guardar log de erro",
        ),
      );

      throw error;
    }
  }

  private async logSuccess(
    payload: SendContractsPayload,
    easycode: string,
    response: SendContractsResponse,
  ): Promise<void> {
    await this.agilidadeRepository.saveSendContractsLog({
      ...this.logBuilder.build(payload, easycode),
      send_status: "SUCCESS",
      body: JSON.stringify(payload),
      api_response: response.raw,
    });
  }

  private async logError(
    payload: SendContractsPayload,
    easycode: string,
    err: Error & { response?: { status: number } },
  ): Promise<void> {
    await this.agilidadeRepository.saveSendContractsLog({
      ...this.logBuilder.build(payload, easycode),
      send_status: "ERROR",
      error_type: err.response ? "API" : "SYSTEM",
      api_response: err.message,
      ...(err.response && { http_status: err.response.status }),
      body: JSON.stringify(payload),
    });
  }
}
