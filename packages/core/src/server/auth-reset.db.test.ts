import { beforeEach, describe, expect, it } from 'vitest';
import { like } from 'drizzle-orm';
import { ctx } from './context.ts';
import { createAuth } from './auth-factory.ts';
import { randomId } from './crypto.ts';
import { verification } from './db/schema.ts';
import { resetDb } from '../../tests/helpers/db.ts';

const auth = () =>
	createAuth({ db: ctx().db, baseURL: 'http://localhost:5173', secret: ctx().config.authSecret });

describe('password reset', () => {
	beforeEach(resetDb);

	it("forgets the person's trusted devices, and only theirs", async () => {
		const a = auth();
		const { user } = await a.api.signUpEmail({
			body: { name: 'Ada', email: 'ada@example.com', password: 'old password 1!' }
		});
		const later = new Date(Date.now() + 86_400_000);
		await ctx()
			.db.insert(verification)
			.values([
				{ id: randomId(), identifier: 'trust-device-ada', value: user.id, expiresAt: later },
				{
					id: randomId(),
					identifier: 'trust-device-other',
					value: 'someone-else',
					expiresAt: later
				}
			]);
		await a.api.requestPasswordReset({ body: { email: 'ada@example.com' } });
		const [reset] = await ctx()
			.db.select()
			.from(verification)
			.where(like(verification.identifier, 'reset-password:%'));
		await a.api.resetPassword({
			body: { newPassword: 'new password 2!', token: reset.identifier.split(':')[1] }
		});
		const trusted = await ctx()
			.db.select({ value: verification.value })
			.from(verification)
			.where(like(verification.identifier, 'trust-device-%'));
		expect(trusted).toEqual([{ value: 'someone-else' }]);
	});
});
