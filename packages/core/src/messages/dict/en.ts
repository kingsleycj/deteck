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
		contact: 'Contact',
		menu: 'Menu'
	},

	footer: {
		about: 'About DETECK',
		check: 'Check a medicine',
		privacy: 'Privacy',
		terms: 'Terms',
		business: 'For manufacturers and pharmacies',
		developers: 'Developers',
		contact: 'Contact us',
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
		scan: 'Verify further by scan',
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
		tryAgain: 'Try again',
		lede: "Type the serial number on the pack. Deteck checks it against the manufacturer's records and shows you where it has been.",
		scanNote: 'Use your camera, or upload photos of the pack.',
		helloTitle: "Hi, I'm Deteck.",
		helloBody:
			"Give me the serial number and I'll read you the result: whether it's valid, who made it, and who it was last recorded with.",
		step1Title: '1 · Valid?',
		step1Text: "Matches the maker's records, or not",
		step2Title: '2 · Packaging',
		step2Text: 'AI spots visible differences',
		step3Title: '3 · Journey',
		step3Text: 'From the maker to the last recorded business',
		tipsTitle: 'Where to find the serial',
		tip1: 'Near the barcode, after **SN** or **Serial**',
		tip2: 'Up to 20 letters and numbers, often in groups',
		tip3: 'The letter O and the number 0 look alike, check both'
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
			"Hmm, that doesn't look like a serial number yet. Your typing stays in the box so you only fix what's wrong.",
		batch_number:
			'That looks like the batch number (after LOT or BATCH). The serial is a different code, usually printed after SN near the barcode.'
	},

	network: {
		slow: 'The network is slow. Tap Retry. I kept your serial.',
		slowServer:
			'The records took too long to answer. Your serial is still in the box: tap Check medicine to try again.',
		offlineTitle: "I couldn't reach the records",
		offlineBody:
			"Your connection dropped while I was checking. Nothing is lost: your serial is saved, and I'll try again as soon as you're back online.",
		rateLimited: {
			one: 'Too many checks in a short time. Please wait {n} minute and try again.',
			other: 'Too many checks in a short time. Please wait {n} minutes and try again.'
		},
		editSerial: 'Edit serial',
		offlineNote:
			'A check uses less data than loading a photo, so even a weak 2G or 3G signal is usually enough.'
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
		checkPackaging: 'Verify further by scan',
		scanCode: 'Verify further by scan',
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
			title: 'It matches the records',
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
		},
		serialChecked: 'Serial checked',
		checkAgain: 'Check again',
		whatToDo: 'What to do:',
		notSure: 'Not sure?',
		checkAnotherShort: 'Check another'
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
		noneTitle: 'Recorded so far',
		whatWeKnow: 'What we do know',
		madeBy: 'Made by {maker}',
		madeExpires: 'Made {made} · Expires {expires}',
		stepBatch: '{place} · Batch {lot} · Expires {expires}',
		verified: 'Verified by DETECK',
		confirmed: 'Receipt confirmed by this business',
		unverified: 'Not yet verified by DETECK',
		sellerPrompt:
			"Buying somewhere else? This pack is recorded with {holder}. If you're buying it elsewhere, ask the seller where it came from.",
		batchPrompt:
			"Buying from a supplier? Check that they're on this list. If they aren't, ask where the stock came from.",
		footnote:
			'Journeys show what manufacturers have recorded. Prices, quantities and staff names are never shown.',
		summary: {
			toRetail: 'It went from {maker}{via} and was last recorded with {last}.',
			via: ' to {names},',
			batchLevel: {
				one: "{maker} supplied this batch to {n} business. The records don't say which one handled this pack.",
				other:
					"{maker} supplied this batch to {n} businesses. The records don't say which one handled this pack."
			},
			none: "So far DETECK has the manufacturer's record of this batch. Businesses that handle it appear here once they're recorded."
		},
		link: {
			none: "See what's recorded so far",
			lastWith: 'Last recorded with {name}{where}',
			suppliedTo: {
				one: 'Supplied to {n} recorded business',
				other: 'Supplied to {n} recorded businesses'
			}
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
		},
		stepsCount: { one: '{n} recorded step', other: '{n} recorded steps' }
	},

	scan: {
		metaTitle: 'Verify further by scan · DETECK',
		metaDescription:
			"Photograph a medicine pack and DETECK compares it with the manufacturer's own packaging. Free, no account needed.",
		title: 'Verify further by scan',
		closeAria: 'Close scanner',
		cameraAria: 'Camera view',
		// The packaging check's first screen (Akuabata, 3 Nov 2026).
		startBubble:
			"Photograph the packaging and I'll compare it with the manufacturer's genuine pack.",
		startButton: 'Scan the package',
		startUpload: 'Upload 3 photos of the pack',
		startUploadNote:
			"Front, back and label. Photos are shrunk on your phone before sending, to save data. They're used only to compare the packaging and aren't kept.",
		startPhotoAlt: 'A hand holding up a phone to photograph a medicine pack',
		howTitle: 'How it works',
		how1: 'Hold the pack in good light.',
		how2: 'Take 3 photos: front, back, and the label with the batch number.',
		how3: "Deteck compares them with the manufacturer's genuine packaging.",
		how4: 'You see what matches and what looks different.',
		typeInstead: 'Type the serial instead',
		cancel: 'Cancel',
		tabCamera: 'Use camera',
		tabUpload: 'Upload photos',
		methodAria: 'How to add the photos',
		photoOf: 'Photo {n} of 3 · {side}',
		serialValid: 'Serial {serial}: Valid',
		sayFront: 'Hold the front of the pack flat to the camera, in good light.',
		sayBack: 'Now the back, with the square code in view. I read the code from it.',
		sayLabel: 'Last one: the label with the batch number and expiry date.',
		gotCode: 'Got the code.',
		photosTitle: 'Photos for the packaging check',
		taken: 'Taken',
		takingNow: 'Taking now',
		next: 'Next',
		noCameraTitle: 'No camera?',
		noCameraText:
			'Switch to **Upload photos** and add clear pictures of the front, back and label. Photos are shrunk before sending to save data.',
		blocked:
			"**Your camera is blocked or missing.** Allow it in your browser's address bar, or upload photos you took on your phone.",
		uploadBubble:
			'Photos from your phone work too. Make sure each one is sharp and shows the whole side.',
		rulesTitle: 'Photo rules',
		rule1: 'JPG or PNG, up to 10 MB each',
		rule2: 'Whole side of the pack in view',
		rule3: 'Good light, no glare',
		added: '{n} of 3 photos added',
		reviewTitle: 'Photos look good',
		reviewText: 'Sharp, well lit and the whole pack is in view.',
		reviewBubble: "I'm ready to compare them with the manufacturer's packaging.",
		retakeOne: 'Retake a photo',
		noCode:
			"I couldn't read the code in these photos. Retake the back of the pack, closer, with the square code in view. Or type the serial instead.",
		startCamera: 'Turn on the camera',
		capture: 'Take photo',
		busy: 'Lots of photos are being read right now. Wait a moment and try again; your photos are still here.'
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

	// The contact page (B-84).
	contact: {
		metaTitle: 'Contact us · DETECK',
		metaDescription:
			'Send the DETECK team a message about checking a medicine, partnering with DETECK or using the API.',
		title: 'Contact us',
		lede: "Questions about checking a medicine, partnering with DETECK or using our API? Send us a message and we'll reply by email.",
		bubble: 'Hi! Tell us how we can help.',
		waysTitle: 'Other ways to reach us',
		emailTitle: 'Email',
		partnerTitle: 'Partner with us',
		partnerText:
			'Manufacturers, distributors, pharmacies and hospitals: choose "Partnering with DETECK" in the form and tell us about your business.',
		devTitle: 'Developers',
		devText: 'Read the API documentation',
		faqTitle: 'Quick answers',
		faqText: 'See the questions people ask',
		formTitle: 'Send us a message',
		name: 'Full name',
		email: 'Email',
		organisation: 'Organisation (optional)',
		topic: 'What is it about?',
		chooseTopic: 'Choose one',
		topics: {
			general: 'A general question',
			checking: 'Checking a medicine',
			partnering: 'Partnering with DETECK',
			developers: 'The API',
			press: 'Press and media',
			problem: 'A problem with the website'
		},
		message: 'Message',
		messageHint: 'Up to 3,000 characters.',
		privacy: 'We use your details only to reply to this message.',
		privacyLink: 'Privacy notice',
		send: 'Send message',
		sending: 'Sending…',
		sentTitle: 'Thank you. Your message is with the DETECK team.',
		sentText: "We'll reply by email.",
		sendAnother: 'Send another message',
		worried: 'Worried about a medicine you have now? Check it on DETECK and ask a pharmacist.',
		errors: {
			name: 'Tell us your name.',
			email: 'That email address is missing something, like .com or .ng.',
			topic: 'Choose what your message is about.',
			message: 'Write your message (at least 10 characters).',
			too_long: 'Your message is too long. Keep it under 3,000 characters.',
			human: 'Please complete the "are you human?" check.',
			limit: "You've sent several messages already. Please try again later.",
			failed: "We couldn't send your message just now. Please try again in a few minutes."
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
		metaTitle: 'DETECK · Check medicines against the manufacturer’s records',
		metaDescription:
			"DETECK lets anyone in Nigeria check a medicine's serial number against the records its manufacturer shared. Free to check, no account needed.",
		navVision: 'Our vision',
		navFaq: 'Questions',
		signIn: 'Sign in',
		skip: 'Skip to content',
		heroTitle: 'Verify Before You Trust.',
		lede: 'Type the serial number on a medicine pack. DETECK checks it against the records its manufacturer shared.',
		scanPack: 'Verify further by scan',
		seeHow: 'See how it works',
		heroBubble: "Hi, I'm Deteck. I'm here to help.",
		heroAlt: 'Orange capsules beside an empty blister pack on a pale blue background',
		heroNote: 'No account needed. The answer comes in seconds.',
		trust: {
			free: 'Free to check',
			network: 'Works on 2G and 3G',
			languages: 'English, Pidgin, Hausa, Yorùbá and Igbo',
			records: "Answers from the manufacturer's own records"
		},
		reel: {
			soon: 'Film coming soon',
			label: 'The DETECK film'
		},
		howTitle: 'Three steps to a clear answer',
		step1Title: 'Type the serial',
		step1Text:
			'Type the serial number printed on the pack. Or photograph the pack: DETECK reads its code and AI compares the packaging.',
		step2Title: 'We check the records',
		step2Text: 'DETECK looks the serial up in the records its manufacturer shared.',
		step3Title: 'Deteck tells you the result',
		step3Text:
			"Valid or Unrecognised, in plain words. If the records aren't enough to be sure, Deteck says so.",
		biz: {
			registerManufacturer: 'Register as a manufacturer',
			registerBusiness: 'Register as a pharmacy, hospital or distributor',
			docs: 'API documentation'
		},
		verifyFurther: {
			title: 'Check the packaging, not just the code.',
			text: "Photograph the front, back and label of your pack. Deteck compares them with the manufacturer's genuine packaging and tells you if anything looks different.",
			button: 'Verify further',
			alt: 'The DETECK camera screen framing an unlabelled blister pack of tablets'
		},
		who: {
			title: 'Built for everyone who buys, moves or dispenses medicine.',
			individuals: {
				tab: 'Individuals',
				title: 'Check before you buy or use it',
				text: 'Type the serial number on a medicine, or photograph its packaging, and see whether it matches trusted records.',
				alt: 'A young woman in Lagos smiling at her phone on a sofa',
				cta: 'Check a medicine'
			},
			facilities: {
				tab: 'Pharmacies, hospitals & facilities',
				title: 'Check before you sell or dispense',
				text: 'Verify the medicines you receive from suppliers before they reach your shelves or are given to patients.',
				alt: 'The counter and shelves of a modern pharmacy in Ikeja, Lagos',
				pharmacy: 'Register as a pharmacy',
				hospital: 'Register as a hospital'
			},
			makers: {
				tab: 'Manufacturers & distributors',
				title: 'Share your product data',
				// Akuabata's text ends "so people can confirm your medicines are real"; softened (C-06, B-83).
				text: 'Whether you make medicines or import and package them, upload your products, serial numbers and genuine packaging so people can check them against your records.',
				alt: 'A man checking boxes of stock on warehouse shelves',
				manufacturer: 'Register as a manufacturer',
				distributor: 'Register as a distributor'
			}
		},
		impact: {
			title: "The impact we're working toward",
			familiesTitle: 'Confident families',
			familiesText: 'People can check a medicine themselves before they buy it or use it.',
			dispensingTitle: 'Safer dispensing',
			dispensingText:
				'Pharmacies and hospitals can confirm the medicines they receive before dispensing them.',
			productsTitle: 'Trusted products',
			// Akuabata's text ends "help people confirm they are genuine"; softened (C-06, B-83).
			productsText:
				'Manufacturers can register their products and help people check them against their records.'
		},
		visionTitle: 'Anyone in Nigeria should be able to check their medicine.',
		visionAlt: 'A young woman smiling at her phone in a café in Abuja',
		visionText:
			"DETECK connects each pack's serial number to its manufacturer's records, so you can check it yourself instead of relying only on how the packaging looks.",
		// Akuabata's questions and answers (3 Nov 2026), word for word.
		faq: {
			title: 'Questions people ask',
			useQ: 'How do I use DETECK?',
			useA: "Type the serial number printed on the pack and tap Check it. Deteck checks it against the manufacturer's records and tells you the result in seconds. For extra confidence, tap Verify further and photograph the packaging.",
			helpQ: 'How does DETECK help me?',
			helpA:
				"You can check a medicine before you buy it, take it or give it to your family, instead of judging by how the pack looks. It's free, needs no account, and works on 2G and 3G in five languages.",
			resultsQ: 'What do the results mean?',
			resultsA:
				"**Valid:** the serial matches the manufacturer's records.\n**Unrecognised:** we couldn't find the serial. Check you typed it correctly, and don't use the medicine until you're sure.\n**Needs further checks:** something doesn't match. Verify further by photographing the packaging.",
			sourceQ: 'Where does DETECK get its information?',
			sourceA:
				"From the manufacturers and distributors in Nigeria's medicine supply chain we partner with. They share their product records with us: product details, batch and serial numbers, expiry dates and photos of their genuine packaging.",
			coverQ: 'Does DETECK cover every medicine in Nigeria?',
			coverA:
				"Not yet. We're adding manufacturers and their medicines one at a time. If a medicine isn't on DETECK yet, Deteck will tell you we don't have its records. That doesn't mean it's fake. Ask a licensed pharmacist before you use it.",
			nextQ: "What's next for DETECK?",
			nextA:
				"We're building supply-chain traceability, so you'll be able to see where a batch has been, from the factory through each distributor to the pharmacy or hospital that sold it.",
			more: 'Still have a question? Reach out to us directly.',
			partner: 'Partner with us',
			api: 'Developer API',
			contactUs: 'Contact us'
		},
		verifyTitle: 'Got a pack in your hand? Check it now.',
		verifyLabel: 'Serial number on the pack',
		verifyButton: 'Check it',
		footerLead: "Building DETECK with partners across Nigeria's medicine supply chain.",
		footerNav: 'Footer',
		footerProduct: 'Product',
		footerCompany: 'Company',
		footerBusiness: 'For business',
		contact: 'Contact',
		photoCredit: 'Photos from Unsplash, Pexels and Wikimedia Commons',
		cropped: 'cropped',
		legal:
			'© 2026 DETECK. Checks depend on participating manufacturers recording their products. DETECK checks records and, in the beta, how a pack looks; it can’t test what is inside a pack.'
	}
};

type Strings<T> = {
	[K in keyof T]: T[K] extends string ? string : T[K] extends boolean ? boolean : Strings<T[K]>;
};

/** The shape every language follows: the same keys as English, with its own text. */
export type Messages = Strings<typeof en>;
