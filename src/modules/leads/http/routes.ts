import { FastifyInstance } from "fastify";
import { createLeadConfigController } from "./controllers/create";
import { loadLeadController } from "./controllers/load";
import { apiKeyAuth } from "./middleware/api-key";

export async function leadRoutes(app: FastifyInstance) {
  app.post(`/leads/config`, createLeadConfigController);
  app.post(`/leads/load`, { preHandler: apiKeyAuth }, loadLeadController);

  app.post(
    `/Insight360api/leads/load`,
    { preHandler: apiKeyAuth },
    loadLeadController,
  );
}
