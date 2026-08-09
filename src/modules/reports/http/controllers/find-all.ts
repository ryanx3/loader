import { FastifyReply, FastifyRequest } from "fastify";
import { makeFindAllActiveReportsUseCase } from "../../use-cases/factories/make-find-all";

export async function findAllActiveReportsController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const useCase = makeFindAllActiveReportsUseCase();

    const reports = await useCase.execute();

    return reply.status(200).send(reports);
  } catch (error) {
    console.error(error);

    throw error;
  }
}
