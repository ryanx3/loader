import { AgilidadeAuthenticateService } from "./authenticate";

interface AgilidadeSendRecordingsParams {
  Id: string;
  TipoChamada: string;
  DataHora: string;
  Telefone: string;
  AtendidaPor: string;
  Duracao: string;
  Gravacoes: { buffer: Buffer; fileName: string }[];
}

export interface SendRecordingsResponse {
  raw: string;
  [key: string]: unknown;
}

export class AgilidadeSendRecordingsService {
  private readonly BASE_URL =
    "https://agilidade-uat-10c1d06d1215.herokuapp.com";

  constructor(private readonly authService: AgilidadeAuthenticateService) {}

  async sendRecordings(
    params: AgilidadeSendRecordingsParams,
    retry = true,
  ): Promise<SendRecordingsResponse> {
    let token = this.authService.getToken();

    if (!token) {
      await this.authService.authenticate();
      token = this.authService.getToken();
    }

    const formData = new FormData();
    formData.append("Id", params.Id);
    formData.append("TipoChamada", params.TipoChamada);
    formData.append("DataHora", params.DataHora);
    formData.append("Telefone", params.Telefone);
    formData.append("AtendidaPor", params.AtendidaPor);
    formData.append("Duracao", params.Duracao);

    for (const gravacao of params.Gravacoes) {
      const blob = new Blob([gravacao.buffer], { type: "audio/wav" });
      formData.append("Gravacao", blob, gravacao.fileName);
    }

    const response = await fetch(`${this.BASE_URL}/pluricall/call_recording`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (response.status === 401 && retry) {
      await this.authService.authenticate();
      return this.sendRecordings(params, false);
    }

    const bodyText = await response.text().catch(() => "(sem body)");

    if (!response.ok) {
      const error = new Error(
        `Agilidade API error: ${response.status} ${response.statusText} — ${bodyText}`,
      ) as Error & { response: { status: number } };
      error.response = { status: response.status };
      throw error;
    }

    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(bodyText);
    } catch {
      parsed = {};
    }

    return { ...parsed, raw: bodyText };
  }
}
