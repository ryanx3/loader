import pino from "pino";
import { ILogger } from "./interfaces/logger.types";

export class LoggerService implements ILogger {
  private readonly isDev = process.env.NODE_ENV === "development";

  private readonly logger = pino(
    { level: "info" },
    this.isDev
      ? pino.transport({ target: "pino-pretty" })
      : pino.transport({
          target: "pino-roll",
          options: {
            file: "./logs/app.log",
            frequency: "daily",
            limit: { count: 30 },
            mkdir: true,
          },
        }),
  );

  info(obj: object, message: string): void {
    this.logger.info(obj, message);
  }

  warn(obj: object, message: string): void {
    this.logger.warn(obj, message);
  }

  error(obj: object, message: string): void {
    this.logger.error(obj, message);
  }
}
