import { FastifyRequest, FastifyReply } from "fastify";
import bcrypt from "bcryptjs";
import { ValidationError } from "../../../../shared/errors/validation-error";
import { GetRecordingMetadatasUseCase } from "../../../use-cases/recordings/get-recording-metadatas";
import { connectPluricallDb } from "../../../../shared/infra/db/connect-pluricall";

interface GetRecordingsQuery {
  clientId: string;
  easycode?: string;
  language?: string;
  startDate?: string;
  endDate?: string;
}

export async function getRecordingsMetadatas(
  req: FastifyRequest<{ Querystring: GetRecordingsQuery }>,
  reply: FastifyReply,
) {
  const getMetadatasUseCase = new GetRecordingMetadatasUseCase();

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Basic ")) {
      return reply.status(401).send({ error: "Missing Authorization header" });
    }

    const base64Credentials = authHeader.split(" ")[1];
    const credentials = Buffer.from(base64Credentials, "base64").toString(
      "utf-8",
    );
    const [email, password] = credentials.split(":");

    if (!email || !password) {
      return reply.status(401).send({ error: "Invalid Authorization format" });
    }

    const pool = await connectPluricallDb("onprem");
    const result = await pool.request().input("email", email).query(`
      SELECT id, password_hash, status
      FROM insight_clients_login
      WHERE email = @email
    `);

    const client = result.recordset[0];
    if (!client || client.status !== "ACTIVO") {
      return reply.status(401).send({ error: "Usuário inválido ou inativo" });
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      client.password_hash,
    );

    if (!isPasswordValid) {
      return reply.status(401).send({ error: "Senha incorreta" });
    }

    const { easycode, language, startDate, endDate } = req.query;

    const recordings = await getMetadatasUseCase.execute({
      clientId: client.id,
      easycode,
      language,
      startDate,
      endDate,
    });

    return reply.status(200).send({ total: recordings.length, recordings });
  } catch (err: any) {
    if (err instanceof ValidationError) {
      return reply.status(400).send({ error: err.message });
    }

    console.error("Erro ao buscar gravações:", err);
    return reply.status(500).send({ error: "Erro ao buscar gravações" });
  }
}
