import { env } from "../../../../../env";

export type AltitudeEnvironment = "cloud" | "onprem" | "pre";

export interface AltitudeResolvedConfig {
  baseUrl: string;
  username: string;
  password: string;
  instance: string;
}

export function resolveAltitudeConfig(
  environment: AltitudeEnvironment,
): AltitudeResolvedConfig {
  if (env.NODE_ENV === "pre") {
    return {
      baseUrl: env.ALTITUDE_PRE_API_URL,
      username: env.ALTITUDE_PRE_USER,
      password: env.ALTITUDE_PRE_PASS,
      instance: env.ALTITUDE_PRE_INSTANCE,
    };
  }

  // 🌩 Cloud
  if (environment === "cloud") {
    return {
      baseUrl: env.ALTITUDE_CLOUD_API_URL,
      username: env.ALTITUDE_CLOUD_USER,
      password: env.ALTITUDE_CLOUD_PASS,
      instance: env.ALTITUDE_CLOUD_INSTANCE,
    };
  }

  if (environment === "pre") {
    return {
      baseUrl: env.ALTITUDE_PRE_API_URL,
      username: env.ALTITUDE_PRE_USER,
      password: env.ALTITUDE_PRE_PASS,
      instance: env.ALTITUDE_PRE_INSTANCE,
    };
  }

  return {
    baseUrl: env.ALTITUDE_API_URL,
    username: env.ALTITUDE_USER,
    password: env.ALTITUDE_PASS,
    instance: env.ALTITUDE_INSTANCE,
  };
}
