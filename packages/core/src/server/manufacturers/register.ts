import { eq, isNotNull, sql } from 'drizzle-orm';
import { z } from 'zod';
import { NIGERIAN_STATES } from '../../nigeria.ts';
import { audit, type Actor } from '../audit.ts';
import type { Auth } from '../auth-factory.ts';
import { ctx } from '../context.ts';
import { randomId } from '../crypto.ts';
import { document, manufacturer, member, organization, user } from '../db/schema.ts';
import { sendEmail } from '../email/index.ts';
import { emailTemplates } from '../email/templates.ts';
import { putObject, storageKey } from '../storage.ts';
import { documentProblem, documentType, type UploadedFile } from '../uploads.ts';

const optionalText = (max: number) =>
	z
		.string()
		.trim()
		.max(max)
		.transform((v) => (v === '' ? undefined : v))
		.optional();

/** PRD US-05.1: company name, address, contact person and NAFDAC company registration. */
export const registrationSchema = z.object({
	companyName: z.string().trim().min(2, 'Enter the company name.').max(160),
	address: z.string().trim().min(5, 'Enter the company address.').max(300),
	state: z.enum(NIGERIAN_STATES, { error: 'Choose a state.' }),
	factoryTown: optionalText(80),
	nafdacCompanyReg: z
		.string()
		.trim()
		.min(3, 'Copy the registration number from the NAFDAC certificate.')
		.max(60),
	cacRc: optionalText(30),
	contactName: z.string().trim().min(2, 'Enter your full name.').max(120),
	contactEmail: z
		.email('This email is missing something, like .com or .ng.')
		.max(200)
		.toLowerCase(),
	contactPhone: optionalText(30),
	// Same rule as invites and password resets.
	password: z
		.string()
		.min(10, 'Use at least 10 characters.')
		.max(128)
		.refine(
			(p) => /\d/.test(p) && /[^A-Za-z0-9]/.test(p),
			'Include at least one number and one symbol.'
		)
});

export type RegistrationInput = z.infer<typeof registrationSchema>;

export type RegistrationResult =
	| { ok: true; manufacturerId: string; userId: string }
	| { ok: false; errors: Record<string, string> };

function slugify(name: string) {
	return `${name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '')
		.slice(0, 40)}-${randomId(3).toLowerCase()}`;
}

/** Emails every DETECK staff member (new applications, alerts). */
export async function notifyStaff(subject: string, text: string) {
	const staff = await ctx()
		.db.select({ email: user.email })
		.from(user)
		.where(isNotNull(user.platformRole));
	await Promise.allSettled(staff.map((s) => sendEmail({ to: s.email, subject, text })));
}

/**
 * Self-service registration (D-01): creates the admin user, the Better Auth
 * organisation, the manufacturer record (Pending) and stores the documents.
 */
export async function registerManufacturer(
	auth: Auth,
	raw: Record<string, unknown>,
	files: { nafdacCertificate: UploadedFile | null; agreement: UploadedFile | null },
	meta: Pick<Actor, 'ip' | 'userAgent'>
): Promise<RegistrationResult> {
	const parsed = registrationSchema.safeParse(raw);
	const errors: Record<string, string> = {};
	if (!parsed.success) {
		for (const issue of parsed.error.issues) {
			const key = String(issue.path[0] ?? 'form');
			errors[key] ??= issue.message;
		}
	}
	if (!files.nafdacCertificate) errors.nafdacCertificate = 'Upload the NAFDAC certificate.';
	const certProblem = documentProblem(files.nafdacCertificate, 'The NAFDAC certificate');
	if (certProblem) errors.nafdacCertificate = certProblem;
	const agreementProblem = documentProblem(files.agreement, 'The agreement');
	if (agreementProblem) errors.agreement = agreementProblem;
	if (!parsed.success || Object.keys(errors).length > 0) return { ok: false, errors };

	const input = parsed.data;
	const { db } = ctx();

	const [duplicate] = await db
		.select({
			id: manufacturer.id,
			name: manufacturer.companyName,
			reg: manufacturer.nafdacCompanyReg
		})
		.from(manufacturer)
		.where(
			sql`lower(${manufacturer.companyName}) = lower(${input.companyName}) or lower(${manufacturer.nafdacCompanyReg}) = lower(${input.nafdacCompanyReg})`
		)
		.limit(1);
	if (duplicate) {
		return {
			ok: false,
			errors:
				duplicate.name.toLowerCase() === input.companyName.toLowerCase()
					? {
							companyName:
								'A company with this name is already registered. If it is yours, sign in instead.'
						}
					: {
							nafdacCompanyReg:
								'This NAFDAC registration number is already registered. Contact DETECK if this is a mistake.'
						}
		};
	}
	const [existingUser] = await db
		.select({ id: user.id })
		.from(user)
		.where(eq(user.email, input.contactEmail))
		.limit(1);
	if (existingUser)
		return {
			ok: false,
			errors: { contactEmail: 'An account with this email already exists. Sign in instead.' }
		};

	const created = await auth.api.signUpEmail({
		body: { name: input.contactName, email: input.contactEmail, password: input.password }
	});
	const userId = created.user.id;

	try {
		const manufacturerId = await db.transaction(async (tx) => {
			const orgId = randomId(16);
			await tx.insert(organization).values({
				id: orgId,
				name: input.companyName,
				slug: slugify(input.companyName),
				createdAt: new Date()
			});
			await tx.insert(member).values({
				id: randomId(16),
				organizationId: orgId,
				userId,
				role: 'admin',
				createdAt: new Date()
			});
			const [m] = await tx
				.insert(manufacturer)
				.values({
					organizationId: orgId,
					companyName: input.companyName,
					address: input.address,
					state: input.state,
					factoryTown: input.factoryTown,
					nafdacCompanyReg: input.nafdacCompanyReg,
					cacRc: input.cacRc,
					contactName: input.contactName,
					contactEmail: input.contactEmail,
					contactPhone: input.contactPhone,
					status: 'pending'
				})
				.returning({ id: manufacturer.id });

			for (const [kind, file] of [
				['nafdac_certificate', files.nafdacCertificate],
				['data_sharing_agreement', files.agreement]
			] as const) {
				if (!file) continue;
				const key = storageKey('documents', m.id, file.name, randomId(8));
				await putObject(key, file.bytes, documentType(file)!);
				await tx.insert(document).values({
					manufacturerId: m.id,
					kind,
					fileKey: key,
					fileName: file.name,
					contentType: documentType(file)!,
					sizeBytes: file.bytes.length,
					uploadedBy: userId
				});
			}

			await audit(
				{ userId, label: input.contactName, role: 'Manufacturer admin', ...meta },
				{
					area: 'Manufacturer board',
					action: 'register',
					itemType: 'manufacturer',
					itemId: m.id,
					manufacturerId: m.id,
					summary: `Registered ${input.companyName} (pending DETECK approval)`,
					after: {
						companyName: input.companyName,
						nafdacCompanyReg: input.nafdacCompanyReg,
						state: input.state
					}
				},
				tx
			);
			return m.id;
		});

		await Promise.allSettled([
			sendEmail(
				emailTemplates.applicationReceived({ to: input.contactEmail, company: input.companyName })
			),
			notifyStaff(
				`New manufacturer application: ${input.companyName}`,
				`${input.companyName} registered on DETECK and is waiting for review.\n\nOpen the queue: ${ctx().config.origin}/console/applications/${manufacturerId}`
			)
		]);
		return { ok: true, manufacturerId, userId };
	} catch (err) {
		// Don't leave an account without a company behind.
		await db.delete(user).where(eq(user.id, userId));
		throw err;
	}
}
