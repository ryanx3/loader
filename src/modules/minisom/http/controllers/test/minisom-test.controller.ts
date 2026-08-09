import { FastifyRequest, FastifyReply } from "fastify";
import { GetRequestIpAndUrl } from "../../../../../shared/utils/network/get-request-and-url";
import { AlreadyExistsError } from "../../../../../shared/errors/name-already-exists-error";
import { UnauthorizedError } from "../../../../../shared/errors/unauthorized-error";
import { FieldRequiredError } from "../../../../../shared/errors/field-required";
import { minisomTestSchema } from "../../../schemas/minisom-test.schema";
import { makeMinisomTestUseCase } from "../../../use-cases/factories/minisom-test.factory";

export async function minisomTest(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const body = minisomTestSchema.parse(request.body);
    const minisomTestFactory = makeMinisomTestUseCase();
    const { request_ip, request_url } = GetRequestIpAndUrl(request);

    const result = await minisomTestFactory.execute({
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
    console.error("Error in minisomTest controller:", error);
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
