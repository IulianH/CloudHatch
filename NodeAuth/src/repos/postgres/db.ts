import {
  Pool,
  PoolClient,
  QueryResult,
  QueryResultRow,
} from "pg";

import { config } from "../../config";

let pool: Pool | null = null;

const createPool = (): Pool => {
  const ssl = config.postgres.useSsl
    ? { rejectUnauthorized: false }
    : undefined;

  return new Pool({
    host: config.postgres.host,
    port: config.postgres.port,
    user: config.postgres.user,
    password: config.postgres.password,
    database: config.postgres.database,
    ssl,
  });
};

export const getPgPool = (): Pool => {
  if (!pool) {
    pool = createPool();
  }
  return pool;
};

export const withPgClientAsync = async <T>(
  action: (client: PoolClient) => Promise<T>,
): Promise<T> => {
  const client = await getPgPool().connect();
  try {
    return await action(client);
  } finally {
    client.release();
  }
};

export const queryAsync = async <T extends QueryResultRow = QueryResultRow>(
  queryText: string,
  params: unknown[] = [],
): Promise<QueryResult<T>> => getPgPool().query<T>(queryText, params);

export const closePgPoolAsync = async (): Promise<void> => {
  if (!pool) {
    return;
  }

  const currentPool = pool;
  pool = null;
  await currentPool.end();
};
