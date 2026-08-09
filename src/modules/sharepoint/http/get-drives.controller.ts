import { FastifyReply, FastifyRequest } from "fastify";
import { GetDrivesUseCase } from "../application/use-cases/get-drives.use-case";
import { SharepointRepository } from "../infra/repositories/sharepoint-repository";

export async function getDrivesController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const { siteId } = request.params as { siteId: string };

    const useCase = new GetDrivesUseCase(new SharepointRepository());
    const drives = await useCase.execute(siteId);

    return reply.send(drives);
  } catch (err: any) {
    const status = err.message.includes("required") ? 400 : 500;
    return reply.status(status).send({ error: err.message });
  }
}
