export type PartyRoleName =
	'manufacturer' | 'distributor' | 'wholesaler' | 'pharmacy' | 'hospital' | 'other';

/** Public journey data. Only these fields ever leave the server (PRD US-03.2). */
export type JourneyStep =
	| {
			kind: 'manufacturer';
			name: string;
			place: string;
			lot: string;
			manufactureDate: string | null;
			expiryDate: string;
	  }
	| {
			kind: 'party';
			name: string;
			role: PartyRoleName;
			place: string | null;
			/** Date the business received it, when recorded. */
			date: string | null;
			verified: boolean;
			/** The business itself confirmed receiving this pack on DETECK. */
			confirmed?: boolean;
	  }
	| { kind: 'gap'; afterName: string; beforeName: string };

export type JourneyState = 'TO_RETAIL' | 'ENDS_BEFORE_RETAIL' | 'BATCH_LEVEL' | 'NONE';

export interface Journey {
	state: JourneyState;
	steps: JourneyStep[];
	/** The last business the records name, for the summary line. */
	lastHolder?: { name: string; role: PartyRoleName; place: string | null; date: string | null };
	recordedSteps: number;
	gaps: number;
}
