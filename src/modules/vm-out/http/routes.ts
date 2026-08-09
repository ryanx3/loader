import { FastifyInstance } from "fastify";
import { vmOutController } from "./controllers/vm-out.controller";

export async function vmOutRoutes(app: FastifyInstance) {
  app.post(`/ws/vm-out`, vmOutController);
}
