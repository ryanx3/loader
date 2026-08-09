import { FastifyReply, FastifyRequest } from "fastify";
import { makeMinisomLoadedContactsUseCase } from "../../../use-cases/factories/minisom-loaded-contacts.factory";

export async function minisomLoadedContacts(
  _request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const useCase = makeMinisomLoadedContactsUseCase();
    const result = await useCase.execute();

    return reply.status(200).send(result);
  } catch (error) {
    console.error("Error in minisomLoadedContacts controller:", error);
    throw error;
  }
}
