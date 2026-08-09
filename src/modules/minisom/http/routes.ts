import { FastifyInstance } from "fastify";
import { minisom21051 } from "./controllers/21051/minisom-21051.controller";
import { minisom21121 } from "./controllers/21121/minisom-21121.controller";
import { minisomCorporate } from "./controllers/corporate/minisom-corporate.controller";
import { minisomMeta } from "./controllers/meta/minisom-meta.controller";
import { minisomDashboard } from "./controllers/queries/minisom-dashboard.controller";
import { minisomResultsByType } from "./controllers/queries/minisom-results-by-type.controller";
import { minisomLoadedContacts } from "./controllers/queries/minisom-loaded-contacts.controller";
import { minisomTest } from "./controllers/test/minisom-test.controller";

export function minisomRoutes(app: FastifyInstance) {
  app.post(`/ws/minisom/21051/`, minisom21051);
  app.post(`/ws/minisom/21121/`, minisom21121);
  app.post(`/ws/minisom/21011/`, minisomCorporate);
  app.post(`/ws/minisom/meta`, minisomMeta);
  app.post(`/ws/minisom/21121DEV/`, minisomTest);
  app.get("/ws/minisom/results-by-type", minisomResultsByType);
  app.get("/ws/minisom/loaded-contacts", minisomLoadedContacts);
  app.get("/ws/minisom/dashboard", minisomDashboard);
}
