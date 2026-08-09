import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { AlreadyExistsError } from "../../../../shared/errors/name-already-exists-error";
import { makeCreateReportConfigUseCase } from "../../use-cases/factories/make-create-config";

const schema = z.object({
  clientName: z.string().min(3),
  siteId: z.string().min(1),
  machine: z.string().min(1),
  driveId: z.string().min(1),
  folderPath: z.string().min(1),
  schedule: z.string().regex(/^\d{2}:\d{2}$/),
  foldersByDate: z.boolean(),
  status: z.enum(["ACTIVO", "INACTIVO"]),
});

export async function createReportConfigController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const data = schema.parse(request.body);

  try {
    const useCase = makeCreateReportConfigUseCase();
    await useCase.execute(data);
    return reply.status(201).send({ message: "Report config created." });
  } catch (error) {
    console.error("ERRO REAL:", error);
    if (error instanceof AlreadyExistsError) {
      return reply.status(409).send({ message: error.message });
    }
    throw error;
  }
}
