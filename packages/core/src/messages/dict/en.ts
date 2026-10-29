/**
 * Every sentence the public sees, in English. This is the source for the other languages: each
 * of them has exactly these keys (the type checker enforces it).
 *
 * Writing rules (PRD tone of voice): never say "safe", "genuine", "real" or "100%"; say what the
 * records show; when information is missing, say so and suggest a next step.
 *
 * Format: plain text. {name} is filled in by the code. **text** is shown in bold. Pairs of
 * { one, other } are chosen by number. Keep every {placeholder} when translating.
 */
export const en = {
	meta: {
		/** The language's own name, shown in the language menu. */
		name: 'English',
		/** False until a native speaker has checked the translation (shows a notice). */
		reviewed: true
	},

	common: {
		or: 'or',
		and: 'and',
		back: 'Back',
		checkMedicine: 'Check a medicine',
		checkAnother: 'Check another medicine',
		checkSerial: 'Check a serial',
		language: 'Language',
		draftNotice: '',
		englishOnly: 'This page is in English.',
		notRecorded: 'Not recorded',
		dateNotRecorded: 'Date not recorded'
	},

	nav: {
		home: 'Deteck home',
		main: 'Main',
		how: 'How it works',
		pharmacies: 'For pharmacies',
		manufacturers: 'For manufacturers',
		badge: 'No DETECK charge'
	},

	footer: {
		about: 'About DETECK',
		check: 'Check a medicine',
		privacy: 'Privacy',
		terms: 'Terms',
		business: 'For manufacturers and pharmacies',
		developers: 'Developers',
		note: 'Results depend on the records manufacturers share with DETECK.'
	},

	check: {
		metaTitle: 'DETECK · Check your medicine',
		metaDescription:
			"Type the serial number on a medicine pack and check it against the manufacturer's records. No account and no DETECK charge.",
		pilotOn:
			'Pilot features are on in this browser for 90 days, including the packaging check (beta).',
		greeting: "Hi, I'm Deteck. Type the serial number on your pack and I'll check it for you.",
		title: 'Check your medicine',
		subtitle: "See if it matches the manufacturer's records.",
		label: 'Serial number',
		placeholder: 'e.g. 7K4M 9QX2 TB8D',
		hint: 'Look near the barcode, after **SN** or **Serial**.',
		submit: 'Check medicine',
		scan: 'Scan the code instead',
		footer:
			'Serial checks work on 2G and 3G. No account needed. No DETECK charge; normal data charges apply.',
		humanPrompt:
			"**Checking a lot of packs?** Confirm you're a person to carry on without waiting.",
		humanButton: 'Continue checking',
		humanFailed: 'Please complete the "are you human?" check.',
		asideLabel: 'What DETECK checks',
		asideTitle: 'What Deteck checks',
		asideSerial: "**The serial.** Does it match the manufacturer's records?",
		asidePackaging:
			"**The packaging.** AI looks for visible differences from the manufacturer's pack.",
		asideJourney: '**The journey.** Which businesses the records say handled it.',
		asideNote: "Deteck says what the records show. It can't test what's inside a pack.",
		checkingTitle: 'Checking the records…',
		checkingBody: "Deteck is matching your serial with the manufacturer's records.",
		retry: 'Retry',
		tryAgain: 'Try again'
	},

	format: {
		empty: 'Type the serial number printed on the pack.',
		too_short: "That's too short for a serial number. Serials have at least 4 letters or numbers.",
		too_long:
			"That's longer than a serial number (up to 20 letters and numbers). Check you've typed only the serial.",
		bad_characters: 'Use only the letters and numbers printed after SN on the pack.',
		nafdac_number:
			'That looks like a NAFDAC registration number. The serial is a different code, usually printed after SN near the barcode.',
		bad_code: "We couldn't read that code. Type the serial printed after SN instead.",
		mascot:
			"Hmm, that doesn't look like a serial number yet. Your typing stays in the box so you only fix what's wrong."
	},

	network: {
		slow: 'The network is slow. Tap Retry. I kept your serial.',
		slowServer:
			'The records took too long to answer. Your serial is still in the box: tap Check medicine to try again.',
		offlineTitle: "I couldn't reach the records",
		offlineBody:
			'Your phone seems to be offline. Your serial is still in the box, so you can tap Check again when the signal is back.',
		rateLimited: {
			one: 'Too many checks in a short time. Please wait {n} minute and try again.',
			other: 'Too many checks in a short time. Please wait {n} minutes and try again.'
		}
	},

	result: {
		metaExpired: 'Result expired',
		head: 'Result',
		backAria: 'Back to home',
		serialAria: 'Serial checked',
		heading: 'Result: {badges}',
		expiredTitle: 'This result has expired',
		expiredBody:
			'Results are kept for 30 minutes. Check the serial again to see the latest records.',
		batchLabel: 'Batch number',
		batchHelp: 'Printed after LOT, BN or Batch on the pack.',
		batchMissing: 'Type the batch number printed on the pack.',
		batchNotMatched:
			"That batch number doesn't match the records for this serial. Check the batch printed after LOT, BN or Batch and type it again.",
		continue: 'Continue',
		detailsAria: 'Record details',
		product: 'Product',
		manufacturer: 'Manufacturer',
		nafdac: 'NAFDAC reg. no.',
		batch: 'Batch',
		expires: 'Expires',
		expired: 'Expired',
		pack: 'Pack',
		reasonsIntro: 'This can happen when:',
		journeyLink: "See the drug's journey",
		checkPackaging: 'Check the packaging (beta)',
		scanCode: 'Scan the code instead',
		retype: 'Re-type the serial',
		report: 'Report a suspected fake',
		worried: 'Worried about this pack anyway?',
		worriedLink: 'Report it to DETECK',
		journeyStillStands: 'The serial result still stands.',
		footnote:
			"This shows what the manufacturer's records say. It isn't a lab test of what's inside the pack.",

		thisMedicine: 'this medicine',
		theManufacturer: 'the manufacturer',
		TheManufacturer: 'The manufacturer',
		askPharmacist: 'Ask a pharmacist before you use it.',
		coverage: 'So far DETECK has records for {products} from {manufacturers}.',
		products: { one: '{n} product', other: '{n} products' },
		manufacturers: { one: '{n} manufacturer', other: '{n} manufacturers' },

		valid: {
			badge: 'VALID',
			bubble: "This serial matches {maker}'s records for {product}."
		},
		mismatch: {
			badge: 'CHECK THE PACK',
			title: "The pack doesn't match the record",
			bubbleLot:
				"This serial matches {maker}'s records for {product}, but the batch number printed on this pack is different from the record.",
			bubbleExpiry:
				"This serial matches {maker}'s records for {product}, but the expiry date printed on this pack is different from the record.",
			nextStep: 'Show this result to a pharmacist before you use it, and keep the pack.'
		},
		expiredPack: {
			badge: 'EXPIRED',
			title: 'On record, but past its expiry date',
			bubble:
				"This serial matches {maker}'s records for {product}, but its expiry date has passed.",
			nextStep:
				'Expired medicine may not work as it should. Take it back to where you bought it and ask for a pack that is still in date.'
		},
		recalled: {
			badgeRecalled: 'RECALLED',
			badgeWithdrawn: 'WITHDRAWN',
			titleRecalled: 'This batch has been recalled',
			titleWithdrawn: 'This batch has been withdrawn',
			bubbleRecalled: '{product} batch {lot} was recalled{by}{on}.',
			bubbleWithdrawn: '{product} batch {lot} was withdrawn{by}{on}.',
			by: ' by {source}',
			on: ' on {date}',
			reason: 'Reason given: {reason}',
			nextStep:
				'Ask a pharmacist or doctor what to take instead before your next dose, and take this pack back to where you bought it.'
		},
		cantConfirm: {
			badge: "CAN'T CONFIRM",
			title: "This record can't be confirmed right now",
			bubbleProduct:
				"This product's records are paused on DETECK, so I can't give a result for this pack.",
			bubbleManufacturer:
				"The manufacturer's records are paused on DETECK, so I can't give a result for this pack."
		},
		notCovered: {
			badge: 'NOT ON DETECK YET',
			title: "This product isn't on DETECK yet",
			bubble:
				"Its manufacturer hasn't shared records with DETECK, so I can't check this pack. This doesn't mean it's fake.",
			reviewBubble:
				"Its manufacturer has added this medicine, but DETECK is still reviewing the records, so I can't check this pack yet. This doesn't mean it's fake.",
			nextStep: 'You can ask your pharmacist about this medicine.'
		},
		needsBatch: {
			badge: 'ONE MORE STEP',
			title: 'Which batch is on the pack?',
			bubble:
				'This serial matches more than one product. Type the batch number so I can find the right one.',
			scanTitle: 'Scan the code to finish',
			scanBubble:
				'This serial and batch number match more than one product. Scan the square code on the pack so I can tell which one it is.'
		},
		unrecognised: {
			badge: 'UNRECOGNISED',
			title: "We couldn't find this serial",
			not_found: "I couldn't find this serial in the records I have.",
			not_found_for_covered_product:
				"This product is on DETECK, but this serial isn't in the manufacturer's records.",
			batch_not_matched: "That batch number doesn't match the records for this serial.",
			no_serial_in_code:
				"This code identifies the product, but it has no serial number, so I can't check this pack.",
			mistyped:
				'The serial was mistyped. Type it again, checking each letter and number against the pack.',
			notShared: "The manufacturer hasn't shared its records with DETECK yet.",
			notRecorded: "The code on the pack isn't one its manufacturer recorded.",
			serialWhere: 'Where to find the serial on {drug}: {hint}',
			typeInstead: 'Type that serial on the check page instead of scanning.',
			typeToConfirm: 'Type that serial on the check page, to make sure the scan read it correctly.',
			nextStepKeep: 'Ask a pharmacist before you use it, and keep the pack.'
		}
	},

	alerts: {
		summary: 'Tell me if this batch is recalled',
		how: 'How to reach you',
		email: 'Email',
		whatsapp: 'WhatsApp',
		addressBoth: 'Email or WhatsApp number',
		consent:
			'DETECK may use this only to tell me about this batch, and delete it 30 days after the batch expires.',
		signUp: 'Sign up',
		needConsent: 'Tick the box to agree to the alert.',
		already: "You're already signed up for this batch.",
		checkEmail: 'Check your email and tap the link to confirm.',
		whatsappDone: "We've sent you a WhatsApp message. Reply YES to it to confirm the alert.",
		errors: {
			expired: 'This result has expired. Check the serial again, then sign up.',
			bad_email: 'That email address is missing something, like .com or .ng.',
			whatsapp_off: 'WhatsApp alerts are not available yet.',
			bad_phone: 'Enter your WhatsApp number, like 0803 123 4567.',
			whatsapp_failed: "We couldn't send a WhatsApp message to that number.",
			already_recalled:
				'This batch has already been recalled or withdrawn. Check the serial again to see what to do.',
			too_many:
				"We've already sent sign-up messages to this address today. Check your inbox (and spam), or try again tomorrow.",
			daily_limit: "That's a lot of alert sign-ups for one day. Please try again tomorrow."
		},
		confirm: {
			question: 'Confirm recall alerts for {drug} batch {lot}?',
			button: 'Confirm alerts',
			metaTitle: 'Recall alert · DETECK',
			doneTitle: "You're signed up",
			doneBody:
				"We'll email you if {drug} batch {lot} is recalled or withdrawn. Every alert has a link to stop them.",
			badTitle: "This link doesn't work",
			badBody:
				'It may be incomplete, or the sign-up has already expired. Check the serial again to sign up.'
		},
		stop: {
			metaTitle: 'Stop recall alerts · DETECK',
			question: 'Stop recall alerts for this batch?',
			button: 'Stop alerts',
			stoppedTitle: 'Alerts stopped',
			stoppedBody: "We've deleted your address for this batch.",
			badTitle: "This link doesn't work",
			badBody: 'It may be incomplete. Your sign-up may already have been removed.'
		},
		emails: {
			confirmSubject: 'Confirm recall alerts for {drug}',
			confirmBody:
				'You asked DETECK to tell you if {drug} batch {lot} is recalled or withdrawn.\n\nConfirm here:\n{confirmUrl}\n\nDETECK only uses this address for this alert, and deletes it 30 days after the batch expires. To cancel now:\n{stopUrl}',
			recallSubjectRecalled: '{drug} batch {lot} has been recalled',
			recallSubjectWithdrawn: '{drug} batch {lot} has been withdrawn',
			recallBodyRecalled: '{drug} batch {lot} has been recalled{by}.',
			recallBodyWithdrawn: '{drug} batch {lot} has been withdrawn{by}.',
			by: ' by {source}',
			reason: 'Reason given: {reason}',
			advice:
				'If you have this pack, ask a pharmacist or doctor what to take instead before your next dose, and take the pack back to where you bought it.',
			stop: "If DETECK lifts this recall, you'll get one more email. To stop alerts now:\n{stopUrl}",
			liftedSubject: '{drug} batch {lot} is no longer recalled',
			liftedBody:
				'{drug} batch {lot} is no longer recalled or withdrawn. Checks of its packs give normal results again.',
			liftedStop:
				"You'll get another email if this batch is recalled again. To stop alerts:\n{stopUrl}",
			signature: "DETECK\nIf you weren't expecting this email, you can ignore it."
		}
	},

	journey: {
		metaTitle: "DETECK · The drug's journey",
		title: "The drug's journey",
		backAria: 'Back to result',
		expiredBody: 'Check the serial again to see its journey.',
		batchLine: '{product} · Batch {lot}',
		noneTitle: 'No journey recorded yet',
		whatWeKnow: 'What we do know',
		madeBy: 'Made by {maker}',
		madeExpires: 'Made {made} · Expires {expires}',
		gap: 'No record for this step',
		gapBetween: 'Between {after} and {before}',
		stepBatch: '{place} · Batch {lot} · Expires {expires}',
		verified: 'Verified by DETECK',
		confirmed: 'Receipt confirmed by this business',
		unverified: 'Not yet verified by DETECK',
		recordsEnd: "Records end here. Later steps aren't recorded on DETECK yet.",
		sellerPrompt:
			"Buying somewhere else? This pack is recorded with {holder}. If you're buying it elsewhere, ask the seller where it came from.",
		batchPrompt:
			"Buying from a supplier? Check that they're on this list. If they aren't, ask where the stock came from.",
		footnote:
			'Journeys show what manufacturers have recorded. Prices, quantities and staff names are never shown.',
		summary: {
			toRetail: 'It went from {maker}{via} and was last recorded with {last}.{gap}',
			via: ' to {names},',
			gap: ' One step along the way is missing from the records.',
			endsBeforeRetail:
				"It went from {maker} to {names}. Records end there: later steps aren't recorded on DETECK yet.",
			batchLevel: {
				one: "{maker} supplied this batch to {n} business. The records don't say which one handled this pack.",
				other:
					"{maker} supplied this batch to {n} businesses. The records don't say which one handled this pack."
			},
			none: "The manufacturer hasn't shared where this batch was sent, so I can't show who handled it."
		},
		link: {
			none: 'No journey recorded yet',
			lastWith: 'Last recorded with {name}{where}',
			suppliedTo: {
				one: 'Supplied to {n} recorded business',
				other: 'Supplied to {n} recorded businesses'
			},
			endsAt: 'Records end at {name}{where}'
		},
		step: {
			manufacturer: 'MANUFACTURER · MADE {month}',
			lastHolder: 'LAST RECORDED HOLDER',
			lastHolderSince: 'LAST RECORDED HOLDER · SINCE {date}'
		},
		roles: {
			manufacturer: 'Manufacturer',
			distributor: 'Distributor',
			wholesaler: 'Wholesaler',
			pharmacy: 'Pharmacy',
			hospital: 'Hospital',
			other: 'Business'
		}
	},

	scan: {
		metaTitle: 'Verify by scan · DETECK',
		title: 'Verify by scan',
		closeAria: 'Close scanner',
		blockedBubble: "I need your camera to scan the pack. It looks like it's turned off for DETECK.",
		turnOnTitle: 'Turn on the camera',
		turnOn1: "Open your phone's Settings, or tap the lock icon next to the web address.",
		turnOn2: 'Find your browser, then Camera.',
		turnOn3: 'Allow Camera, then come back here.',
		turnedOn: "I've turned it on",
		cameraAria: 'Camera view',
		holdAuto: 'Hold the square code inside the frame. I read it automatically.',
		holdPhoto: 'Hold the square code inside the frame, in good light, then take a photo.',
		takePhoto: 'Take photo of the code',
		reading: 'Reading the code…',
		intro:
			"Scan the square code on the pack and I'll check its serial against the manufacturer's records.",
		unsupported: "This browser can't open the camera here. Take a photo of the code instead.",
		scanButton: 'Scan the code',
		photoIdle: 'Take or choose a photo of the code',
		photoGallery: 'Choose a photo from your gallery',
		readPhoto: 'Read the code in my photo',
		typeInstead: 'Type the serial instead',
		footer:
			"Photos are shrunk on your phone before sending, to save data. The photo is used to read the code and isn't kept.",
		noPhoto: 'Take or choose a photo of the code first.',
		tooLarge: 'That photo is too large. Try again with a smaller one.',
		unreadable:
			"I couldn't read a code in this photo. Hold the pack closer, in good light, with the square code in the middle. Or type the serial instead."
	},

	packaging: {
		photosMetaTitle: 'Photos for the packaging check · DETECK',
		title: 'Check the packaging (beta)',
		backAria: 'Back to result',
		serialLine: 'Serial {serial}: Valid · {product} · Batch {lot}',
		intro:
			'Now take three photos: the front, the back and the label. Hold the pack flat, in good light.',
		notes: {
			front: 'Brand, name and strength readable',
			back: 'Ingredients and manufacturer readable',
			label: 'Batch and expiry readable'
		},
		clear: '✓ Clear',
		checkingPhoto: 'Checking the photo…',
		unchecked: "Photo added. It's checked when you send it.",
		takePhoto: 'Take photo',
		retake: 'Retake',
		tooDark: 'Too dark. Take it again in better light.',
		glare: 'Washed out by glare. Tilt the pack away from the light.',
		blurry: "Too blurry. I can't read the details. Hold the phone steady.",
		sizeNote:
			'Photos are shrunk on your phone before sending (about 750 KB in total), so this works on 3G.',
		sending: 'Sending photos…',
		submit: 'Check the packaging',
		checking: 'Checking the packaging',
		yourCheck: 'Your check',
		serialRead: 'Serial read: Valid',
		photosReceived: '3 photos received',
		comparing: 'Comparing logo, text, colours and security marks',
		serialRow: 'Serial',
		valid: 'Valid',
		journeyRow: 'Journey',
		packagingRow: 'Packaging',
		somethingDifferent: 'Something looks different',
		retakePhotos: 'Retake the photos',
		notAvailableYet: 'The packaging check is not available yet.',
		dailyLimit:
			"You've reached today's limit for packaging checks on this device. Try again tomorrow.",
		checkSerialFirst:
			'Check the serial first. The packaging check is for packs whose serial is on record.',
		addPhoto: {
			front: 'Add a photo of the front of the pack.',
			back: 'Add a photo of the back of the pack.',
			label: 'Add a photo of the label and batch.'
		},
		photoProblems: {
			unreadable: "This file isn't a photo we can open. Use a JPG or PNG.",
			too_small: 'This photo is too small. Use a sharper, larger photo.',
			blurry:
				"This photo is too blurry. I can't read the details. Hold the phone steady, in good light.",
			dark: 'This photo is too dark. Take it again in better light.',
			bright:
				'This photo is washed out by light or glare. Tilt the pack away from the light and try again.'
		},
		categories: {
			logo: "The logo looks different from the manufacturer's pack",
			font: "The lettering looks different from the manufacturer's pack",
			colour: "The colours look different from the manufacturer's pack",
			print_quality: "The print quality looks different from the manufacturer's pack",
			missing_security_feature: "A security feature on the manufacturer's pack isn't visible",
			label_layout: "The label layout looks different from the manufacturer's pack"
		},
		sides: {
			front: 'Front of the pack',
			back: 'Back of the pack',
			label: 'Label and batch'
		},
		disclaimer:
			"This is a check of the records and how the pack looks. It can't test what's inside, so follow your doctor's or pharmacist's directions.",
		notAvailable:
			"This manufacturer hasn't shared photos of its packaging with DETECK yet, so I can only check the serial.",
		analysing: "Comparing with the manufacturer's pack…",
		analysingNote: 'This usually takes under 30 seconds.',
		photoRules: 'Whole side of the pack in view · good light · no glare',
		retain:
			'Keep my photos for 90 days to help DETECK check how accurate the packaging check is. They are deleted after that.',
		beta: 'Beta: the packaging check is being tested. Treat it as one extra signal, not a final answer.',
		provider:
			"Your photos are sent to DETECK's AI provider, Anthropic, to compare with the manufacturer's photos. Keep faces and prescriptions out of them.",
		outcomes: {
			match: {
				badge: 'NO VISIBLE DIFFERENCES',
				title: 'No visible differences in these photos',
				bubble:
					"The serial matches the manufacturer's records, and I didn't see differences from the manufacturer's pack in these photos.",
				line: 'No visible inconsistencies found in these photos'
			},
			mismatch: {
				badge: "SOMETHING DOESN'T MATCH",
				title: "Something doesn't match",
				bubble:
					"The serial is on record, but the packaging looks different from the manufacturer's pack.",
				nextStep:
					'Show this result to a pharmacist before you use it, or buy from another pharmacy.',
				line: 'Inconsistencies found'
			},
			unsure: {
				badge: "CAN'T TELL",
				title: "I can't tell from these photos",
				bubble:
					"The serial is on record, but I'm not sure enough about the packaging to say either way.",
				nextStep:
					'Sharper photos in daylight usually help. Or ask your pharmacist to look at it with you.',
				line: "Can't tell from these photos"
			}
		}
	},

	report: {
		metaTitle: 'Report a suspected fake · DETECK',
		title: 'Report a suspected fake',
		intro:
			"Tell DETECK about a pack you're worried about. We look into every report and can pass it to NAFDAC and the manufacturer.",
		medicine: 'The medicine',
		nameLabel: 'Name and strength on the pack',
		namePlaceholder: 'e.g. Amoxil 500 mg capsules',
		photosLabel: 'Photos of the pack (up to {n}, optional)',
		photosHelp: 'Front, back and the label with the batch number help most.',
		where: 'Where you got it',
		place: 'Pharmacy, shop or seller',
		state: 'State',
		chooseState: 'Choose a state',
		town: 'Town or area',
		boughtOn: 'When you bought it (optional)',
		details: 'What worried you? (optional)',
		reach: 'How to reach you (optional)',
		reachNote:
			"Only DETECK sees these, to ask follow-up questions. They're never shared with the manufacturer or the seller.",
		name: 'Name',
		email: 'Email',
		phone: 'Phone',
		consent:
			'DETECK may share this report and the photos (not my contact details) with NAFDAC and the manufacturer.',
		submit: 'Send the report',
		unwell:
			'If you or someone else feels unwell after taking a medicine, see a doctor or pharmacist straight away.',
		errors: {
			limit: "You've sent several reports today. Try again tomorrow.",
			missing_drug: 'Say which medicine this is, for example the name and strength on the pack.',
			missing_place: 'Say where you bought it, for example the pharmacy name.',
			bad_state: 'Choose a state.',
			bad_email: 'That email address is missing something, like .com or .ng.',
			photo_too_large: 'Each photo must be under 12 MB.',
			photo_unreadable: "{name} isn't a photo we can open."
		},
		thanks: {
			metaTitle: 'Report sent · DETECK',
			title: 'Thank you. Your report is with DETECK.',
			body: 'A DETECK reviewer looks at every report. If you left your contact details, we may get in touch with questions. Keep the pack and your receipt if you can.'
		}
	},

	error: {
		notFoundTitle: "I can't find that page",
		notFoundBody: 'The link may be old or mistyped.',
		forbiddenTitle: "This page isn't open to you",
		forbiddenBody: 'Your account does not have access to this page.',
		tooManyTitle: 'Too many requests',
		tooManyBody: 'Please wait a minute.',
		otherTitle: 'Something went wrong on our side',
		otherBody:
			'Nothing you did caused this. Please try again in a minute. If you were checking a medicine, type the serial again.',
		code: 'Error {status}'
	},

	landing: {
		metaTitle: 'About DETECK · Check medicines against the manufacturer’s records',
		metaDescription:
			"DETECK lets anyone in Nigeria check a medicine's serial number against the records its manufacturer shared, and see its recorded journey. No account, no DETECK charge.",
		navWho: 'Who we serve',
		navVision: 'Our vision',
		eyebrow: 'Medicine checks for Nigeria · no DETECK fee',
		heroTitle: 'Verify Before You Trust.',
		lede: 'Type the serial number on a medicine pack, or scan its code. DETECK checks it against the records its manufacturer shared, and shows who made it and its recorded journey to you.',
		scanPack: 'Scan a pack',
		seeHow: 'See how it works',
		heroBubble: "Hi, I'm Deteck. I'm here to help.",
		heroAlt:
			'A Nigerian pharmacist checking a medicine box with her phone while a customer waits at the counter',
		heroChip: 'Valid: matches the manufacturer’s records',
		heroChipSub: 'Example · Manufacturer → Distributor → Pharmacy',
		runPharmacy: 'Run a pharmacy?',
		runPharmacyLink: 'See how DETECK helps you',
		step1Title: 'Type or scan the code',
		step1Text:
			'Type the serial number printed on the pack, or scan the product code with your phone.',
		step2Title: 'We check the records',
		step2Text:
			'DETECK looks the serial up in the records its manufacturer shared, including its recorded journey through distributors and pharmacies.',
		step3Title: 'Deteck tells you the result',
		step3Text:
			"Valid or Unrecognised, in plain words, plus the medicine's recorded journey. If the records aren't enough to be sure, Deteck says so.",
		whoLead: 'Built for everyone who buys, moves or dispenses medicine.',
		audiences: {
			citizens: {
				label: 'Nigerian citizens',
				alt: 'A mother checking a medicine box on her phone at a pharmacy counter',
				title: 'Check before you buy or use it',
				text: 'Type the serial number on a medicine, or scan its code, and see whether it matches the manufacturer’s records.'
			},
			pharmacies: {
				label: 'Pharmacies',
				alt: 'A pharmacist checking a medicine box with her phone',
				title: 'Check what you receive',
				text: 'Check medicines from suppliers and see their recorded manufacturer and distribution history before they reach your shelves.'
			},
			hospitals: {
				label: 'Hospitals & facilities',
				alt: 'A nurse checking medicine boxes in a hospital store room',
				title: 'Check before you dispense',
				text: 'Check the medicines your facility receives before they are dispensed or given to patients.'
			},
			distributors: {
				label: 'Distributors & wholesalers',
				alt: '',
				title: 'Be part of the recorded journey',
				text: 'When a manufacturer records that it supplied you, your business appears in that medicine’s journey, so buyers can see where the stock was recorded along the way.'
			},
			manufacturers: {
				label: 'Manufacturers',
				alt: 'A technician inspecting medicine boxes on a packaging line',
				title: 'Share your product data',
				text: 'Upload your products, serial numbers, supply chain records and packaging photos, so people can check your medicines against your records.'
			}
		},
		visionTitle: 'Every medicine in Nigeria, **traceable** from the factory to your hands.',
		visionText:
			"Every Nigerian deserves to know where their medicine came from. DETECK connects each pack's serial number to its manufacturer's records, so you can check its identity and recorded journey instead of relying only on how the packaging looks.",
		impactTitle: "The impact we're working toward",
		impact1Alt: 'A mother checking a medicine box on her phone at a pharmacy counter',
		impact1Title: 'Confident families',
		impact1Text: 'People can check a medicine themselves before they buy it or use it.',
		impact2Alt: 'A nurse checking medicine boxes on a hospital store shelf with a tablet',
		impact2Title: 'Careful dispensing',
		impact2Text:
			'Pharmacies and hospitals can check the medicines they receive before dispensing them.',
		impact3Alt: 'A technician in a cleanroom suit inspecting medicine boxes on a packaging line',
		impact3Title: 'Accountable records',
		impact3Text:
			'Manufacturers register their products so people can check them against their records.',
		whyEyebrow: 'Why DETECK',
		whyTitle: 'One clear answer, honest about what it knows.',
		strengths: {
			serial: 'Checks the serial against the records its manufacturer shared with DETECK',
			journey: 'Shows the recorded journey through distributors and pharmacies',
			packaging:
				'Can compare photos of the pack with the manufacturer’s packaging (beta, for some products)',
			network: 'Serial checks work on 2G and 3G. No DETECK charge; normal data charges apply',
			honest: 'Tells you honestly when there isn’t enough information to be sure'
		},
		verifyTitle: 'Got a pack in your hand? Check it now.',
		verifyLabel: 'Serial number on the pack',
		verifyButton: 'Check it',
		verifyFine:
			"Serial checks work on 2G and 3G. No DETECK charge; normal data charges apply. Results depend on the records manufacturers share with DETECK. When there isn't enough information to be sure, Deteck will tell you.",
		footerLead: "Building DETECK with partners across Nigeria's medicine supply chain.",
		pilotPartner: 'Become a pilot partner',
		registerCompany: 'Register your company',
		footerNav: 'Footer',
		footerProduct: 'Product',
		footerCompany: 'Company',
		contact: 'Contact',
		legal:
			'© 2026 DETECK. Product names and records shown are examples. Checks depend on participating manufacturers recording their products and supply chain. DETECK checks records and, in the beta, how a pack looks; it can’t test what is inside a pack.'
	}
};

type Strings<T> = {
	[K in keyof T]: T[K] extends string ? string : T[K] extends boolean ? boolean : Strings<T[K]>;
};

/** The shape every language follows: the same keys as English, with its own text. */
export type Messages = Strings<typeof en>;
