import { FastifyInstance } from "fastify";
import { plenitudeInsert } from "./controllers/insert";
import { sendRecordingsController } from "./controllers/recordings";

export function plenitudeRoutes(app: FastifyInstance) {
  app.post(`/plenitude/return-data`, plenitudeInsert);
  app.post("/plenitude/recordings/send", sendRecordingsController);
}
