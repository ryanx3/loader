import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { makeDeactivateClientUseCase } from "../../use-cases/factories/make-deactivate-client";

const schema = z.object({
  clientName: z.string().min(1),
});

export async function deactivateClientController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const data = schema.parse(request.params);
  try {
    const useCase = makeDeactivateClientUseCase();
    await useCase.execute(data.clientName);

    return reply
      .status(200)
      .send({ message: "Client deactivated successfully" });
  } catch (error) {
    console.error(error);

    throw error;
  }
}
