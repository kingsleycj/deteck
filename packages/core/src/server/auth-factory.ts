import { betterAuth } from 'better-auth/minimal';
import { APIError } from 'better-auth/api';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { organization } from 'better-auth/plugins/organization';
import { twoFactor } from 'better-auth/plugins/two-factor';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { and, eq, like } from 'drizzle-orm';
import type { Db } from './db/client.ts';
import { verification } from './db/schema.ts';
import { sendEmail } from './email/index.ts';
import { emailTemplates } from './email/templates.ts';

/** Error message used when anyone asks for an emailed sign-in code (they are switched off). */
export const EMAIL_CODES_OFF = 'EMAIL_CODES_OFF';

export interface AuthFactoryOptions {
	db: Db;
	baseURL: string;
	secret: string;
	/** Pass SvelteKit's getRequestEvent inside the app; omit in scripts and tests. */
	getRequestEvent?: Parameters<typeof sveltekitCookies>[0];
}

/** Display names for the two manufacturer roles (Better Auth calls them admin and member). */
export const MANUFACTURER_ROLE_LABEL: Record<string, string> = {
	admin: 'Admin',
	member: 'Uploader'
};

export function createAuth(options: AuthFactoryOptions) {
	const baseURL = options.baseURL.replace(/\/$/, '');
	return betterAuth({
		appName: 'DETECK',
		baseURL,
		secret: options.secret,
		database: drizzleAdapter(options.db, { provider: 'pg' }),
		emailAndPassword: {
			enabled: true,
			minPasswordLength: 10,
			maxPasswordLength: 128,
			autoSignIn: false,
			resetPasswordTokenExpiresIn: 60 * 30,
			revokeSessionsOnPasswordReset: true,
			// A new password also forgets every "trusted" device: whoever trusted one with the old
			// password must pass two-step sign-in again.
			onPasswordReset: async ({ user }) => {
				await options.db
					.delete(verification)
					.where(
						and(like(verification.identifier, 'trust-device-%'), eq(verification.value, user.id))
					);
			},
			sendResetPassword: async ({ user, token }) => {
				await sendEmail(
					emailTemplates.resetPassword({
						to: user.email,
						name: user.name,
						url: `${baseURL}/business/reset-password?token=${encodeURIComponent(token)}`
					})
				);
			}
		},
		user: {
			additionalFields: {
				/** DETECK staff role: "admin" or "reviewer". Empty for manufacturer users. */
				platformRole: { type: 'string', required: false, input: false }
			}
		},
		session: {
			expiresIn: 60 * 60 * 12,
			updateAge: 60 * 60
		},
		plugins: [
			organization({
				allowUserToCreateOrganization: false,
				creatorRole: 'admin',
				invitationExpiresIn: 60 * 60 * 24 * 7,
				cancelPendingInvitationsOnReInvite: true,
				sendInvitationEmail: async (data) => {
					await sendEmail(
						emailTemplates.manufacturerInvite({
							to: data.email,
							inviter: data.inviter.user.name,
							company: data.organization.name,
							role: MANUFACTURER_ROLE_LABEL[data.role] ?? data.role,
							url: `${baseURL}/business/join/${encodeURIComponent(data.id)}`
						})
					);
				}
			}),
			twoFactor({
				issuer: 'DETECK',
				otpOptions: {
					period: 5,
					storeOTP: 'hashed',
					// Emailed codes are switched off for everyone: an inbox alone must never be enough to
					// take over an account (D-12, audit decision 4). Lost phones are handled by a reset.
					sendOTP: async () => {
						throw new APIError('FORBIDDEN', { message: EMAIL_CODES_OFF });
					}
				}
			}),
			// Must stay last, per Better Auth's SvelteKit integration.
			...(options.getRequestEvent ? [sveltekitCookies(options.getRequestEvent)] : [])
		]
	});
}

export type Auth = ReturnType<typeof createAuth>;
