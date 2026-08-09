import { FastifyRequest, FastifyReply } from "fastify";
import { makeVmOutUseCase } from "../../use-cases/factories/vm-out.factory";

export async function vmOutController(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const useCase = makeVmOutUseCase();

  try {
    await useCase.execute();
    reply.status(200).send({ message: "VM OUT processado com sucesso" });
  } catch (err) {
    console.error("Erro ao processar VM OUT:", err);
    reply.status(500).send({ error: "Erro interno" });
  }
}
