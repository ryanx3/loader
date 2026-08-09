import { minisomRoutes } from "./modules/minisom/http/routes";
import { leadRoutes } from "./modules/leads/http/routes";
import { agilidadeRoutes } from "./modules/agilidade/http/routes";
import { endesaRoutes } from "./modules/endesa/http/routes";
import { FastifyInstance } from "fastify";
import { servilusaRoutes } from "./modules/servilusa/http/routes";
import { iberdrolaRoutes } from "./modules/iberdrola/http/route";
import { sharepointRoutes } from "./modules/sharepoint/http/routes";
import { plenitudeRoutes } from "./modules/plenitude/http/routes";
import { getClientsRecordings } from "./migrating/http/controllers/recordings/get-clients";
import { createClientRecordings } from "./migrating/http/controllers/recordings/create-client";
import { updateClientRecordings } from "./migrating/http/controllers/recordings/update-client";
import { getRecordingsMetadatas } from "./migrating/http/controllers/recordings/get-metadatas";
import { downloadRecording } from "./migrating/http/controllers/recordings/download-from-sharepoint";
import { vmOutRoutes } from "./modules/vm-out/http/routes";
import { reportRoutes } from "./modules/reports/http/routes";

export function linceRoutes(app: FastifyInstance) {
  app.register(minisomRoutes);
  app.register(leadRoutes);
  app.register(agilidadeRoutes);
  app.register(endesaRoutes);
  app.register(servilusaRoutes);
  app.register(iberdrolaRoutes);
  app.register(sharepointRoutes);
  app.register(plenitudeRoutes);
  app.register(vmOutRoutes);
  app.register(reportRoutes);

  app.get("/clients/records", getClientsRecordings);
  app.post("/clients/records", createClientRecordings);
  app.patch("/clients/records/:clientName", updateClientRecordings);
  app.get(`/recordings/search`, getRecordingsMetadatas);
  app.get(`/recordings/download`, downloadRecording);
}
