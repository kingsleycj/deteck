import type { EmailMessage } from './index.ts';

const signature = "\n\nDETECK\nIf you weren't expecting this email, you can ignore it.";

export const emailTemplates = {
	resetPassword: (p: { to: string; name: string; url: string }): EmailMessage => ({
		to: p.to,
		subject: 'Reset your DETECK password',
		text: `Hi ${p.name},\n\nUse this link to set a new password. It works once and expires in 30 minutes:\n${p.url}${signature}`
	}),
	staffRestored: (p: {
		to: string;
		name: string;
		by: string;
		role: string;
		url: string;
	}): EmailMessage => ({
		to: p.to,
		subject: 'Your DETECK team access is back',
		text: `Hi ${p.name},\n\n${p.by} restored your access to the DETECK team as ${p.role}. Sign in with your usual email and password:\n${p.url}\n\nForgot your password? Use "Forgot password" on the sign-in page.${signature}`
	}),
	twoFactorReset: (p: { to: string; name: string; by: string }): EmailMessage => ({
		to: p.to,
		subject: 'Your DETECK two-step sign-in was reset',
		text: `Hi ${p.name},\n\n${p.by} reset your two-step sign-in on DETECK, and you've been signed out everywhere. Next time you sign in, you'll scan a new QR code with your authenticator app and get new backup codes.\n\nIf you didn't ask for this, tell your company admin or reply to this email straight away.`
	}),
	manufacturerInvite: (p: {
		to: string;
		inviter: string;
		company: string;
		role: string;
		url: string;
	}): EmailMessage => ({
		to: p.to,
		subject: `${p.inviter} invited you to ${p.company} on DETECK`,
		text: `${p.inviter} invited you to join ${p.company} on DETECK as ${p.role}.\n\nCreate your account here. The invite works once and expires in 7 days:\n${p.url}${signature}`
	}),
	staffInvite: (p: {
		to: string;
		inviter: string;
		role: string;
		note?: string;
		url: string;
	}): EmailMessage => ({
		to: p.to,
		subject: `${p.inviter} invited you to the DETECK team`,
		text: `You've been invited to join the DETECK team as ${p.role}.${p.note ? `\n\n${p.inviter} wrote: "${p.note}"` : ''}\n\nCreate your account here. The invite works once and expires in 7 days:\n${p.url}${signature}`
	}),
	applicationReceived: (p: { to: string; company: string }): EmailMessage => ({
		to: p.to,
		subject: 'We received your DETECK application',
		text: `Thank you for registering ${p.company}. A DETECK reviewer will check your details and documents. We'll email you when there's a decision.${signature}`
	}),
	applicationDecision: (p: {
		to: string;
		company: string;
		decision: 'approved' | 'rejected' | 'info_requested' | 'suspended' | 'reinstated';
		reason: string;
		url: string;
	}): EmailMessage => {
		const subjects = {
			approved: `${p.company} is approved on DETECK`,
			rejected: `Your DETECK application for ${p.company}`,
			info_requested: `DETECK needs more information about ${p.company}`,
			suspended: `${p.company}'s records are paused on DETECK`,
			reinstated: `${p.company}'s records are active again on DETECK`
		};
		const bodies = {
			approved:
				'Your company is approved. You can now add your products, batches, serials and supply chain records.',
			rejected: 'We could not approve your application.',
			info_requested: 'We need more information before we can approve your application.',
			suspended:
				"Your company's records have been paused, so checks of your serials will not show as Valid for now.",
			reinstated: "Your company's records are active again."
		};
		return {
			to: p.to,
			subject: subjects[p.decision],
			text: `${bodies[p.decision]}\n\nReason given by the reviewer: ${p.reason}\n\nOpen DETECK: ${p.url}${signature}`
		};
	},
	/** For pharmacies, hospitals and distributors (manufacturers get applicationDecision). */
	businessDecision: (p: {
		to: string;
		business: string;
		decision: 'approved' | 'rejected' | 'info_requested' | 'suspended' | 'reinstated';
		reason: string;
		url: string;
	}): EmailMessage => {
		const subjects = {
			approved: `${p.business} is approved on DETECK`,
			rejected: `Your DETECK application for ${p.business}`,
			info_requested: `DETECK needs more information about ${p.business}`,
			suspended: `${p.business}'s DETECK account is paused`,
			reinstated: `${p.business}'s DETECK account is active again`
		};
		const bodies = {
			approved:
				'Your business is approved. You can now check deliveries and confirm the packs you receive. Packs you confirm show your business, Verified by DETECK, on their journey.',
			rejected: 'We could not approve your application.',
			info_requested: 'We need more information before we can approve your application.',
			suspended:
				"Your business account is paused. You can't check deliveries or confirm receipts for now, and journeys don't show your business as Verified by DETECK.",
			reinstated:
				'Your business account is active again. You can check deliveries and confirm receipts.'
		};
		return {
			to: p.to,
			subject: subjects[p.decision],
			text: `${bodies[p.decision]}\n\nReason given by DETECK: ${p.reason}\n\nOpen DETECK: ${p.url}${signature}`
		};
	},
	goLiveDecision: (p: {
		to: string;
		company: string;
		approved: boolean;
		note: string;
		url: string;
	}): EmailMessage => ({
		to: p.to,
		subject: p.approved
			? `${p.company}'s records are now live on DETECK`
			: `Changes requested for ${p.company} on DETECK`,
		text: `${
			p.approved
				? 'Your records are live. Anyone who checks one of your serials now gets a real answer.'
				: 'A DETECK reviewer asked for changes before your records go live.'
		}${p.note ? `\n\nReviewer note: ${p.note}` : ''}\n\nOpen DETECK: ${p.url}${signature}`
	}),
	// Recall alert emails are written in the subscriber's language: see alerts.ts and messages/dict.
	recordCorrected: (p: {
		to: string;
		drug: string;
		lot: string;
		what: string;
		reason: string;
	}): EmailMessage => ({
		to: p.to,
		subject: `DETECK corrected a record: ${p.drug} batch ${p.lot}`,
		text: `DETECK corrected a record for ${p.drug} batch ${p.lot}.\n\n${p.what}\n\nReason: ${p.reason}\n\nThe change is in your audit trail. If it looks wrong, reply to this email.${signature}`
	}),
	reportReceived: (p: { to: string; drug: string; url: string }): EmailMessage => ({
		to: p.to,
		subject: `Suspected fake reported: ${p.drug}`,
		text: `Someone reported a pack of ${p.drug} they think may be fake. Contact details of the person reporting are never shared.\n\nSee the report:\n${p.url}${signature}`
	})
};
