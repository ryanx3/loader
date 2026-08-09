import "dotenv/config";
import z from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "pre", "production"]),
  PORT: z.coerce.number().default(3333),
  WEBHOOK_PORT: z.coerce.number().default(3332),
  DATABASE_URL: z.string(),

  // SMTP EMAIL
  SMTP_HOST: z.string(),
  SMTP_PORT: z.coerce.number(),
  SMTP_USER: z.string(),
  SMTP_PASS: z.string(),
  SMTP_FROM_NAME: z.string(),
  SMTP_FROM_EMAIL: z.string(),

  // PLURICALL DATABASES

  PLURICALL_ONPREM_DB_DATABASE: z.string(),
  PLURICALL_ONPREM_DB_USER: z.string(),
  PLURICALL_ONPREM_DB_PASSWORD: z.string(),
  PLURICALL_ONPREM_DB_SERVER: z.string(),
  PLURICALL_ONPREM_DB_PORT: z.coerce.number(),

  PLURICALL_CLOUD_DB_DATABASE: z.string(),
  PLURICALL_CLOUD_DB_USER: z.string(),
  PLURICALL_CLOUD_DB_PASSWORD: z.string(),
  PLURICALL_CLOUD_DB_SERVER: z.string(),
  PLURICALL_CLOUD_DB_PORT: z.coerce.number(),

  PLURICALL_PRE_DB_DATABASE: z.string(),
  PLURICALL_PRE_DB_USER: z.string(),
  PLURICALL_PRE_DB_PASSWORD: z.string(),
  PLURICALL_PRE_DB_SERVER: z.string(),
  PLURICALL_PRE_DB_PORT: z.coerce.number(),

  // LEOPARD
  LEOPARD_USER: z.string(),
  LEOPARD_PASSWORD: z.string(),
  LEOPARD_SERVER: z.string(),
  LEOPARD_NAME: z.string(),
  LEOPARD_PORT: z.coerce.number(),

  // ALTITUDE
  ALTITUDE_API_VERSION: z.string(),
  // On Premise
  ALTITUDE_API_URL: z.string(),
  ALTITUDE_USER: z.string(),
  ALTITUDE_PASS: z.string(),
  ALTITUDE_INSTANCE: z.string(),
  // Cloud
  ALTITUDE_CLOUD_API_URL: z.string(),
  ALTITUDE_CLOUD_USER: z.string(),
  ALTITUDE_CLOUD_PASS: z.string(),
  ALTITUDE_CLOUD_INSTANCE: z.string(),
  // Pre Production
  ALTITUDE_PRE_API_URL: z.string(),
  ALTITUDE_PRE_USER: z.string(),
  ALTITUDE_PRE_PASS: z.string(),
  ALTITUDE_PRE_INSTANCE: z.string(),
  // SHAREPOINT
  TENANT_ID: z.string(),
  CLIENT_ID: z.string(),
  CLIENT_SECRET: z.string(),
  SITE_URL: z.string(),
  DRIVE_ID: z.string(),

  LLEIDA_USER: z.string(),
  LLEIDA_API_KEY: z.string(),
  LLEIDA_PASS: z.string(),

  REDIS_PASSWORD: z.string(),
  REDIS_HOST: z.string(),
  REDIS_PORT: z.coerce.number(),

  PLENITUDE_USER: z.string(),
  PLENITUDE_PASS: z.string(),
  PLENITUDE_VERSION: z.string(),

  AGILIDADE_API_USERNAME: z.string(),
  AGILIDADE_API_PASSWORD: z.string(),

  // FTPS GRAVAÇÕES
  FTPS_INTERNAL_HOST: z.string(),
  FTPS_INTERNAL_PORT: z.coerce.number().default(990),
  FTPS_INTERNAL_USER: z.string(),
  FTPS_INTERNAL_PASSWORD: z.string(),

  // SFTP PLENITUDE (destino cliente)
  SFTP_PLENITUDE_HOST: z.string(),
  SFTP_PLENITUDE_PORT: z.coerce.number().default(22),
  SFTP_PLENITUDE_USER: z.string(),
  SFTP_PLENITUDE_PASSWORD: z.string(),

  PLURICALL_PANTHER_DB_USER: z.string(),
  PLURICALL_PANTHER_DB_PASSWORD: z.string(),
  PLURICALL_PANTHER_DB_SERVER: z.string(),
  PLURICALL_PANTHER_DB_PORT: z.coerce.number(),
  PLURICALL_PANTHER_DB_DATABASE: z.string(),
});

const _env = envSchema.safeParse(process.env);

if (_env.success === false) {
  console.error("❌ Invalid environment variables!", _env.error);
  throw new Error("❌ Invalid environment variables!");
}

export const env = _env.data;
