import { GetClientRecordingsUseCase } from "./src/migrating/use-cases/recordings/get-client-recordings";
import { UploadRecordingsUseCase } from "./src/migrating/use-cases/recordings/upload-recordings";

const getClientRecordingsUseCase = new GetClientRecordingsUseCase();
const uploadRecordingsUseCase = new UploadRecordingsUseCase();

function getDateRange(start: string, end: string): string[] {
  const dates: string[] = [];
  let current = new Date(start);
  const endDate = new Date(end);

  while (current <= endDate) {
    dates.push(current.toISOString().split("T")[0]);
    current = new Date(current.setDate(current.getDate() + 1));
  }

  return dates;
}

async function runBackfill() {
  console.log("🔄 Iniciando backfill personalizado...");

  const { clientRecord } = await getClientRecordingsUseCase.execute();
  const clients = clientRecord.filter((c) => c.clientName === "Agilidade");

  const days = getDateRange("2026-02-23", "2026-03-09");

  console.log(`📅 ${days.length} dias | 👥 ${clients.length} clientes`);
  console.log(`Total de execuções: ${days.length * clients.length}\n`);

  let success = 0;
  let failed = 0;

  for (const day of days) {
    console.log(`\n━━━ ${day} ━━━`);

    for (const client of clients) {
      console.log(`  ▶ ${client.clientName} (${client.ct_})...`);

      try {
        await uploadRecordingsUseCase.execute({
          ctName: client.ct_,
          day,
          percentDifferentsResult: client.percentDifferentsResult,
          driveId: client.driveId,
          isBd: client.isBd,
          folderPath: client.folderPath,
          isHistorical: client.isHistorical,
          resultsNotInFivePercent: client.resultsNotInFivePercent,
        });

        console.log(`  ✅ OK`);
        success++;
      } catch (err) {
        console.error(`  ❌ Erro: ${err}`);
        failed++;
      }
    }
  }

  console.log(`\n🏁 Backfill concluído: ${success} OK | ${failed} erros`);
}

// Rodar
runBackfill().catch(console.error);
