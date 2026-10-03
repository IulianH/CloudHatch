import { closePgPoolAsync } from "./db";
import { migratePostgresSchemaAsync } from "./migrate";

// One-off schema migration runner: `npm run migrate`.
// Connection settings come from the environment (see src/config), e.g.:
//   POSTGRES_HOST=... POSTGRES_PORT=5432 POSTGRES_USER=... \
//   POSTGRES_PASSWORD=... POSTGRES_DB=... POSTGRES_USE_SSL=true npm run migrate
const runAsync = async (): Promise<void> => {
  try {
    await migratePostgresSchemaAsync();
    console.log("Migration completed.");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exitCode = 1;
  } finally {
    await closePgPoolAsync();
  }
};

void runAsync();
