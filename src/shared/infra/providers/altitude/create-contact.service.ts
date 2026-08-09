import axios from "axios";
import https from "https";
import { AltitudeApiError } from "../../../errors/altitude-error";
import {
  AltitudeEnvironment,
  resolveAltitudeConfig,
} from "./utils/resolve-altitude-config";
import { AltitudeAuthService } from "./auth.service";

interface CreateContactParams {
  environment: AltitudeEnvironment;
  payload: any;
}

export class AltitudeCreateContact {
  private retrying: Set<AltitudeEnvironment> = new Set();

  constructor(private altitudeAuthService: AltitudeAuthService) {}

  async execute({ payload, environment }: CreateContactParams) {
    const config = resolveAltitudeConfig(environment);
    const token = await this.altitudeAuthService.getToken(environment);

    try {
      return await this.post(config.baseUrl, token, payload);
    } catch (error: any) {
      const isDisposed =
        error.response?.data?.message?.includes("entity was disposed") ||
        error.response?.data?.error_description?.includes(
          "entity was disposed",
        ) ||
        JSON.stringify(error.response?.data ?? "").includes(
          "entity was disposed",
        );

      const is401 = error.response?.status === 401;

      if ((is401 || isDisposed) && !this.retrying.has(environment)) {
        this.retrying.add(environment);
        try {
          this.altitudeAuthService.invalidateToken(environment);
          const newToken = await this.altitudeAuthService.getToken(environment);
          return await this.post(config.baseUrl, newToken, payload);
        } finally {
          this.retrying.delete(environment);
        }
      }

      this.handleError(error);
    }
  }

  private async post(baseUrl: string, token: string, payload: any) {
    const resp = await axios.post(
      `${baseUrl}/api/instance/campaignManager/createContact`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      },
    );
    return resp.data;
  }

  private handleError(error: any): never {
    if (error.response) {
      const message =
        error.response.data?.message ||
        error.response.data?.error_description ||
        JSON.stringify(error.response.data);
      throw new AltitudeApiError(
        message,
        error.response.status,
        error.response.data,
      );
    }
    throw new AltitudeApiError("Altitude unreachable");
  }
}
