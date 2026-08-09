import { FastifyRequest, FastifyReply } from "fastify";
import { GetRequestIpAndUrl } from "../../../../../shared/utils/network/get-request-and-url";
import { UnauthorizedError } from "../../../../../shared/errors/unauthorized-error";
import { makeAgilidade24041UseCase } from "../../../application/use-cases/factories/agilidade-24041.factory";
import { agilidade24041Schema } from "../../schemas/agilidade-24041.schema";

export async function agilidade24041Controller(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const token = request.headers.token?.toString();
  if (!token) {
    return reply.status(403).send({ error: "Missing token" });
  }

  const parsed = agilidade24041Schema.safeParse(request.parsedBody);
  if (!parsed.success) {
    return reply.status(400).send({
      error: "Campos obrigatórios não encontrados",
      details: parsed.error.flatten(),
    });
  }

  try {
    const { request_ip, request_url } = GetRequestIpAndUrl(request);
    const useCase = makeAgilidade24041UseCase();

    const result = await useCase.execute({
      body: parsed.data,
      requestIp: request_ip,
      requestUrl: request_url,
      token,
    });

    return reply.status(200).send({
      status: result.status,
      status_msg: result.statusMsg,
      gen_id: result.genId,
    });
  } catch (error: any) {
    console.error("Error in agilidade24041Controller:", error);

    if (error instanceof UnauthorizedError) {
      return reply.status(401).send({ error: error.message });
    }

    throw error;
  }
}
