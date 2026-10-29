/**
 * Entry point for the Better Auth CLI (`pnpm auth:schema`), which only reads
 * the configuration to generate tables. It never connects to the database.
 */
import { createDb } from './db/client.ts';
import { createAuth } from './auth-factory.ts';

export const auth = createAuth({
	db: createDb('postgres://schema-generation@localhost/none'),
	baseURL: 'http://localhost:5173',
	secret: 'schema-generation-only-secret-000000000'
});
