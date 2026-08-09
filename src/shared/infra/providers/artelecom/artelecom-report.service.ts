export type ArtelecomReportRow = {
  numero: number;
  chamadas: number;
  ultimaChamada: string;
};

export class ArtelecomReportService {
  private readonly BASE_URL = "https://api.artelecom.pt/multimedia";
  private readonly API_KEY = "heLuyJmZiXgT2VT5b36M1a9Gqqhxhar5";

  async downloadCSV(
    ivrId: number,
    statisticTypeId: number,
  ): Promise<ArtelecomReportRow[]> {
    const today = new Date().toISOString().slice(0, 10);

    const params = new URLSearchParams({
      apiKey: this.API_KEY,
      startDate: `" ${today} 00:00"`,
      endDate: `" ${today} 23:59"`,
      download: "csv",
    });

    const url = `${this.BASE_URL}/ivrs/${ivrId}/statistics/${statisticTypeId}/details?${params}`;

    const response = await fetch(url, {
      headers: {
        Accept: "application/json,text/csv,*/*",
        "User-Agent": "Mozilla/5.0",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Artelecom API error: ${response.status} ${response.statusText}`,
      );
    }

    const buffer = await response.arrayBuffer();
    const raw = Buffer.from(buffer).toString("utf-8").trim();
    return this.normalize(raw);
  }

  private normalize(raw: string): ArtelecomReportRow[] {
    const parsed = JSON.parse(raw);

    if (parsed.names && parsed.values) {
      return parsed.values.map((row: any[]) => ({
        numero: Number(row[0]),
        chamadas: Number(row[1]),
        ultimaChamada: row[2],
      }));
    }

    throw new Error("Formato desconhecido da API Artelecom");
  }
}

export function makeArtelecomReportService() {
  return new ArtelecomReportService();
}
