import { InvalidFormatError } from "../../../../../shared/errors/invalid-format";
import { minisomDashboardSchema } from "../../../schemas/minisom-dashboard.schema";
import { FastifyReply, FastifyRequest } from "fastify";
import { makeMinisomDashboardUseCase } from "../../../use-cases/factories/minisom-dashboard.factory";

export async function minisomDashboard(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const dto = minisomDashboardSchema.parse(request.query);
    const useCase = makeMinisomDashboardUseCase();
    const result = await useCase.execute(dto);

    return reply.status(200).send(result);
  } catch (error) {
    console.error("Error in minisomDashboard controller:", error);

    if (error instanceof InvalidFormatError) {
      return reply.status(400).send({ error: error.message });
    }

    throw error;
  }
}
