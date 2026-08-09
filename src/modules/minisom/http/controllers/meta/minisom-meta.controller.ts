import { FastifyReply, FastifyRequest } from "fastify";
import { minisomMetaSchema } from "../../../schemas/minisom-meta.schema";
import { GetRequestIpAndUrl } from "../../../../../shared/utils/network/get-request-and-url";
import { AlreadyExistsError } from "../../../../../shared/errors/name-already-exists-error";
import { NotFoundError } from "../../../../../shared/errors/not-found-error";
import { makeMinisomMetaUseCase } from "../../../use-cases/factories/minisom-meta.factory";

export async function minisomMeta(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const body = minisomMetaSchema.parse(request.body);
    const minisomMetaFactory = makeMinisomMetaUseCase();
    const { request_ip, request_url } = GetRequestIpAndUrl(request);

    const result = await minisomMetaFactory.execute({
      bodyRequest: body,
      requestUrl: request_url,
      requestIp: request_ip,
    });

    reply.status(201).send({
      status: result.status,
      status_msg: result.statusMsg,
      gen_id: result.genId,
    });
  } catch (error: any) {
    console.error("Error in minisomMeta controller:", error);
    if (error instanceof AlreadyExistsError) {
      return reply.status(409).send({ error: error.message });
    } else if (error instanceof NotFoundError) {
      return reply.status(404).send({ error: error.message });
    }

    throw error;
  }
}
