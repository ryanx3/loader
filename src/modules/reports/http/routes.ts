import { FastifyInstance } from "fastify";
import { findAllActiveReportsController } from "./controllers/find-all";
import { createReportConfigController } from "./controllers/create-config";
import { sendReportController } from "./controllers/send-report";
import { deactivateClientController } from "./controllers/deactivate-client";

export async function reportRoutes(app: FastifyInstance) {
  app.get(`/reports`, findAllActiveReportsController);
  app.post(`/reports`, createReportConfigController);
  app.patch(`/reports/deactivate/:clientName`, deactivateClientController);
  app.post(`/reports/send`, sendReportController);
}
