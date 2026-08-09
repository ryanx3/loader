import { SendContractsPayload } from "../../../../modules/agilidade/http/schemas/agilidade-contracts.schema";
import { AgilidadeAuthenticateService } from "./authenticate";

export interface SendContractsResponse {
  status: string;
  action: string;
  lead_id: string;
  service_contract_id: string;
  raw: string;
}

export class AgilidadeSendContractsService {
  private readonly BASE_URL =
    "https://agilidade-uat-10c1d06d1215.herokuapp.com";

  constructor(private readonly authService: AgilidadeAuthenticateService) {}

  async sendSubscription(
    payload: SendContractsPayload,
    retry = true,
  ): Promise<SendContractsResponse> {
    let token = this.authService.getToken();

    if (!token) {
      await this.authService.authenticate();
      token = this.authService.getToken();
    }

    const response = await fetch(`${this.BASE_URL}/pluricall/lead_result`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (response.status === 401 && retry) {
      await this.authService.authenticate();
      return this.sendSubscription(payload, false);
    }

    const bodyText = await response.text().catch(() => "(sem body)");

    if (response.status === 401 && retry) {
      await this.authService.authenticate();
      return this.sendSubscription(payload, false);
    }

    if (!response.ok) {
      throw new Error(
        `Agilidade API error: ${response.status} ${response.statusText} — ${bodyText}`,
      );
    }

    return { ...JSON.parse(bodyText), raw: bodyText } as SendContractsResponse;
  }
}
