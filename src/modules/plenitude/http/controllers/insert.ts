import { FastifyReply, FastifyRequest } from "fastify";
import { makePlenitudeInsert } from "../../application/factories/make-plenitude-insert";
import { plenitudeBodySchema } from "../schemas/plenitude-schema";
import { PlenitudeLoginError } from "../../domain/errors/plenitude-login-error";
import axios from "axios";

export async function plenitudeInsert(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const { digitalData } = plenitudeBodySchema.parse(request.body);

    const plenitudeInsert = makePlenitudeInsert("prod");
    const result = await plenitudeInsert.execute(digitalData);
    return reply.send(result);
  } catch (error: any) {
    if (error instanceof PlenitudeLoginError) {
      return reply.status(400).send({ error: error.message });
    }

    if (axios.isAxiosError(error) && error.response) {
      return reply.status(error.response.status).send(error.response.data);
    }
    throw error;
  }
}
