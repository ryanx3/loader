import axios from "axios";
import https from "https";
import { AltitudeAuthError } from "../../../errors/altitude-auth-error";
import {
  AltitudeEnvironment,
  resolveAltitudeConfig,
} from "./utils/resolve-altitude-config";

interface AltitudeAuthErrorResponse {
  error: string;
  error_description: string;
  error_uri: string | null;
}

interface AltitudeTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token: string;
}

export class AltitudeAuthService {
  private tokens: Map<
    AltitudeEnvironment,
    { token: string; expiresAt: number }
  > = new Map();

  private loginPromises: Map<AltitudeEnvironment, Promise<string>> = new Map();

  async getToken(environment: AltitudeEnvironment): Promise<string> {
    const cached = this.tokens.get(environment);

    if (cached && Date.now() < cached.expiresAt) {
      return cached.token;
    }

    this.tokens.delete(environment);

    const existing = this.loginPromises.get(environment);
    if (existing) return existing;

    const promise = this.login(environment);
    this.loginPromises.set(environment, promise);

    try {
      const token = await promise;
      return token;
    } finally {
      this.loginPromises.delete(environment);
    }
  }

  private async login(environment: AltitudeEnvironment): Promise<string> {
    try {
      const config = resolveAltitudeConfig(environment);
      const payload = new URLSearchParams({
        username: config.username,
        password: config.password,
        grant_type: "password",
        instanceaddress: config.instance,
        secureaccess: "false",
        authenticationType: "Uci",
        forced: "true",
        operation: "login",
      });

      const resp = await axios.post<AltitudeTokenResponse>(
        `${config.baseUrl}/token`,
        payload,
        {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          httpsAgent: new https.Agent({ rejectUnauthorized: false }),
          timeout: 10000,
        },
      );

      const token = resp.data.access_token;
      const expiresAt = Date.now() + (resp.data.expires_in - 60) * 1000;

      this.tokens.set(environment, { token, expiresAt });

      return token;
    } catch (err: any) {
      if (axios.isAxiosError<AltitudeAuthErrorResponse>(err)) {
        const data = err.response?.data;
        throw new AltitudeAuthError(
          err.response?.status ?? 500,
          data?.error,
          data?.error_description,
          data,
        );
      }
      throw new AltitudeAuthError(500, "unknown", err.message, err);
    }
  }

  async refreshToken(
    refreshToken: string,
    environment: AltitudeEnvironment,
  ): Promise<AltitudeTokenResponse> {
    const config = resolveAltitudeConfig(environment);
    const payload = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      instanceaddress: config.instance,
    });

    try {
      const resp = await axios.post<AltitudeTokenResponse>(
        `${config.baseUrl}/token`,
        payload,
        {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          httpsAgent: new https.Agent({ rejectUnauthorized: false }),
          timeout: 10000,
        },
      );

      return resp.data;
    } catch (err: any) {
      if (axios.isAxiosError<AltitudeAuthErrorResponse>(err)) {
        const data = err.response?.data;
        throw new AltitudeAuthError(
          err.response?.status ?? 500,
          data?.error,
          data?.error_description,
          data,
        );
      }
      throw new AltitudeAuthError(500, "unknown", err.message, err);
    }
  }

  invalidateToken(environment: AltitudeEnvironment): void {
    if (!this.loginPromises.has(environment)) {
      this.tokens.delete(environment);
    }
  }
}

export const altitudeAuthService = new AltitudeAuthService();
