/** Exits 0 when the test database's Postgres port answers, so pre-push can run the DB tests. */
import { existsSync } from 'node:fs';
import { connect } from 'node:net';

if (!process.env.TEST_DATABASE_URL && existsSync('.env')) process.loadEnvFile('.env');
const url = new URL(process.env.TEST_DATABASE_URL ?? 'postgres://localhost:5435/deteck_test');
const socket = connect({ host: url.hostname, port: Number(url.port || 5432) });
socket.setTimeout(1500);
socket.on('connect', () => {
	socket.end();
	process.exit(0);
});
for (const event of ['error', 'timeout']) socket.on(event, () => process.exit(1));
