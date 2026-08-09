import { FastifyRequest, FastifyReply } from "fastify";
import { GetRequestIpAndUrl } from "../../../../../shared/utils/network/get-request-and-url";
import { AlreadyExistsError } from "../../../../../shared/errors/name-already-exists-error";
import { minisom21051Schema } from "../../../schemas/minisom-21051.schema";
import { UnauthorizedError } from "../../../../../shared/errors/unauthorized-error";
import { FieldRequiredError } from "../../../../../shared/errors/field-required";
import { makeMinisom21051UseCase } from "../../../use-cases/factories/minisom-21051.factory";

export async function minisom21051(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const body = minisom21051Schema.parse(request.body);
    const minisom21051Factory = makeMinisom21051UseCase();
    const { request_ip, request_url } = GetRequestIpAndUrl(request);

    const result = await minisom21051Factory.execute({
      bodyRequest: body,
      requestIp: request_ip,
      requestUrl: request_url,
    });

    reply.status(201).send({
      status: result.status,
      status_msg: result.statusMsg,
      gen_id: result.genId,
    });
  } catch (error: any) {
    console.error("Error in minisom21051 controller:", error);
    if (error instanceof AlreadyExistsError) {
      return reply.status(409).send({ error: error.message });
    } else if (error instanceof UnauthorizedError) {
      return reply.status(401).send({ error: error.message });
    } else if (error instanceof FieldRequiredError) {
      return reply.status(400).send({ error: error.message });
    }

    throw error;
  }
}
