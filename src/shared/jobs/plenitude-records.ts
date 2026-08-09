import cron from "node-cron";
import { makePlenitudeRecordingsUseCase } from "../../modules/plenitude/application/factories/make-plenitude-recordings";

const useCase = makePlenitudeRecordingsUseCase();

export async function plenitudeRecordingsJob() {
  cron.schedule("0 7 * * *", async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const year = yesterday.getFullYear();
    const month = String(yesterday.getMonth() + 1).padStart(2, "0");
    const day = String(yesterday.getDate()).padStart(2, "0");

    const dateStr = `${year}-${month}-${day}`;
    await useCase.execute({
      initialDate: dateStr,
      endDate: dateStr,
    });
  });
}
