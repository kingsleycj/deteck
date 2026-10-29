/** Nigerian Pidgin (Naijá). Draft: needs a native speaker's review before launch. */
import type { Messages } from './en.ts';

export const pcm: Messages = {
	meta: {
		name: 'Naijá (Pidgin)',
		reviewed: false
	},

	common: {
		or: 'or',
		and: 'and',
		back: 'Go back',
		checkMedicine: 'Check medicine',
		checkAnother: 'Check another medicine',
		checkSerial: 'Check serial',
		language: 'Language',
		draftNotice:
			'Dis translation na draft: people wey sabi Pidgin well-well still dey check am. If anytin no clear you, switch to English.',
		englishOnly: 'Dis page dey for English.',
		notRecorded: 'No record',
		dateNotRecorded: 'Di date no dey di record'
	},

	nav: {
		home: 'Deteck home',
		main: 'Main',
		how: 'How e dey work',
		pharmacies: 'For pharmacies',
		manufacturers: 'For manufacturers',
		badge: 'DETECK no dey charge you'
	},

	footer: {
		about: 'About DETECK',
		check: 'Check medicine',
		privacy: 'Privacy',
		terms: 'Terms',
		business: 'For pharmacies and companies wey make medicine',
		developers: 'Developers',
		note: 'Di result wey you go see depend on di records wey manufacturers share with DETECK.'
	},

	check: {
		metaTitle: 'DETECK · Make you check your medicine',
		metaDescription:
			'Type di serial number wey dey your medicine pack, make you see if e match di manufacturer records. You no need account, and DETECK no dey charge you.',
		pilotOn:
			'Pilot features go dey on for dis browser for 90 days, di packaging check (beta) join.',
		greeting:
			'Hello, na me be Deteck. Type di serial number wey dey your pack, and I go check am for you.',
		title: 'Check your medicine',
		subtitle: 'See if e match di manufacturer records.',
		label: 'Serial number',
		placeholder: 'Like 7K4M 9QX2 TB8D',
		hint: 'Look near di barcode. E dey after **SN** or **Serial**.',
		submit: 'Check medicine',
		scan: 'Scan di code instead',
		footer:
			'Serial check dey work for 2G and 3G. You no need account. DETECK no dey charge you; your network go still collect di normal data money.',
		humanPrompt:
			'**You dey check plenty packs?** Confirm say you be person, so you fit continue without waiting.',
		humanButton: 'Continue to check',
		humanFailed: 'Abeg finish di check wey dey ask "you be human?".',
		asideLabel: 'Wetin DETECK dey check',
		asideTitle: 'Wetin Deteck dey check',
		asideSerial: '**Di serial.** E match di manufacturer records?',
		asidePackaging:
			'**Di packaging.** AI dey look for any difference wey eye fit see between dis pack and di manufacturer pack.',
		asideJourney: '**Di journey.** Di businesses wey di records show say don hold am.',
		asideNote: 'Deteck dey talk wetin di records show. E no fit test wetin dey inside pack.',
		checkingTitle: 'I dey check di records…',
		checkingBody: 'Deteck dey compare your serial with di manufacturer records.',
		retry: 'Try am again',
		tryAgain: 'Try again'
	},

	format: {
		empty: 'Type di serial number wey dem print for di pack.',
		too_short:
			'Dat one too short to be serial number. Serial number get at least 4 letters or numbers.',
		too_long:
			'Dat one too long for serial number (serial no dey pass 20 letters and numbers). Check say na only di serial you type.',
		bad_characters: 'Use only di letters and numbers wey dem print after SN for di pack.',
		nafdac_number:
			'Dat one resemble NAFDAC registration number. Di serial na different code; e dey usually after SN, near di barcode.',
		bad_code: 'We no fit read dat code. Type di serial wey dey after SN instead.',
		mascot:
			'Hmm, dat one never look like serial number. Wetin you type still dey di box, so na only di wrong part you go correct.'
	},

	network: {
		slow: 'Network dey slow. Press "Try am again". I don keep your serial.',
		slowServer:
			'Di records delay too much before dem answer. Your serial still dey di box: press Check medicine to try again.',
		offlineTitle: 'I no fit reach di records',
		offlineBody:
			'E be like say your phone no dey online. Your serial still dey di box, so wen network come back, you fit press Check again.',
		rateLimited: {
			one: 'Too many checks for short time. Abeg wait {n} minute, then try again.',
			other: 'Too many checks for short time. Abeg wait {n} minutes, then try again.'
		}
	},

	result: {
		metaExpired: 'Result don expire',
		head: 'Result',
		backAria: 'Go back to home page',
		serialAria: 'Serial wey you check',
		heading: 'Result: {badges}',
		expiredTitle: 'Dis result don expire',
		expiredBody:
			'We dey keep result for only 30 minutes. Check di serial again to see di latest records.',
		batchLabel: 'Batch number',
		batchHelp: 'E dey after LOT, BN or Batch for di pack.',
		batchMissing: 'Type di batch number wey dem print for di pack.',
		batchNotMatched:
			'Dat batch number no match di records for dis serial. Check di batch wey dey after LOT, BN or Batch, then type am again.',
		continue: 'Continue',
		detailsAria: 'Wetin di record show',
		product: 'Product',
		manufacturer: 'Manufacturer',
		nafdac: 'NAFDAC reg. no.',
		batch: 'Batch',
		expires: 'Expiry date',
		expired: 'E don expire',
		pack: 'Pack',
		reasonsIntro: 'Dis kind tin fit happen wen:',
		journeyLink: 'See di medicine journey',
		checkPackaging: 'Check di packaging (beta)',
		scanCode: 'Scan di code instead',
		retype: 'Type di serial again',
		report: 'Report pack wey fit be fake',
		worried: 'Dis pack still dey worry you?',
		worriedLink: 'Report am to DETECK',
		journeyStillStands: 'Di serial result no change.',
		footnote:
			'Dis one show wetin di manufacturer records talk. E no be lab test of wetin dey inside di pack.',

		thisMedicine: 'dis medicine',
		theManufacturer: 'di manufacturer',
		TheManufacturer: 'Di manufacturer',
		askPharmacist: 'Ask pharmacist before you use am.',
		coverage: 'As e be now, DETECK get records for {products} from {manufacturers}.',
		products: { one: '{n} product', other: '{n} products' },
		manufacturers: { one: '{n} manufacturer', other: '{n} manufacturers' },

		valid: {
			badge: 'E MATCH RECORDS',
			bubble: 'Dis serial match di records wey {maker} get for {product}.'
		},
		mismatch: {
			badge: 'CHECK DI PACK',
			title: 'Di pack no match di record',
			bubbleLot:
				'Dis serial match di records wey {maker} get for {product}, but di batch number wey dem print for dis pack no be di one wey dey di record.',
			bubbleExpiry:
				'Dis serial match di records wey {maker} get for {product}, but di expiry date wey dem print for dis pack no be di one wey dey di record.',
			nextStep: 'Show dis result to pharmacist before you use am, and keep di pack.'
		},
		expiredPack: {
			badge: 'E DON EXPIRE',
			title: 'E dey di records, but e don pass im expiry date',
			bubble:
				'Dis serial match di records wey {maker} get for {product}, but im expiry date don pass.',
			nextStep:
				'Medicine wey don expire fit no work as e suppose work. Carry am go back where you buy am, and ask for pack wey never expire.'
		},
		recalled: {
			badgeRecalled: 'DEM DON RECALL AM',
			badgeWithdrawn: 'DEM DON WITHDRAW AM',
			titleRecalled: 'Dem don recall dis batch',
			titleWithdrawn: 'Dem don withdraw dis batch from market',
			bubbleRecalled: 'Dem recall {product} batch {lot}{on}{by}.',
			bubbleWithdrawn: 'Dem withdraw {product} batch {lot}{on}{by}.',
			by: ' (na {source} announce am)',
			on: ' on {date}',
			reason: 'Di reason wey dem give: {reason}',
			nextStep:
				'Before you take am again, ask pharmacist or doctor wetin you go take instead, and carry dis pack go back where you buy am.'
		},
		cantConfirm: {
			badge: 'WE NO FIT CONFIRM',
			title: 'We no fit confirm dis record now',
			bubbleProduct:
				'Dis product records dey on hold for DETECK, so I no fit give result for dis pack.',
			bubbleManufacturer:
				'Di manufacturer records dey on hold for DETECK, so I no fit give result for dis pack.'
		},
		notCovered: {
			badge: 'E NEVER DEY DETECK',
			title: 'Dis product never dey DETECK',
			bubble:
				'Im manufacturer never share records with DETECK, so I no fit check dis pack. Dis one no mean say na fake.',
			reviewBubble:
				'Im manufacturer don add dis medicine, but DETECK still dey check di records, so I no fit check dis pack yet. Dis one no mean say na fake.',
			nextStep: 'You fit ask your pharmacist about dis medicine.'
		},
		needsBatch: {
			badge: 'ONE STEP REMAIN',
			title: 'Which batch dey di pack?',
			bubble:
				'Dis serial match pass one product. Type di batch number make I fit find di correct one.',
			scanTitle: 'Scan di code make we finish',
			scanBubble:
				'Dis serial and batch number match more than one product. Scan di square code wey dey di pack make I fit know which one e be.'
		},
		unrecognised: {
			badge: 'WE NO FIND AM',
			title: 'We no fit find dis serial',
			not_found: 'I no fit find dis serial for di records wey I get.',
			not_found_for_covered_product:
				'Dis product dey DETECK, but dis serial no dey di manufacturer records.',
			batch_not_matched: 'Dat batch number no match di records for dis serial.',
			no_serial_in_code:
				'Dis code show which product e be, but e no get serial number, so I no fit check dis pack.',
			mistyped:
				'Di serial get typing mistake. Type am again, and compare each letter and number with wetin dey di pack.',
			notShared: 'Di manufacturer never share im records with DETECK.',
			notRecorded: 'Di code wey dey di pack no be one wey im manufacturer record.',
			serialWhere: 'Where you go see di serial for {drug}: {hint}',
			typeInstead: 'Type dat serial for di check page. No use scan.',
			typeToConfirm: 'Type dat serial for di check page, make you sure say di scan read am well.',
			nextStepKeep: 'Ask pharmacist before you use am, and keep di pack.'
		}
	},

	alerts: {
		summary: 'Tell me if dem recall dis batch',
		how: 'How we go reach you',
		email: 'Email',
		whatsapp: 'WhatsApp',
		addressBoth: 'Email or WhatsApp number',
		consent:
			'DETECK fit use dis one only to tell me about dis batch, and e go delete am 30 days after di batch expire.',
		signUp: 'Sign up',
		needConsent: 'Tick di box to show say you agree to di alert.',
		already: 'You don already sign up for dis batch.',
		checkEmail: 'Check your email, then press di link to confirm.',
		whatsappDone: 'We don send you WhatsApp message. Reply YES make di alert start.',
		errors: {
			expired: 'Dis result don expire. Check di serial again, then sign up.',
			bad_email: 'Sometin dey miss for dat email address, like .com or .ng.',
			whatsapp_off: 'WhatsApp alert never start.',
			bad_phone: 'Put your WhatsApp number, like 0803 123 4567.',
			whatsapp_failed: 'We no fit send WhatsApp message to dat number.',
			already_recalled:
				'Dem don already recall or withdraw dis batch. Check di serial again make you see wetin you go do.',
			too_many:
				'We don already send sign-up message to dis address today. Check your inbox (and spam), or try again tomorrow.',
			daily_limit: 'Dis one don be plenty alert sign-up for one day. Abeg try again tomorrow.'
		},
		confirm: {
			question: 'You wan confirm recall alert for {drug} batch {lot}?',
			button: 'Confirm di alert',
			metaTitle: 'Recall alert · DETECK',
			doneTitle: 'You don sign up',
			doneBody:
				'We go email you if dem recall or withdraw {drug} batch {lot}. Every alert get link wey you fit use stop dem.',
			badTitle: 'Dis link no dey work',
			badBody:
				'E fit be say di link no complete, or di sign-up don expire. Check di serial again to sign up.'
		},
		stop: {
			metaTitle: 'Stop recall alert · DETECK',
			question: 'You wan stop recall alert for dis batch?',
			button: 'Stop di alerts',
			stoppedTitle: 'Di alerts don stop',
			stoppedBody: 'We don delete your address for dis batch.',
			badTitle: 'Dis link no dey work',
			badBody:
				'E fit be say di link no complete. E fit also be say dem don already remove your sign-up.'
		},
		emails: {
			confirmSubject: 'Confirm recall alert for {drug}',
			confirmBody:
				'You ask DETECK make e tell you if dem recall or withdraw {drug} batch {lot}.\n\nConfirm am here:\n{confirmUrl}\n\nDETECK go use dis address only for dis alert, and e go delete am 30 days after di batch expire. To cancel am now:\n{stopUrl}',
			recallSubjectRecalled: 'Dem don recall {drug} batch {lot}',
			recallSubjectWithdrawn: 'Dem don withdraw {drug} batch {lot}',
			recallBodyRecalled: 'Dem don recall {drug} batch {lot}{by}.',
			recallBodyWithdrawn: 'Dem don withdraw {drug} batch {lot}{by}.',
			by: ' (na {source} announce am)',
			reason: 'Di reason wey dem give: {reason}',
			advice:
				'If you get dis pack, before you take am again, ask pharmacist or doctor wetin you go take instead, and carry di pack go back where you buy am.',
			stop: 'If DETECK cancel dis recall, you go get one more email. To stop di alerts now:\n{stopUrl}',
			liftedSubject: 'Dem don cancel di recall of {drug} batch {lot}',
			liftedBody:
				'{drug} batch {lot} no dey recalled or withdrawn again. If you check im packs, di result go dey normal again.',
			liftedStop:
				'If dem recall dis batch again, you go get another email. To stop di alerts:\n{stopUrl}',
			signature: 'DETECK\nIf you no dey expect dis email, you fit ignore am.'
		}
	},

	journey: {
		metaTitle: 'DETECK · Di medicine journey',
		title: 'Di medicine journey',
		backAria: 'Go back to result',
		expiredBody: 'Check di serial again to see im journey.',
		batchLine: '{product} · Batch {lot}',
		noneTitle: 'Dem never record any journey',
		whatWeKnow: 'Wetin we sabi',
		madeBy: 'Na {maker} make am',
		madeExpires: 'Date wey dem make am: {made} · Expiry: {expires}',
		gap: 'No record for dis step',
		gapBetween: 'For di middle of {after} and {before}',
		stepBatch: '{place} · Batch {lot} · Expiry: {expires}',
		verified: 'DETECK don verify am',
		confirmed: 'Dis business don confirm say e receive am',
		unverified: 'DETECK never verify am',
		recordsEnd: 'Di records end for here. Di steps wey follow never dey DETECK.',
		sellerPrompt:
			'You dey buy am from another place? Di records show say dis pack dey with {holder}. If na another place you dey buy am, ask di seller where e come from.',
		batchPrompt:
			'You dey buy from supplier? Check say dem dey dis list. If dem no dey, ask where di stock come from.',
		footnote:
			'Di journey dey show wetin manufacturers don record. We no dey show price, quantity or staff names at all.',
		summary: {
			toRetail: 'E comot from {maker}{via} and di last place wey dem record am na {last}.{gap}',
			via: ' go {names},',
			gap: ' One step for di road no dey di records.',
			endsBeforeRetail:
				'E comot from {maker} go {names}. Di records end for there: di steps wey follow never dey DETECK.',
			batchLevel: {
				one: '{maker} supply dis batch give {n} business. Di records no talk which one hold dis pack.',
				other:
					'{maker} supply dis batch give {n} businesses. Di records no talk which one hold dis pack.'
			},
			none: 'Di manufacturer never share where dem send dis batch go, so I no fit show who don hold am.'
		},
		link: {
			none: 'Dem never record any journey',
			lastWith: 'Di last place wey dem record am: {name}{where}',
			suppliedTo: {
				one: 'Dem supply am give {n} business wey dey di records',
				other: 'Dem supply am give {n} businesses wey dey di records'
			},
			endsAt: 'Di records end for {name}{where}'
		},
		step: {
			manufacturer: 'MANUFACTURER · DEM MAKE AM {month}',
			lastHolder: 'LAST HOLDER FOR RECORD',
			lastHolderSince: 'LAST HOLDER FOR RECORD · FROM {date}'
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
		metaTitle: 'Scan di code to check · DETECK',
		title: 'Scan di code to check',
		closeAria: 'Close di scanner',
		blockedBubble: 'I need your camera to scan di pack. E be like say camera dey off for DETECK.',
		turnOnTitle: 'On di camera',
		turnOn1: 'Open your phone Settings, or press di lock sign wey dey near di web address.',
		turnOn2: 'Find your browser, then find Camera.',
		turnOn3: 'Allow Camera, then come back for here.',
		turnedOn: 'I don on am',
		cameraAria: 'Wetin di camera dey see',
		holdAuto: 'Hold di square code make e dey inside di box. I go read am by myself.',
		holdPhoto:
			'Hold di square code make e dey inside di box, for where light dey well, then snap photo.',
		takePhoto: 'Snap photo of di code',
		reading: 'I dey read di code…',
		intro:
			'Scan di square code wey dey di pack, and I go check if im serial match di manufacturer records.',
		unsupported: 'Dis browser no fit open camera for here. Snap photo of di code instead.',
		scanButton: 'Scan di code',
		photoIdle: 'Snap or choose photo of di code',
		photoGallery: 'Choose photo from your gallery',
		readPhoto: 'Read di code wey dey my photo',
		typeInstead: 'Type di serial instead',
		footer:
			'We dey reduce di photo size for your phone before e send, so e no go chop your data. Na only to read di code we dey use di photo; we no dey keep am.',
		noPhoto: 'First, snap or choose photo of di code.',
		tooLarge: 'Dat photo too big. Try again with smaller one.',
		unreadable:
			'I no fit read any code for dis photo. Bring di pack closer, for where light dey well, make di square code dey di middle. Or type di serial instead.'
	},

	packaging: {
		photosMetaTitle: 'Photos for di packaging check · DETECK',
		title: 'Check di packaging (beta)',
		backAria: 'Go back to result',
		serialLine: 'Serial {serial}: E match records · {product} · Batch {lot}',
		intro:
			'Now snap three photos: di front, di back and di label. Hold di pack flat, for where light dey well.',
		notes: {
			front: 'Make brand, name and strength show well',
			back: 'Make ingredients and manufacturer show well',
			label: 'Make batch and expiry show well'
		},
		clear: '✓ E clear',
		checkingPhoto: 'I dey check di photo…',
		unchecked: 'Photo don enter. I go check am wen you send am.',
		takePhoto: 'Snap photo',
		retake: 'Snap am again',
		tooDark: 'E too dark. Snap am again for where light dey well.',
		glare: 'Light too shine for di photo. Tilt di pack small make e no face di light.',
		blurry: 'E too blur. I no fit read di details. Hold di phone well, no shake am.',
		sizeNote:
			'We dey reduce di photos for your phone before e send (all of dem na about 750 KB), so e go work for 3G.',
		sending: 'I dey send di photos…',
		submit: 'Check di packaging',
		checking: 'I dey check di packaging',
		yourCheck: 'Your check',
		serialRead: 'Serial wey I read: E match records',
		photosReceived: 'I don receive 3 photos',
		comparing: 'I dey compare logo, writing, colour and security marks',
		serialRow: 'Serial',
		valid: 'E match records',
		journeyRow: 'Journey',
		packagingRow: 'Packaging',
		somethingDifferent: 'Sometin no look di same',
		retakePhotos: 'Snap di photos again',
		notAvailableYet: 'Di packaging check never ready.',
		dailyLimit: 'You don reach today limit for packaging check for dis device. Try again tomorrow.',
		checkSerialFirst:
			'Check di serial first. Di packaging check na for packs wey im serial dey di records.',
		addPhoto: {
			front: 'Add photo of di front of di pack.',
			back: 'Add photo of di back of di pack.',
			label: 'Add photo of di label and batch.'
		},
		photoProblems: {
			unreadable: 'Dis file no be photo wey we fit open. Use JPG or PNG.',
			too_small: 'Dis photo too small. Use photo wey big pass and clear pass.',
			blurry:
				'Dis photo too blur. I no fit read di details. Hold di phone well, no shake am, and make light dey well.',
			dark: 'Dis photo too dark. Snap am again for where light dey well.',
			bright:
				'Light or glare don spoil dis photo. Tilt di pack small make e no face di light, then try again.'
		},
		categories: {
			logo: 'Di logo no look like di one for di manufacturer pack',
			font: 'Di writing no look like di one for di manufacturer pack',
			colour: 'Di colour no look like di one for di manufacturer pack',
			print_quality: 'Di print quality no look like di one for di manufacturer pack',
			missing_security_feature: 'One security mark wey dey di manufacturer pack no show here',
			label_layout: 'Di way dem arrange di label no look like di one for di manufacturer pack'
		},
		sides: {
			front: 'Front of di pack',
			back: 'Back of di pack',
			label: 'Label and batch'
		},
		disclaimer:
			'Dis one na check of di records and how di pack look. E no fit test wetin dey inside, so follow wetin your doctor or pharmacist tell you.',
		notAvailable:
			'Dis manufacturer never share photos of im packaging with DETECK, so na only di serial I fit check.',
		analysing: 'I dey compare am with di manufacturer pack…',
		analysingNote: 'E no dey usually pass 30 seconds.',
		photoRules: 'Make di whole side of di pack show · light dey well · no glare',
		retain:
			'Keep my photos for 90 days to help DETECK see how correct di packaging check dey. Dem go delete dem after dat.',
		beta: 'Beta: we still dey test di packaging check. Take am as one extra sign, no be final answer.',
		provider:
			'We dey send your photos to Anthropic, di AI provider wey DETECK dey use, make e compare dem with di manufacturer photos. No let face or prescription show for di photos.',
		outcomes: {
			match: {
				badge: 'I NO SEE DIFFERENCE',
				title: 'I no see any difference for dis photos',
				bubble:
					'Di serial match di manufacturer records, and for dis photos, I no see anytin wey different from di manufacturer pack.',
				line: 'I no see anytin wey no match for dis photos'
			},
			mismatch: {
				badge: 'SOMETIN NO MATCH',
				title: 'Sometin no match',
				bubble: 'Di serial dey di records, but di packaging no look like di manufacturer pack.',
				nextStep: 'Show dis result to pharmacist before you use am, or buy from another pharmacy.',
				line: 'I see tins wey no match'
			},
			unsure: {
				badge: 'I NO SURE',
				title: 'I no fit tell from dis photos',
				bubble:
					'Di serial dey di records, but I no too sure about di packaging, so I no fit talk whether e match or e no match.',
				nextStep:
					'Photo wey clear well, wey you snap for daylight, dey usually help. Or ask your pharmacist make e look am with you.',
				line: 'I no fit tell from dis photos'
			}
		}
	},

	report: {
		metaTitle: 'Report pack wey fit be fake · DETECK',
		title: 'Report pack wey fit be fake',
		intro:
			'Tell DETECK about pack wey dey worry you. We dey look into every report, and we fit pass am give NAFDAC and di manufacturer.',
		medicine: 'Di medicine',
		nameLabel: 'Name and strength wey dey di pack',
		namePlaceholder: 'Like Amoxil 500 mg capsules',
		photosLabel: 'Photos of di pack (no pass {n}, if you want)',
		photosHelp: 'Di front, di back, and di label wey get batch number na im help pass.',
		where: 'Where you get am',
		place: 'Pharmacy, shop or di person wey sell am',
		state: 'State',
		chooseState: 'Choose state',
		town: 'Town or area',
		boughtOn: 'Wen you buy am (if you want)',
		details: 'Wetin worry you? (if you want)',
		reach: 'How we go reach you (if you want)',
		reachNote:
			'Na only DETECK go see dis ones, so we fit ask you more questions. We no go ever share dem with di manufacturer or di seller.',
		name: 'Name',
		email: 'Email',
		phone: 'Phone number',
		consent:
			'DETECK fit share dis report and di photos (but no be my contact details) with NAFDAC and di manufacturer.',
		submit: 'Send di report',
		unwell:
			'If you or anybody no dey feel well after dem take medicine, go see doctor or pharmacist sharp sharp.',
		errors: {
			limit: 'You don send plenty reports today. Try again tomorrow.',
			missing_drug: 'Talk which medicine dis one be, like di name and strength wey dey di pack.',
			missing_place: 'Talk where you buy am, like di pharmacy name.',
			bad_state: 'Choose state.',
			bad_email: 'Sometin dey miss for dat email address, like .com or .ng.',
			photo_too_large: 'Each photo no suppose pass 12 MB.',
			photo_unreadable: '{name} no be photo wey we fit open.'
		},
		thanks: {
			metaTitle: 'Report don go · DETECK',
			title: 'Thank you. Your report don reach DETECK.',
			body: 'Person for DETECK dey look every report. If you leave your contact details, we fit reach you to ask questions. Keep di pack and your receipt if you fit.'
		}
	},

	error: {
		notFoundTitle: 'I no fit find dat page',
		notFoundBody: 'E fit be say di link don old, or dem type am wrong.',
		forbiddenTitle: 'Dis page no open for you',
		forbiddenBody: 'Your account no get access to dis page.',
		tooManyTitle: 'Requests don too much',
		tooManyBody: 'Abeg wait one minute.',
		otherTitle: 'Sometin spoil for our side',
		otherBody:
			'No be anytin you do cause dis one. Abeg try again after one minute. If you dey check medicine before, type di serial again.',
		code: 'Error {status}'
	},

	landing: {
		metaTitle: 'About DETECK · Check if medicine match di manufacturer records',
		metaDescription:
			'With DETECK, anybody for Nigeria fit check if medicine serial number match di records wey im manufacturer share, and see di journey wey dem record for am. You no need account, and DETECK no dey charge you.',
		navWho: 'Who we dey serve',
		navVision: 'Our vision',
		eyebrow: 'Medicine check for Nigeria · DETECK no dey charge you',
		heroTitle: 'Check am before you trust am.',
		lede: 'Type di serial number wey dey medicine pack, or scan im code. DETECK go check am with di records wey im manufacturer share, then show you who make am and di road wey e follow reach you, as dem record am.',
		scanPack: 'Scan pack',
		seeHow: 'See how e dey work',
		heroBubble: 'Hello, na me be Deteck. I dey here to help you.',
		heroAlt:
			'One Nigerian woman pharmacist dey use im phone check medicine box, while customer dey wait for di counter',
		heroChip: 'E match records: di manufacturer records get dis serial',
		heroChipSub: 'Na example · Manufacturer → Distributor → Pharmacy',
		runPharmacy: 'You get pharmacy?',
		runPharmacyLink: 'See how DETECK fit help you',
		step1Title: 'Type or scan di code',
		step1Text:
			'Type di serial number wey dem print for di pack, or use your phone scan di product code.',
		step2Title: 'We go check di records',
		step2Text:
			'DETECK go find di serial for di records wey im manufacturer share, plus di journey wey dem record as e pass through distributors and pharmacies.',
		step3Title: 'Deteck go tell you di result',
		step3Text:
			'"E match records" or "We no find am", for simple words, plus di journey wey dem record for di medicine. If di records no enough to dey sure, Deteck go tell you.',
		whoLead: 'We build am for everybody wey dey buy, move or give out medicine.',
		audiences: {
			citizens: {
				label: 'Nigerian people',
				alt: 'One mama dey use im phone check medicine box for pharmacy counter',
				title: 'Check am before you buy or use am',
				text: 'Type di serial number wey dey medicine, or scan im code, and see whether e match di manufacturer records.'
			},
			pharmacies: {
				label: 'Pharmacies',
				alt: 'One woman pharmacist dey use im phone check medicine box',
				title: 'Check wetin you receive',
				text: 'Check medicine wey suppliers bring give you, and see di manufacturer and distribution history wey dem record for am, before e reach your shelf.'
			},
			hospitals: {
				label: 'Hospitals & health centres',
				alt: 'One nurse dey check medicine boxes for hospital store',
				title: 'Check am before you dispense',
				text: 'Check di medicines wey your hospital or clinic receive, before una dispense dem or give dem to patients.'
			},
			distributors: {
				label: 'Distributors & wholesale sellers',
				alt: '',
				title: 'Join di journey wey dem dey record',
				text: 'Wen manufacturer record say e supply you, your business go show for dat medicine journey, so buyers fit see where dem record di stock as e dey move.'
			},
			manufacturers: {
				label: 'Manufacturers',
				alt: 'One technician dey inspect medicine boxes for packaging line',
				title: 'Share una product data',
				text: 'Upload una products, serial numbers, supply chain records and packaging photos, so people fit check una medicines with una records.'
			}
		},
		visionTitle: 'Every medicine for Nigeria, **wey you fit trace** from factory reach your hand.',
		visionText:
			'Every Nigerian suppose fit know where im medicine come from. DETECK dey connect di serial number of each pack to im manufacturer records, so you fit check which medicine e be and di journey wey dem record for am. No be only how di packaging look you go depend on.',
		impactTitle: 'Di change wey we dey work for',
		impact1Alt: 'One mama dey use im phone check medicine box for pharmacy counter',
		impact1Title: 'Families wey get confidence',
		impact1Text: 'People fit check medicine by demself before dem buy am or use am.',
		impact2Alt: 'One nurse dey use tablet computer check medicine boxes for hospital store shelf',
		impact2Title: 'Dispense with care',
		impact2Text:
			'Pharmacies and hospitals fit check di medicines wey dem receive before dem dispense dem.',
		impact3Alt:
			'One technician wey wear cleanroom suit dey inspect medicine boxes for packaging line',
		impact3Title: 'Records wey somebody go answer for',
		impact3Text:
			'Manufacturers dey register dia products, so people fit check dem with di manufacturer records.',
		whyEyebrow: 'Why DETECK',
		whyTitle: 'One clear answer wey dey talk true about wetin e know.',
		strengths: {
			serial: 'E dey check di serial with di records wey im manufacturer share with DETECK',
			journey: 'E dey show di journey wey dem record, through distributors and pharmacies',
			packaging:
				'E fit compare photos of di pack with di manufacturer packaging (beta, for some products)',
			network:
				'Serial check dey work for 2G and 3G. DETECK no dey charge you; your network go still collect normal data money',
			honest: 'E go tell you true wen information no reach to dey sure'
		},
		verifyTitle: 'Pack dey your hand? Check am now.',
		verifyLabel: 'Serial number wey dey di pack',
		verifyButton: 'Check am',
		verifyFine:
			'Serial check dey work for 2G and 3G. DETECK no dey charge you; your network go still collect normal data money. Di result depend on di records wey manufacturers share with DETECK. Wen information no reach to dey sure, Deteck go tell you.',
		footerLead:
			'We dey build DETECK with partners from every corner of Nigeria medicine supply chain.',
		pilotPartner: 'Join as pilot partner',
		registerCompany: 'Register una company',
		footerNav: 'Footer',
		footerProduct: 'Product',
		footerCompany: 'Company',
		contact: 'Contact us',
		legal:
			'© 2026 DETECK. Di product names and records wey you see here na examples. Di checks depend on whether di manufacturers wey join dey record dia products and supply chain. DETECK dey check records and, for di beta, how pack look; e no fit test wetin dey inside pack.'
	}
};
