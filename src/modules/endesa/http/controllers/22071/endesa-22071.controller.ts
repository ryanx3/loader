import { FastifyRequest, FastifyReply } from "fastify";
import { GetRequestIpAndUrl } from "../../../../../shared/utils/network/get-request-and-url";
import { makeEndesa22071UseCase } from "../../../application/factories/endesa-22071.factory";
import {
  endesa22071Schema,
  Endesa22071Schema,
} from "../../schemas/endesa-22071.schema";

export async function endesa22071Controller(
  request: FastifyRequest<{ Body: Endesa22071Schema }>,
  reply: FastifyReply,
) {
  const body = endesa22071Schema.parse(request.body);

  try {
    const { request_ip, request_url } = GetRequestIpAndUrl(request);
    const useCase = makeEndesa22071UseCase();

    const result = await useCase.execute({
      body,
      requestIp: request_ip,
      requestUrl: request_url,
    });

    return reply.status(200).send({
      status: result.status,
      status_msg: result.statusMsg,
      gen_id: result.genId,
    });
  } catch (error: any) {
    console.error("Error in endesa22071Controller:", error);
    throw error;
  }
}
