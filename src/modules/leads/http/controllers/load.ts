import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { makeLoadLeadUseCase } from "../../application/factories/make-load-use-case";
import { AltitudeApiError } from "../../../../shared/errors/altitude-error";
import { NotFoundError } from "../../../../shared/errors/not-found-error";

export async function loadLeadController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const schema = z.object({
      leads: z.array(z.record(z.any())).min(1, "At least one lead is required"),
    });

    const leads = schema.parse(request.body).leads;
    const client = (request as any).client;

    reply.status(202).send({
      message: "Leads received and being processed",
      count: leads.length,
    });

    const loadLeadsUseCase = makeLoadLeadUseCase();
    loadLeadsUseCase.execute(client, leads).catch((error) => {
      if (error instanceof AltitudeApiError) {
        request.log.error({ err: error }, `AltitudeApiError: ${error.message}`);
        return;
      }
      request.log.error(
        { err: error },
        "Erro no processamento background de leads",
      );
    });
  } catch (error) {
    if (error instanceof AltitudeApiError) {
      return reply.status(409).send({ message: error.message });
    }

    if (error instanceof NotFoundError) {
      return reply.status(404).send({ message: error.message });
    }

    console.error("Erro carregar lead:", error);
    throw error;
  }
}
