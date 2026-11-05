/** Nigerian Pidgin (Naijá). Approved for production by the product owner (5 Nov 2026). */
import type { Messages } from './en.ts';

export const pcm: Messages = {
	meta: {
		name: 'Naijá (Pidgin)',
		reviewed: true
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
		contact: 'Contact us',
		menu: 'Menu'
	},

	footer: {
		about: 'About DETECK',
		check: 'Check medicine',
		privacy: 'Privacy',
		terms: 'Terms',
		business: 'For pharmacies and companies wey make medicine',
		developers: 'Developers',
		contact: 'Contact us',
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
		scan: 'Check am more with scan',
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
		tryAgain: 'Try again',
		lede: 'Type di serial number wey dey di pack. Deteck go check am with di manufacturer records and show you where e don pass.',
		scanNote: 'Use your camera, or upload photos of di pack.',
		helloTitle: 'Hi, na me be Deteck.',
		helloBody:
			'Give me di serial number and I go tell you di result: whether e match, who make am, and di last business wey dem record am with.',
		step1Title: '1 · E match?',
		step1Text: 'E match di maker records, or e no match',
		step2Title: '2 · Packaging',
		step2Text: 'AI dey find difference wey eye fit see',
		step3Title: '3 · Journey',
		step3Text: 'From di maker reach di last business wey dem record',
		tipsTitle: 'Where you go see di serial',
		tip1: 'Near di barcode, after **SN** or **Serial**',
		tip2: 'E no pass 20 letters and numbers, sometimes dem group am',
		tip3: 'Letter O and number 0 resemble each other, check both'
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
			'Hmm, dat one never look like serial number. Wetin you type still dey di box, so na only di wrong part you go correct.',
		batch_number:
			'E be like say na di batch number (after LOT or BATCH). Di serial na different code, wey dem dey usually print after SN near di barcode.'
	},

	network: {
		slow: 'Network dey slow. Press "Try am again". I don keep your serial.',
		slowServer:
			'Di records delay too much before dem answer. Your serial still dey di box: press Check medicine to try again.',
		offlineTitle: 'I no fit reach di records',
		offlineBody:
			'Your connection cut as I dey check. Nothing lost: I don keep your serial, and I go try again as your network come back.',
		rateLimited: {
			one: 'Too many checks for short time. Abeg wait {n} minute, then try again.',
			other: 'Too many checks for short time. Abeg wait {n} minutes, then try again.'
		},
		editSerial: 'Change di serial',
		offlineNote:
			'One check no dey use data reach to load one photo, so even weak 2G or 3G signal dey usually enough.'
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
		checkPackaging: 'Check am more with scan',
		scanCode: 'Check am more with scan',
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
			title: 'E match di records',
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
		},
		serialChecked: 'Serial wey we check',
		checkAgain: 'Check am again',
		whatToDo: 'Wetin to do:',
		notSure: 'You no sure?',
		checkAnotherShort: 'Check another one'
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
		noneTitle: 'Wetin dem don record so far',
		whatWeKnow: 'Wetin we sabi',
		madeBy: 'Na {maker} make am',
		madeExpires: 'Date wey dem make am: {made} · Expiry: {expires}',
		stepBatch: '{place} · Batch {lot} · Expiry: {expires}',
		verified: 'DETECK don verify am',
		confirmed: 'Dis business don confirm say e receive am',
		unverified: 'DETECK never verify am',
		sellerPrompt:
			'You dey buy am from another place? Di records show say dis pack dey with {holder}. If na another place you dey buy am, ask di seller where e come from.',
		batchPrompt:
			'You dey buy from supplier? Check say dem dey dis list. If dem no dey, ask where di stock come from.',
		footnote:
			'Di journey dey show wetin manufacturers don record. We no dey show price, quantity or staff names at all.',
		summary: {
			toRetail: 'E comot from {maker}{via} and di last place wey dem record am na {last}.',
			via: ' go {names},',
			batchLevel: {
				one: '{maker} supply dis batch give {n} business. Di records no talk which one hold dis pack.',
				other:
					'{maker} supply dis batch give {n} businesses. Di records no talk which one hold dis pack.'
			},
			none: 'For now, DETECK get di manufacturer record for dis batch. Di businesses wey handle am go show here once dem record dem.'
		},
		link: {
			none: 'See wetin dem don record so far',
			lastWith: 'Di last place wey dem record am: {name}{where}',
			suppliedTo: {
				one: 'Dem supply am give {n} business wey dey di records',
				other: 'Dem supply am give {n} businesses wey dey di records'
			}
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
		},
		stepsCount: { one: '{n} step wey dem record', other: '{n} steps wey dem record' }
	},

	scan: {
		metaTitle: 'Check am more with scan · DETECK',
		metaDescription:
			'Snap photo of medicine pack and DETECK go compare am with di manufacturer own packaging. E free, you no need account.',
		title: 'Check am more with scan',
		closeAria: 'Close di scanner',
		cameraAria: 'Wetin di camera dey see',
		startBubble: 'Snap di packaging, and I go compare am with di manufacturer own pack.',
		startButton: 'Scan di pack',
		startUpload: 'Upload 3 photos of di pack',
		startUploadNote:
			'Front, back and label. We dey reduce di photo size for your phone before e send, so e no go chop your data. Na only to compare di packaging we dey use di photos; we no dey keep dem.',
		startPhotoAlt: 'Hand wey hold phone up to snap one medicine pack',
		howTitle: 'How e dey work',
		how1: 'Hold di pack for where light dey well.',
		how2: 'Snap 3 photos: di front, di back, and di label wey get di batch number.',
		how3: 'Deteck go compare dem with di manufacturer own packaging.',
		how4: 'You go see wetin match and wetin no look di same.',
		typeInstead: 'Type di serial instead',
		cancel: 'Cancel',
		tabCamera: 'Use camera',
		tabUpload: 'Upload photos',
		methodAria: 'How you go add di photos',
		photoOf: 'Photo {n} of 3 · {side}',
		serialValid: 'Serial {serial}: E match records',
		sayFront: 'Hold di front of di pack flat for di camera, where light dey well.',
		sayBack: 'Now di back, make di square code show. Na from there I go read di code.',
		sayLabel: 'Last one: di label wey get di batch number and expiry date.',
		gotCode: 'I don get di code.',
		photosTitle: 'Photos for di packaging check',
		taken: 'E don snap',
		takingNow: 'Dey snap am now',
		next: 'Next',
		noCameraTitle: 'No camera?',
		noCameraText:
			'Switch go **Upload photos** and add clear pictures of di front, back and label. We dey shrink di photos before we send dem, to save data.',
		blocked:
			'**Your camera dey blocked or e no dey.** Allow am for your browser address bar, or upload photos wey you snap with your phone.',
		uploadBubble:
			'Photos from your phone go work too. Make sure each one clear well and show di whole side.',
		rulesTitle: 'Photo rules',
		rule1: 'JPG or PNG, each one no pass 10 MB',
		rule2: 'Make di whole side of di pack show',
		rule3: 'Light dey well, no glare',
		added: '{n} of 3 photos don enter',
		reviewTitle: 'Di photos fine',
		reviewText: 'Dem clear, light dey well and di whole pack show.',
		reviewBubble: 'I don ready to compare dem with di manufacturer packaging.',
		retakeOne: 'Snap one photo again',
		noCode:
			'I no fit read di code for these photos. Snap di back of di pack again, closer, make di square code show. Or type di serial instead.',
		startCamera: 'On di camera',
		capture: 'Snap photo',
		busy: 'Plenty photos dey read now now. Wait small and try again; your photos still dey here.'
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

	contact: {
		metaTitle: 'Contact us · DETECK',
		metaDescription:
			'Send di DETECK team message about how to check medicine, how to join hand with DETECK or how to use di API.',
		title: 'Contact us',
		lede: 'You get question about how to check medicine, how to join hand with DETECK or how to use our API? Send us message and we go answer you for email.',
		bubble: 'Hello! Tell us how we fit help you.',
		waysTitle: 'Oda ways to reach us',
		emailTitle: 'Email',
		partnerTitle: 'Join hand with us',
		partnerText:
			'Manufacturers, distributors, pharmacies and hospitals: choose "Join hand with DETECK" for di form and tell us about your business.',
		devTitle: 'Developers',
		devText: 'Read di API documentation',
		faqTitle: 'Quick answers',
		faqText: 'See di questions wey people dey ask',
		formTitle: 'Send us message',
		name: 'Full name',
		email: 'Email',
		organisation: 'Organisation (if you want)',
		topic: 'Wetin di message dey about?',
		chooseTopic: 'Choose one',
		topics: {
			general: 'General question',
			checking: 'How to check medicine',
			partnering: 'Join hand with DETECK',
			developers: 'Di API',
			press: 'Press and media',
			problem: 'Problem with dis website'
		},
		message: 'Message',
		messageHint: 'E no suppose pass 3,000 characters.',
		privacy: 'Na only to answer dis message we dey use your details.',
		privacyLink: 'Privacy notice',
		send: 'Send di message',
		sending: 'We dey send am…',
		sentTitle: 'Thank you. Your message don reach di DETECK team.',
		sentText: 'We go answer you for email.',
		sendAnother: 'Send another message',
		worried: 'Medicine wey you get now dey worry you? Check am for DETECK and ask pharmacist.',
		errors: {
			name: 'Tell us your name.',
			email: 'Sometin dey miss for dat email address, like .com or .ng.',
			topic: 'Choose wetin your message dey about.',
			message: 'Write wetin you wan talk (at least 10 characters).',
			too_long: 'Your message too long. Make e no pass 3,000 characters.',
			human: 'Abeg finish di check wey dey ask "you be human?".',
			limit: 'You don send plenty messages already. Abeg try again later.',
			failed: 'We no fit send your message now now. Abeg try again after few minutes.'
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
		metaTitle: 'DETECK · Check if medicine match di manufacturer records',
		metaDescription:
			'With DETECK, anybody for Nigeria fit check if medicine serial number match di records wey im manufacturer share. E free to check, and you no need account.',
		navVision: 'Our vision',
		navFaq: 'Questions',
		signIn: 'Sign in',
		skip: 'Jump go di main content',
		heroTitle: 'Check am before you trust am.',
		lede: 'Type di serial number wey dey di medicine pack. DETECK go check am with di records wey di manufacturer share.',
		scanPack: 'Check am more with scan',
		seeHow: 'See how e dey work',
		heroBubble: 'Hello, na me be Deteck. I dey here to help you.',
		heroAlt: 'Orange capsule dem near one empty blister pack for light blue background',
		heroNote: 'You no need account. Di answer go come for few seconds.',
		trust: {
			free: 'E free to check',
			network: 'E dey work for 2G and 3G',
			languages: 'English, Pidgin, Hausa, Yorùbá and Igbo',
			records: 'Di answer dey come from di manufacturer own records'
		},
		reel: {
			soon: 'Di film dey come soon',
			label: 'DETECK film'
		},
		howTitle: 'Three steps to clear answer',
		step1Title: 'Type di serial',
		step1Text:
			'Type di serial number wey dem print for di pack. Or snap di pack: DETECK go read di code and AI go compare di packaging.',
		step2Title: 'We go check di records',
		step2Text: 'DETECK go find di serial for di records wey im manufacturer share.',
		step3Title: 'Deteck go tell you di result',
		step3Text:
			'"E match records" or "We no find am", for simple words. If di records no enough to dey sure, Deteck go tell you.',
		biz: {
			registerManufacturer: 'Register as manufacturer',
			registerBusiness: 'Register as pharmacy, hospital or distributor',
			docs: 'API documentation'
		},
		verifyFurther: {
			title: 'Check di packaging, no be only di code.',
			text: 'Snap di front, back and label of your pack. Deteck go compare dem with di manufacturer own packaging and tell you if anything no look di same.',
			button: 'Check am more',
			alt: 'DETECK camera screen wey dey frame one blister pack of tablet wey no get label'
		},
		who: {
			title: 'We build am for everybody wey dey buy, move or give out medicine.',
			individuals: {
				tab: 'Individuals',
				title: 'Check am before you buy or use am',
				text: 'Type di serial number wey dey di medicine, or snap im packaging, and see whether e match records wey you fit trust.',
				alt: 'One young woman for Lagos dey smile as she dey look her phone for chair',
				cta: 'Check medicine'
			},
			facilities: {
				tab: 'Pharmacies, hospitals & oda facilities',
				title: 'Check am before you sell or give am out',
				text: 'Check di medicines wey you collect from suppliers before dem reach your shelf or before dem give am to patients.',
				alt: 'Di counter and shelves of one modern pharmacy for Ikeja, Lagos',
				pharmacy: 'Register as pharmacy',
				hospital: 'Register as hospital'
			},
			makers: {
				tab: 'Manufacturers & distributors',
				title: 'Share di data of your products',
				text: 'Whether na you make di medicine or na you import and package am, upload your products, serial numbers and your own packaging so people fit check dem with your records.',
				alt: 'One man dey check boxes of stock for warehouse shelves',
				manufacturer: 'Register as manufacturer',
				distributor: 'Register as distributor'
			}
		},
		impact: {
			title: 'Di impact wey we dey work towards',
			familiesTitle: 'Families wey get confidence',
			familiesText: 'People fit check medicine by demself before dem buy am or use am.',
			dispensingTitle: 'Safer way to give out medicine',
			dispensingText:
				'Pharmacies and hospitals fit confirm di medicines wey dem collect before dem give am out.',
			productsTitle: 'Products wey people fit trust',
			productsText:
				'Manufacturers fit register dia products and help people check dem with dia records.'
		},
		visionTitle: 'Anybody for Nigeria suppose fit check im medicine.',
		visionAlt: 'One young woman dey smile as she dey look her phone for one café for Abuja',
		visionText:
			'DETECK dey connect di serial number of each pack to im manufacturer records, so you fit check am yourself. No be only how di packaging look you go depend on.',
		faq: {
			title: 'Questions wey people dey ask',
			useQ: 'How I go take use DETECK?',
			useA: 'Type di serial number wey dem print for di pack, then press Check am. Deteck go check am with di manufacturer records and tell you di result for few seconds. If you wan dey more sure, press Check am more and snap di packaging.',
			helpQ: 'How DETECK go help me?',
			helpA:
				'You fit check medicine before you buy am, take am or give am to your family, instead to judge am by how di pack look. E free, you no need account, and e dey work for 2G and 3G for five languages.',
			resultsQ: 'Wetin di results mean?',
			resultsA:
				'**E match records:** di serial match di manufacturer records.\n**We no find am:** we no fit find di serial. Check say you type am well, and no use di medicine until you dey sure.\n**E need more check:** sometin no match. Snap di packaging to check am more.',
			sourceQ: 'Where DETECK dey get im information?',
			sourceA:
				'From di manufacturers and distributors for Nigeria medicine supply chain wey we dey partner with. Dem dey share dia product records with us: product details, batch and serial numbers, expiry dates and photos of dia own packaging.',
			coverQ: 'DETECK dey cover every medicine for Nigeria?',
			coverA:
				'No yet. We dey add manufacturers and dia medicines one by one. If one medicine never dey DETECK, Deteck go tell you say we no get im records. Dat one no mean say e be fake. Ask licensed pharmacist before you use am.',
			nextQ: 'Wetin DETECK wan do next?',
			nextA:
				'We dey build supply-chain traceability, so you go fit see where one batch don pass, from di factory through each distributor reach di pharmacy or hospital wey sell am.',
			more: 'You still get question? Reach us direct.',
			partner: 'Join hand with us',
			api: 'Developer API',
			contactUs: 'Contact us'
		},
		verifyTitle: 'Pack dey your hand? Check am now.',
		verifyLabel: 'Serial number wey dey di pack',
		verifyButton: 'Check am',
		footerLead:
			'We dey build DETECK with partners from every corner of Nigeria medicine supply chain.',
		footerNav: 'Footer',
		footerProduct: 'Product',
		footerCompany: 'Company',
		footerBusiness: 'For business',
		contact: 'Contact us',
		photoCredit: 'Di photos come from Unsplash, Pexels and Wikimedia Commons',
		cropped: 'dem crop am',
		legal:
			'© 2026 DETECK. Di checks depend on whether di manufacturers wey join dey record dia products. DETECK dey check records and, for di beta, how pack look; e no fit test wetin dey inside pack.'
	}
};
