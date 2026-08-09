import { Worker } from "bullmq";
import { AltitudeCreateContact } from "../../providers/altitude/create-contact.service";
import { altitudeAuthService } from "../../providers/altitude/auth.service";
import { redisConnection } from "../connection";
import { MssqlMinisomRepository } from "../../../../modules/minisom/repositories/mssql-minisom.repository";
import { MssqlServilusaRepository } from "../../../../modules/servilusa/repositories/mssql-servilusa.repository";
import { AgilidadeMssqlRepository } from "../../../../modules/agilidade/infra/mssql/agilidade-mssql-repository";
import { EndesaMssqlRepository } from "../../../../modules/endesa/infra/mssql/endesa-mssql-repository";
import { AltitudeEnvironment } from "../../providers/altitude/utils/resolve-altitude-config";

let worker: Worker | null = null;

type RepositoryType =
  | "minisomMeta"
  | "minisom21121"
  | "minisom21051"
  | "minisomCorporate"
  | "agilidade24041"
  | "servilusa"
  | "endesa22071"
  | "minisomTest";

const agilidadeRepository = new AgilidadeMssqlRepository();
const minisomRepository = new MssqlMinisomRepository();
const servilusaRepository = new MssqlServilusaRepository();
const endesaRepository = new EndesaMssqlRepository();

function createRepositoryHandler(
  genId: string,
  status: "LOADED" | "ERROR",
): Record<RepositoryType, () => Promise<void>> {
  return {
    minisomMeta: () => minisomRepository.updateStatus(genId, status),
    minisom21121: () => minisomRepository.updateStatus(genId, status),
    minisom21051: () => minisomRepository.updateStatus(genId, status),
    minisomTest: () => minisomRepository.updateStatus(genId, status),
    minisomCorporate: () =>
      minisomRepository.updateCorporateLeadStatus(genId, status),
    agilidade24041: () => agilidadeRepository.updateStatus(genId, status),
    servilusa: () => servilusaRepository.updateStatus(genId, status),
    endesa22071: () => endesaRepository.updateStatus(genId, status),
  };
}

export function startAltitudeWorker() {
  if (worker) return worker;

  const altitudeCreateContact = new AltitudeCreateContact(altitudeAuthService);

  worker = new Worker(
    "altitude-create-contact",
    async (job) => {
      const { payload, environment, genId, repository } = job.data as {
        payload: any;
        environment: AltitudeEnvironment;
        genId: string;
        repository: RepositoryType;
      };

      const successHandlers = createRepositoryHandler(genId, "LOADED");
      const errorHandlers = createRepositoryHandler(genId, "ERROR");

      try {
        await altitudeCreateContact.execute({ environment, payload });

        const handler = successHandlers[repository];
        if (!handler)
          throw new Error(`Handler não encontrado para ${repository}`);

        await handler();
      } catch (err: any) {
        console.error(
          `[${repository}] Erro no worker ao processar job ${genId}:`,
          err,
        );

        // Só marca ERROR na última tentativa
        const isLastAttempt = job.attemptsMade >= (job.opts.attempts ?? 1) - 1;

        if (isLastAttempt) {
          const errorHandler = errorHandlers[repository];
          if (!errorHandler) {
            console.error(`Handler de erro não encontrado para ${repository}`);
          } else {
            await errorHandler();
          }
        }

        throw err;
      }
    },
    {
      connection: redisConnection,
      concurrency: 1,
      settings: {
        backoffStrategy: (attemptsMade: number) => {
          const delays: Record<number, number> = {
            1: 10_000, // 10s
            2: 30_000, // 30s
            3: 60_000, // 1min
            4: 7_200_000, // 2h
          };
          return delays[attemptsMade] ?? 7_200_000;
        },
      },
    },
  );

  worker.on("failed", (job, err) => {
    console.error({
      repository: job?.data?.repository,
      jobId: job?.id,
      status: "error",
      error: err instanceof Error ? err.message : String(err),
    });
  });

  worker.on("completed", (job) => {
    console.log({
      repository: job?.data?.repository,
      jobId: job?.id,
      status: "completed",
    });
  });

  return worker;
}
