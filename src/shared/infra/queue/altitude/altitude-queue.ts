import { Queue } from "bullmq";
import { redisConnection } from "../connection";

export const altitudeQueue = new Queue("altitude-create-contact", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 4,
    backoff: {
      type: "custom",
    },
    removeOnComplete: { count: 500 },
    removeOnFail: false,
  },
});
