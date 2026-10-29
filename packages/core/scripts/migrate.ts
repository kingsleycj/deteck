// Usage: pnpm db:migrate   (Render runs this before each deploy)
import { runMigrations } from '../src/server/db/migrate.ts';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');

await runMigrations(url);
console.info('Migrations applied.');
