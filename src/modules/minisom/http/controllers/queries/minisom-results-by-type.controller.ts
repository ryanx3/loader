import { FastifyReply, FastifyRequest } from "fastify";
import { InvalidFormatError } from "../../../../../shared/errors/invalid-format";
import { minisomResultsByTypeSchema } from "../../../schemas/minisom-results-by-type.schema";
import { makeMinisomResultsByTypeUseCase } from "../../../use-cases/factories/minisom-results-by-type.factory";

export async function minisomResultsByType(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const { date } = minisomResultsByTypeSchema.parse(request.query);
    const useCase = makeMinisomResultsByTypeUseCase();
    const result = await useCase.execute({ date });

    return reply.status(200).send(result);
  } catch (error) {
    if (error instanceof InvalidFormatError) {
      return reply.status(400).send({ error: error.message });
    }
    throw error;
  }
}
