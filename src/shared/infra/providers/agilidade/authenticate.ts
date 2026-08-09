import { env } from "../../../../env";

interface AuthenticateResponse {
  access_token: string;
  token_type: string;
}

export class AgilidadeAuthenticateService {
  constructor(
    private readonly username: string,
    private readonly password: string,
  ) {}

  private readonly BASE_URL =
    "https://agilidade-uat-10c1d06d1215.herokuapp.com";

  private token: string | null = null;

  async authenticate(): Promise<void> {
    const response = await fetch(`${this.BASE_URL}/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        username: this.username,
        password: this.password,
      }),
    });

    if (!response.ok) {
      throw new Error(`Falha na autenticação Agilidade: ${response.status}`);
    }

    const data = (await response.json()) as AuthenticateResponse;
    this.token = data.access_token;
  }

  getToken(): string | null {
    return this.token;
  }
}

export const agilidadeAuthService = new AgilidadeAuthenticateService(
  env.AGILIDADE_API_USERNAME,
  env.AGILIDADE_API_PASSWORD,
);
