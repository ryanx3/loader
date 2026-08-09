import cron from "node-cron";
import { makeVmOutUseCase } from "../../modules/vm-out/use-cases/factories/vm-out.factory";

export function vmOutCron() {
  const vmOutUseCase = makeVmOutUseCase();

  cron.schedule("*/10 * * * *", async () => {
    const id = crypto.randomUUID().slice(0, 8);
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();

    if ((hour === 23 && minute >= 50) || hour === 0) {
      return;
    }
    await vmOutUseCase.execute();
    console.log(`[${id}] FIM - vm out`);
  });
}
