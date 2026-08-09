import { FastifyRequest, FastifyReply } from "fastify";
import { makeSendContractsUseCase } from "../../../application/use-cases/factories/agilidade-contracts.factory";
import { sendAttemptsSchema } from "../../schemas/agilidade-contracts.schema";

export async function agilidadeContractsAttemptsController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { windowStart, windowEnd } = resolveWindow(request.query);

  const useCase = makeSendContractsUseCase();
  const result = await useCase.executeAttemptsBatch({ windowStart, windowEnd });

  const hasErrors = result.failed > 0;

  return reply.status(hasErrors ? 207 : 200).send({
    status: hasErrors ? (result.success > 0 ? "PARTIAL" : "ERROR") : "SUCCESS",
    windowStart,
    windowEnd,
    ...result,
  });
}

function resolveWindow(query: unknown): {
  windowStart: string;
  windowEnd: string;
} {
  const parsed = sendAttemptsSchema.partial().parse(query);

  if (parsed.windowStart && parsed.windowEnd) {
    return { windowStart: parsed.windowStart, windowEnd: parsed.windowEnd };
  }

  const now = new Date();
  const windowMinutes = 17;
  const start = new Date(now.getTime() - windowMinutes * 60 * 1000);

  return {
    windowStart: formatToSqlDatetime(start),
    windowEnd: formatToSqlDatetime(now),
  };
}

function formatToSqlDatetime(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}
