import sql from "mssql";
import { ClientEnvironment, resolveDbConfig } from "./utils/resolve-db-config";

const dbPools: Map<string, sql.ConnectionPool> = new Map();

export async function connectPluricallDb(
  environment: ClientEnvironment,
  db?: string,
): Promise<sql.ConnectionPool> {
  const config = resolveDbConfig(environment, db);
  const poolKey = `${config.server}:${config.database}`;

  const existing = dbPools.get(poolKey);
  if (existing && existing.connected) {
    return existing;
  }

  const sqlConfig = {
    user: config.user,
    password: config.password,
    server: config.server,
    port: Number(config.port),
    database: db || config.database,
    options: {
      encrypt: false,
      trustServerCertificate: true,
      requestTimeout: 600000,
    },
  };

  try {
    const pool = new sql.ConnectionPool(sqlConfig);
    await pool.connect();
    dbPools.set(config.database, pool);
    return pool;
  } catch (err) {
    console.error("❌ Erro ao conectar no PUMA DB:", err);
    throw err;
  }
}
