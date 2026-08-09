import { FastifyRequest, FastifyReply } from "fastify";
import { makePlenitudeRecordingsUseCase } from "../../application/factories/make-plenitude-recordings";
import { z } from "zod";

const plenitudeRecordingsSchema = z.object({
  initialDate: z.string(),
  endDate: z.string(),
  limit: z.number().optional(),
});

export async function sendRecordingsController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const body = plenitudeRecordingsSchema.parse(request.body);
    const useCase = makePlenitudeRecordingsUseCase();
    useCase.execute({
      initialDate: body.initialDate,
      endDate: body.endDate,
      limit: body.limit,
    });
    return reply.status(200).send({ message: "Processamento concluído" });
  } catch (error: any) {
    console.error("Error in sendRecordingsController:", error);
    throw error;
  }
}
