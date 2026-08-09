import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { makeSendReportUseCase } from "../../use-cases/factories/make-send-report";

const schema = z.object({
  clientName: z.string().min(1),
  fileName: z.string().min(1),
  fileBase64: z.string().min(1),
});

export async function sendReportController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const data = schema.parse(request.body);
  const useCase = makeSendReportUseCase();
  const fileBuffer = Buffer.from(data.fileBase64, "base64");

  reply.status(200).send({ message: "Report recebido, a processar..." });

  setImmediate(async () => {
    try {
      await useCase.execute({
        clientName: data.clientName,
        fileName: data.fileName,
        fileBuffer,
      });
    } catch (error) {
      console.error("SEND REPORT ERROR:", error);
    }
  });
}
