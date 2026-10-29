/** Igbo. Draft: needs a native speaker's review before launch. */
import type { Messages } from './en.ts';

export const ig: Messages = {
	meta: {
		name: 'Igbo',
		reviewed: false
	},

	common: {
		or: 'ma ọ bụ',
		and: 'na',
		back: 'Laghachi',
		checkMedicine: 'Lelee ọgwụ',
		checkAnother: 'Lelee ọgwụ ọzọ',
		checkSerial: 'Lelee nọmba serial',
		language: 'Asụsụ',
		draftNotice:
			'Ntụgharị Igbo a ka bụ nke nnwale; ndị Igbo ka na-enyocha ya. Ọ bụrụ na ihe ọ bụla edoghị gị anya, gbanwee gaa na Bekee.',
		englishOnly: "Peeji a dị n'asụsụ Bekee.",
		notRecorded: 'Ọ dịghị na ndekọ',
		dateNotRecorded: 'Ụbọchị adịghị na ndekọ'
	},

	nav: {
		home: 'Peeji mbụ Deteck',
		main: 'Isi',
		how: 'Otú o si arụ ọrụ',
		pharmacies: 'Maka ụlọ ahịa ọgwụ',
		manufacturers: 'Maka ndị na-emepụta ọgwụ',
		badge: 'DETECK anaghị ana ego'
	},

	footer: {
		about: 'Banyere DETECK',
		check: 'Lelee ọgwụ',
		privacy: 'Nzuzo',
		terms: 'Iwu na usoro',
		business: 'Maka ndị na-emepụta ọgwụ na ụlọ ahịa ọgwụ',
		developers: 'Ndị na-ede koodu',
		note: 'Nsonaazụ dabere na ndekọ ndị na-emepụta ọgwụ na-enye DETECK.'
	},

	check: {
		metaTitle: 'DETECK · Lelee ọgwụ gị',
		metaDescription:
			'Dee nọmba serial dị na ngwugwu ọgwụ ma lelee ma ọ dabara na ndekọ ụlọ ọrụ mepụtara ya. Ị chọghị akaụntụ, DETECK anaghịkwa ana ego.',
		pilotOn:
			'Atụmatụ nnwale (pilot) gbanyere na browser a ruo ụbọchị 90, gụnyere nlele ngwugwu (beta).',
		greeting:
			'Ndewo, abụ m Deteck. Dee nọmba serial dị na ngwugwu ọgwụ gị, m ga-enyere gị aka lelee ya.',
		title: 'Lelee ọgwụ gị',
		subtitle: 'Hụ ma ọ dabara na ndekọ ụlọ ọrụ mepụtara ya.',
		label: 'Nọmba serial',
		placeholder: 'dịka 7K4M 9QX2 TB8D',
		hint: "Chọọ ya n'akụkụ barcode, ọ na-eso **SN** ma ọ bụ **Serial**.",
		submit: 'Lelee ọgwụ',
		scan: 'Scan koodu ahụ kama',
		footer:
			'Nlele nọmba serial na-arụ ọrụ na 2G na 3G. Ị chọghị akaụntụ. DETECK anaghị ana ego; ị ga-akwụ ụgwọ data dịka ọ na-adị.',
		humanPrompt: "**Ị na-elele ọtụtụ ngwugwu?** Gosi na ị bụ mmadụ, ka ị gaa n'ihu ozugbo.",
		humanButton: 'Nọgide na-elele',
		humanFailed: 'Biko mezue nlele “ị bụ mmadụ?”.',
		asideLabel: 'Ihe DETECK na-elele',
		asideTitle: 'Ihe Deteck na-elele',
		asideSerial: '**Nọmba serial.** Ọ dabara na ndekọ ụlọ ọrụ mepụtara ya?',
		asidePackaging:
			"**Ngwugwu.** AI na-achọ ọdịiche a na-ahụ anya n'etiti ya na ngwugwu ụlọ ọrụ mepụtara ya.",
		asideJourney: '**Njem ya.** Azụmahịa ndị ndekọ kwuru na ha jidere ya.',
		asideNote: "Deteck na-agwa gị ihe ndekọ gosiri. O nweghị ike ịnwale ihe dị n'ime ngwugwu.",
		checkingTitle: 'Ana m elele ndekọ…',
		checkingBody: 'Deteck na-atụnyere nọmba serial gị na ndekọ ụlọ ọrụ mepụtara ya.',
		retry: 'Nwaa ọzọ',
		tryAgain: 'Nwaa ọzọ'
	},

	format: {
		empty: 'Dee nọmba serial e dere na ngwugwu ahụ.',
		too_short:
			'Nke a dị mkpụmkpụ maka nọmba serial. Nọmba serial nwere opekata mpe mkpụrụedemede ma ọ bụ nọmba 4.',
		too_long:
			'Nke a dị ogologo karịa nọmba serial (ruo mkpụrụedemede na nọmba 20). Lelee na ọ bụ naanị nọmba serial ka i dere.',
		bad_characters: 'Jiri naanị mkpụrụedemede na nọmba na-eso SN na ngwugwu ahụ.',
		nafdac_number:
			"Nke a yiri nọmba ndebanye aha NAFDAC. Nọmba serial bụ koodu ọzọ dị iche, nke na-esokarị SN n'akụkụ barcode.",
		bad_code: 'Anyị enweghị ike ịgụ koodu ahụ. Dee nọmba serial na-eso SN kama.',
		mascot:
			"Hmm, nke a ka adịghị ka nọmba serial. Ihe i dere ka dị n'igbe ahụ, ka i wee dozie naanị ebe njehie dị."
	},

	network: {
		slow: 'Netwọk na-aga nwayọọ. Pịa “Nwaa ọzọ”. Echekwara m nọmba serial gị.',
		slowServer:
			"Ndekọ ahụ were ogologo oge ịza. Nọmba serial gị ka dị n'igbe: pịa “Lelee ọgwụ” ka ị nwaa ọzọ.",
		offlineTitle: 'Enweghị m ike iru ndekọ ahụ',
		offlineBody:
			"O yiri ka ekwentị gị anọghị n'ịntanetị. Nọmba serial gị ka dị n'igbe, ya mere i nwere ike ịpị “Lelee ọgwụ” ọzọ mgbe netwọk laghachiri.",
		rateLimited: {
			one: "Nlele karịrị akarị n'obere oge. Biko chere nkeji {n}, wee nwaa ọzọ.",
			other: "Nlele karịrị akarị n'obere oge. Biko chere nkeji {n}, wee nwaa ọzọ."
		}
	},

	result: {
		metaExpired: 'Oge nsonaazụ a agafeela',
		head: 'Nsonaazụ',
		backAria: 'Laghachi na peeji mbụ',
		serialAria: 'Nọmba serial e lelere',
		heading: 'Nsonaazụ: {badges}',
		expiredTitle: 'Oge nsonaazụ a agafeela',
		expiredBody:
			'A na-edobe nsonaazụ ruo nkeji 30. Lelee nọmba serial ọzọ ka ị hụ ndekọ kachasị ọhụrụ.',
		batchLabel: 'Nọmba batch',
		batchHelp: 'Ọ na-eso LOT, BN ma ọ bụ Batch na ngwugwu ahụ.',
		batchMissing: 'Dee nọmba batch e dere na ngwugwu ahụ.',
		batchNotMatched:
			'Nọmba batch ahụ adabaghị na ndekọ nke nọmba serial a. Lelee batch na-eso LOT, BN ma ọ bụ Batch, ma dee ya ọzọ.',
		continue: "Gaa n'ihu",
		detailsAria: 'Nkọwa ndekọ',
		product: 'Ngwaahịa',
		manufacturer: 'Ụlọ ọrụ mepụtara ya',
		nafdac: 'Nọmba ndebanye NAFDAC',
		batch: 'Batch',
		expires: 'Ụbọchị njedebe',
		expired: 'Oge ya agafeela',
		pack: 'Ngwugwu',
		reasonsIntro: 'Nke a nwere ike ime mgbe:',
		journeyLink: 'Hụ njem ọgwụ a',
		checkPackaging: 'Lelee ngwugwu ya (beta)',
		scanCode: 'Scan koodu ahụ kama',
		retype: 'Dee nọmba serial ọzọ',
		report: 'Kọọ ọgwụ i chere na ọ bụ adịgboroja',
		worried: 'Ngwugwu a ka na-echegbu gị?',
		worriedLink: 'Gwa DETECK maka ya',
		journeyStillStands: 'Nsonaazụ nọmba serial ka dị otu ahụ.',
		footnote:
			"Nke a na-egosi ihe ndekọ ụlọ ọrụ mepụtara ya kwuru. Ọ bụghị nnwale ụlọ nyocha (lab) nke ihe dị n'ime ngwugwu ahụ.",

		thisMedicine: 'ọgwụ a',
		theManufacturer: 'ụlọ ọrụ mepụtara ya',
		TheManufacturer: 'Ụlọ ọrụ mepụtara ya',
		askPharmacist: 'Jụọ pharmacist tupu i jiri ya.',
		coverage: "Ruo ugbu a, DETECK nwere ndekọ maka {products} sitere n'aka {manufacturers}.",
		products: { one: 'ngwaahịa {n}', other: 'ngwaahịa {n}' },
		manufacturers: { one: 'ụlọ ọrụ {n} na-emepụta ọgwụ', other: 'ụlọ ọrụ {n} na-emepụta ọgwụ' },

		valid: {
			badge: 'DABARA NA NDEKỌ',
			bubble: 'Nọmba serial a dabara na ndekọ {maker} maka {product}.'
		},
		mismatch: {
			badge: 'LELEE NGWUGWU',
			title: 'Ngwugwu ahụ adabaghị na ndekọ',
			bubbleLot:
				'Nọmba serial a dabara na ndekọ {maker} maka {product}, mana nọmba batch e dere na ngwugwu a dị iche na nke dị na ndekọ.',
			bubbleExpiry:
				'Nọmba serial a dabara na ndekọ {maker} maka {product}, mana ụbọchị njedebe e dere na ngwugwu a dị iche na nke dị na ndekọ.',
			nextStep: 'Gosi pharmacist nsonaazụ a tupu i jiri ọgwụ ahụ, ma debe ngwugwu ahụ.'
		},
		expiredPack: {
			badge: 'OGE YA AGAFEELA',
			title: 'Ọ dị na ndekọ, mana ụbọchị njedebe ya agafeela',
			bubble:
				'Nọmba serial a dabara na ndekọ {maker} maka {product}, mana ụbọchị njedebe ya agafeela.',
			nextStep:
				"Ọgwụ oge ya agafeela nwere ike ghara ịrụ ọrụ otú o kwesịrị. Weghachi ya n'ebe ị zụtara ya, ma rịọ ka e nye gị ngwugwu nke oge ya agafebeghị."
		},
		recalled: {
			badgeRecalled: 'A KPỌGHACHIRI YA',
			badgeWithdrawn: 'E WEPỤRỤ YA',
			titleRecalled: 'A kpọghachiela batch a',
			titleWithdrawn: "E wepụla batch a n'ahịa",
			bubbleRecalled: 'A kpọghachiri batch {lot} nke {product}{by}{on}.',
			bubbleWithdrawn: "E wepụrụ batch {lot} nke {product} n'ahịa{by}{on}.",
			by: " site n'aka {source}",
			on: " n'ụbọchị {date}",
			reason: 'Ihe e kwuru kpatara ya: {reason}',
			nextStep:
				"Tupu ị ṅụọ ọgwụ a ọzọ, jụọ pharmacist ma ọ bụ dọkịta ihe ị ga-aṅụ kama ya, ma weghachi ngwugwu a n'ebe ị zụtara ya."
		},
		cantConfirm: {
			badge: 'A PỤGHỊ IKWENYE',
			title: 'A pụghị ikwenye ndekọ a ugbu a',
			bubbleProduct:
				'A kwụsịtụla ndekọ ngwaahịa a na DETECK, ya mere enweghị m ike inye nsonaazụ maka ngwugwu a.',
			bubbleManufacturer:
				'A kwụsịtụla ndekọ ụlọ ọrụ mepụtara ya na DETECK, ya mere enweghị m ike inye nsonaazụ maka ngwugwu a.'
		},
		notCovered: {
			badge: 'Ọ DỊBEGHỊ NA DETECK',
			title: 'Ngwaahịa a adịbeghị na DETECK',
			bubble:
				'Ụlọ ọrụ mepụtara ya enyebeghị DETECK ndekọ ya, ya mere enweghị m ike ilele ngwugwu a. Nke a apụtaghị na ọ bụ adịgboroja.',
			reviewBubble:
				'Ụlọ ọrụ mepụtara ya etinyela ọgwụ a, mana DETECK ka na-enyocha ndekọ ya, ya mere enweghị m ike ilele ngwugwu a ugbu a. Nke a apụtaghị na ọ bụ adịgboroja.',
			nextStep: 'I nwere ike ịjụ pharmacist gị maka ọgwụ a.'
		},
		needsBatch: {
			badge: 'OTU NZỌỤKWỤ ỌZỌ',
			title: 'Kedu batch dị na ngwugwu ahụ?',
			bubble:
				'Nọmba serial a dabara na ihe karịrị otu ngwaahịa. Dee nọmba batch ka m wee chọta nke ziri ezi.',
			scanTitle: 'Scan koodu ahụ iji mechaa',
			scanBubble:
				'Serial a na nọmba batch a dabara na ihe karịrị otu ọgwụ. Scan koodu akụkụ anọ dị na ngwugwu ahụ ka m mata nke ọ bụ.'
		},
		unrecognised: {
			badge: 'A MAGHỊ YA',
			title: 'Anyị achọtaghị nọmba serial a',
			not_found: 'Achọtaghị m nọmba serial a na ndekọ m nwere.',
			not_found_for_covered_product:
				'Ngwaahịa a dị na DETECK, mana nọmba serial a adịghị na ndekọ ụlọ ọrụ mepụtara ya.',
			batch_not_matched: 'Nọmba batch ahụ adabaghị na ndekọ nke nọmba serial a.',
			no_serial_in_code:
				'Koodu a na-egosi ngwaahịa ọ bụ, mana o nweghị nọmba serial, ya mere enweghị m ike ilele ngwugwu a.',
			mistyped:
				'E dehiere nọmba serial ahụ. Dee ya ọzọ, na-atụnyere mkpụrụedemede na nọmba ọ bụla na nke dị na ngwugwu ahụ.',
			notShared: 'Ụlọ ọrụ mepụtara ya enyebeghị DETECK ndekọ ya.',
			notRecorded: 'Koodu dị na ngwugwu ahụ abụghị nke ụlọ ọrụ mepụtara ya dekọrọ.',
			serialWhere: 'Ebe ị ga-ahụ nọmba serial na {drug}: {hint}',
			typeInstead: 'Dee nọmba serial ahụ na peeji nlele, kama ime scan.',
			typeToConfirm:
				"Dee nọmba serial ahụ na peeji nlele, iji jide n'aka na scan ahụ gụrụ ya nke ọma.",
			nextStepKeep: 'Jụọ pharmacist tupu i jiri ya, ma debe ngwugwu ahụ.'
		}
	},

	alerts: {
		summary: 'Gwa m ọ bụrụ na a kpọghachi batch a',
		how: 'Otú anyị ga-esi kpọtụrụ gị',
		email: 'Email',
		whatsapp: 'WhatsApp',
		addressBoth: 'Email ma ọ bụ nọmba WhatsApp',
		consent:
			'Ekwere m ka DETECK jiri nke a naanị maka ịgwa m banyere batch a, ma hichapụ ya ụbọchị 30 mgbe oge batch ahụ gafechara.',
		signUp: 'Debanye aha',
		needConsent: "Kaa akara n'igbe ahụ iji kwenye na ọkwa a.",
		already: 'I debanyelarị aha gị maka batch a.',
		checkEmail: 'Lelee email gị ma pịa link ahụ iji kwado ya.',
		whatsappDone: 'Anyị ezitela gị ozi na WhatsApp. Zaa YES iji kwenye ọkwa ahụ.',
		errors: {
			expired: 'Oge nsonaazụ a agafeela. Lelee nọmba serial ọzọ, wee debanye aha.',
			bad_email: "Ihe kọrọ n'adreesị email ahụ, dịka .com ma ọ bụ .ng.",
			whatsapp_off: 'Ọkwa WhatsApp adịbeghị.',
			bad_phone: 'Dee nọmba WhatsApp gị, dịka 0803 123 4567.',
			whatsapp_failed: 'Anyị enweghị ike iziga ozi WhatsApp na nọmba ahụ.',
			already_recalled:
				"E kpọghachila batch a ma ọ bụ wepụ ya n'ahịa. Lelee serial ahụ ọzọ ka ị hụ ihe ị ga-eme.",
			too_many:
				'Anyị ezigalarị ozi ndebanye aha na adreesị a taa. Lelee igbe ozi gị (na spam), ma ọ bụ nwaa ọzọ echi.',
			daily_limit: 'Ndebanye aha maka ọkwa adịla ọtụtụ taa. Biko nwaa ọzọ echi.'
		},
		confirm: {
			question: 'Ị chọrọ ọkwa nkpọghachi maka batch {lot} nke {drug}?',
			button: 'Kwenye ọkwa ahụ',
			metaTitle: 'Ọkwa nkpọghachi · DETECK',
			doneTitle: 'I debanyela aha',
			doneBody:
				"Anyị ga-ezitere gị email ọ bụrụ na a kpọghachi batch {lot} nke {drug} ma ọ bụ wepụ ya n'ahịa. Ọkwa ọ bụla nwere link ị ga-eji kwụsị ha.",
			badTitle: 'Link a anaghị arụ ọrụ',
			badBody:
				'O nwere ike ọ zughị ezu, ma ọ bụ oge ndebanye aha ahụ agafeelarị. Lelee nọmba serial ọzọ ka i debanye aha.'
		},
		stop: {
			metaTitle: 'Kwụsị ọkwa nkpọghachi · DETECK',
			question: 'Ị chọrọ ịkwụsị ọkwa nkpọghachi maka batch a?',
			button: 'Kwụsị ọkwa',
			stoppedTitle: 'Ọkwa akwụsịla',
			stoppedBody: 'Anyị ehichapụla adreesị gị maka batch a.',
			badTitle: 'Link a anaghị arụ ọrụ',
			badBody: 'O nwere ike ọ zughị ezu. O nwekwara ike ịbụ na e wepụlarị ndebanye aha gị.'
		},
		emails: {
			confirmSubject: 'Kwado ọkwa nkpọghachi maka {drug}',
			confirmBody:
				"Ị rịọrọ DETECK ka ọ gwa gị ọ bụrụ na a kpọghachi batch {lot} nke {drug} ma ọ bụ wepụ ya n'ahịa.\n\nKwado ebe a:\n{confirmUrl}\n\nDETECK na-eji adreesị a naanị maka ọkwa a, ma na-ehichapụ ya ụbọchị 30 mgbe oge batch ahụ gafechara. Iji kagbuo ya ugbu a:\n{stopUrl}",
			recallSubjectRecalled: 'A kpọghachiela batch {lot} nke {drug}',
			recallSubjectWithdrawn: "E wepụla batch {lot} nke {drug} n'ahịa",
			recallBodyRecalled: 'A kpọghachiela batch {lot} nke {drug}{by}.',
			recallBodyWithdrawn: "E wepụla batch {lot} nke {drug} n'ahịa{by}.",
			by: " site n'aka {source}",
			reason: 'Ihe e kwuru kpatara ya: {reason}',
			advice:
				"Ọ bụrụ na i nwere ngwugwu a, tupu ị ṅụọ ọgwụ a ọzọ, jụọ pharmacist ma ọ bụ dọkịta ihe ị ga-aṅụ kama ya, ma weghachi ngwugwu ahụ n'ebe ị zụtara ya.",
			stop: 'Ọ bụrụ na DETECK kagbuo nkpọghachi a, ị ga-enweta otu email ọzọ. Kwụsị ọkwa ugbu a:\n{stopUrl}',
			liftedSubject: 'A kagbuola nkpọghachi nke batch {lot} nke {drug}',
			liftedBody:
				'A naghịzi akpọghachi batch {lot} nke {drug}. Ilele ngwugwu ya ga-enye nsonaazụ nkịtị ọzọ.',
			liftedStop:
				'Ị ga-enweta email ọzọ ma ọ bụrụ na a kpọghachi batch a ọzọ. Kwụsị ọkwa:\n{stopUrl}',
			signature: 'DETECK\nỌ bụrụ na ị tụghị anya email a, i nwere ike ileghara ya anya.'
		}
	},

	journey: {
		metaTitle: 'DETECK · Njem ọgwụ a',
		title: 'Njem ọgwụ a',
		backAria: 'Laghachi na nsonaazụ',
		expiredBody: 'Lelee nọmba serial ọzọ ka ị hụ njem ya.',
		batchLine: '{product} · Batch {lot}',
		noneTitle: 'E dekọbeghị njem ya',
		whatWeKnow: 'Ihe anyị maara',
		madeBy: '{maker} mepụtara ya',
		madeExpires: 'E mere ya {made} · Njedebe {expires}',
		gap: 'Ọ dịghị ndekọ maka nzọụkwụ a',
		gapBetween: "N'etiti {after} na {before}",
		stepBatch: '{place} · Batch {lot} · Njedebe {expires}',
		verified: 'DETECK nyochara ya',
		confirmed: 'Azụmahịa a kwenyere na ọ natara ya',
		unverified: 'DETECK enyochabeghị ya',
		recordsEnd: 'Ndekọ kwụsịrị ebe a. E dekọbeghị nzọụkwụ ndị sochiri ya na DETECK.',
		sellerPrompt:
			"Ị na-azụ ya n'ebe ọzọ? Ndekọ gosiri na ngwugwu a dị n'aka {holder}. Ọ bụrụ na ị na-azụ ya n'ebe ọzọ, jụọ onye na-ere ya ebe o si bịa.",
		batchPrompt:
			"Ị na-azụ n'aka onye na-enye gị ngwaahịa? Lelee ma ha dị na ndepụta a. Ọ bụrụ na ha adịghị, jụọ ebe ngwaahịa ahụ si bịa.",
		footnote:
			'Njem na-egosi ihe ndị na-emepụta ọgwụ dekọrọ. Ọ dịghị mgbe a na-egosi ọnụahịa, ọnụọgụgụ ma ọ bụ aha ndị ọrụ.',
		summary: {
			toRetail: "O si n'aka {maker} pụta{via} ma ndekọ ikpeazụ gosiri na ọ dị n'aka {last}.{gap}",
			via: " gaa n'aka {names},",
			gap: " Otu nzọụkwụ n'ụzọ ahụ adịghị na ndekọ.",
			endsBeforeRetail:
				"O si n'aka {maker} gaa n'aka {names}. Ndekọ kwụsịrị n'ebe ahụ: e dekọbeghị nzọụkwụ ndị sochiri ya na DETECK.",
			batchLevel: {
				one: "{maker} nyere azụmahịa {n} batch a. Ndekọ ekwughị nke n'ime ha jidere ngwugwu a.",
				other: "{maker} nyere azụmahịa {n} batch a. Ndekọ ekwughị nke n'ime ha jidere ngwugwu a."
			},
			none: 'Ụlọ ọrụ mepụtara ya ekwubeghị ebe e zigara batch a, ya mere enweghị m ike igosi onye jidere ya.'
		},
		link: {
			none: 'E dekọbeghị njem ya',
			lastWith: "Ndekọ ikpeazụ gosiri na ọ dị n'aka {name}{where}",
			suppliedTo: {
				one: 'E nyere ya azụmahịa {n} dị na ndekọ',
				other: 'E nyere ya azụmahịa {n} dị na ndekọ'
			},
			endsAt: "Ndekọ kwụsịrị n'aka {name}{where}"
		},
		step: {
			manufacturer: 'ONYE MEPỤTARA YA · E MERE YA {month}',
			lastHolder: 'ONYE IKPEAZỤ NA NDEKỌ',
			lastHolderSince: 'ONYE IKPEAZỤ NA NDEKỌ · KEMGBE {date}'
		},
		roles: {
			manufacturer: 'Onye mepụtara ya',
			distributor: 'Onye na-ekesa ọgwụ',
			wholesaler: "Onye na-ere n'ọtụtụ",
			pharmacy: 'Ụlọ ahịa ọgwụ',
			hospital: 'Ụlọ ọgwụ',
			other: 'Azụmahịa'
		}
	},

	scan: {
		metaTitle: 'Jiri scan nyochaa · DETECK',
		title: 'Jiri scan nyochaa',
		closeAria: 'Mechie scanner',
		blockedBubble: 'Achọrọ m kamera gị iji scan ngwugwu ahụ. O yiri ka a gbanyụrụ ya maka DETECK.',
		turnOnTitle: 'Gbanye kamera',
		turnOn1: "Mepee Settings ekwentị gị, ma ọ bụ pịa akara mkpọchi dị n'akụkụ adreesị weebụ.",
		turnOn2: 'Chọta browser gị, wee pịa Camera.',
		turnOn3: 'Pịa Allow maka Camera, wee laghachi ebe a.',
		turnedOn: 'Agbanyela m ya',
		cameraAria: 'Ihe kamera na-ahụ',
		holdAuto: "Jide koodu akụkụ anọ ahụ n'ime igbe a. M ga-agụ ya n'onwe m.",
		holdPhoto: "Jide koodu akụkụ anọ ahụ n'ime igbe a, ebe ìhè zuru ezu, wee see foto.",
		takePhoto: 'See foto koodu ahụ',
		reading: 'Ana m agụ koodu ahụ…',
		intro:
			'Scan koodu akụkụ anọ dị na ngwugwu ahụ, m ga-atụnyere nọmba serial ya na ndekọ ụlọ ọrụ mepụtara ya.',
		unsupported: 'Browser a enweghị ike imepe kamera ebe a. See foto koodu ahụ kama.',
		scanButton: 'Scan koodu ahụ',
		photoIdle: 'See ma ọ bụ họrọ foto koodu ahụ',
		photoGallery: 'Họrọ foto na gallery gị',
		readPhoto: 'Gụọ koodu dị na foto m',
		typeInstead: 'Dee nọmba serial kama',
		footer:
			"A na-ebelata foto n'ekwentị gị tupu e ziga ya, iji chekwaa data. A na-eji foto ahụ agụ koodu ahụ; anyị anaghị edebe ya.",
		noPhoto: 'Buru ụzọ see ma ọ bụ họrọ foto koodu ahụ.',
		tooLarge: 'Foto ahụ buru oke ibu. Nwaa ọzọ, jiri foto pere mpe.',
		unreadable:
			"Enweghị m ike ịgụ koodu ọ bụla na foto a. Bute ngwugwu ahụ nso, ebe ìhè zuru ezu, ka koodu akụkụ anọ ahụ dị n'etiti. Ma ọ bụ dee nọmba serial kama."
	},

	packaging: {
		photosMetaTitle: 'Foto maka nlele ngwugwu · DETECK',
		title: 'Lelee ngwugwu ya (beta)',
		backAria: 'Laghachi na nsonaazụ',
		serialLine: 'Serial {serial}: Dabara na ndekọ · {product} · Batch {lot}',
		intro:
			'Ugbu a, see foto atọ: ihu, azụ na label. Jide ngwugwu ahụ ka ọ dị larịị, ebe ìhè zuru ezu.',
		notes: {
			front: 'A ga-agụ brand, aha na ike ọgwụ (mg) nke ọma',
			back: 'A ga-agụ ihe e ji mee ya na aha ụlọ ọrụ mepụtara ya nke ọma',
			label: 'A ga-agụ batch na ụbọchị njedebe nke ọma'
		},
		clear: '✓ O doro anya',
		checkingPhoto: 'Ana m elele foto ahụ…',
		unchecked: 'E tinyela foto ahụ. A ga-elele ya mgbe i zigara ya.',
		takePhoto: 'See foto',
		retake: 'See ọzọ',
		tooDark: 'Ọ gbara ọchịchịrị nke ukwuu. See ya ọzọ ebe ìhè ka mma.',
		glare:
			'Ìhè na-egbuke egbuke mere ka o doghị anya. Tụgharịa ngwugwu ahụ ntakịrị ka ìhè ghara ịdakwasị ya.',
		blurry:
			'O doghị anya nke ọma. Enweghị m ike ịgụ ihe e dere. Jide ekwentị ahụ nke ọma, emegharịla ya.',
		sizeNote:
			"A na-ebelata foto n'ekwentị gị tupu e ziga ha (ihe dị ka 750 KB n'ozuzu), ya mere ọ na-arụ ọrụ na 3G.",
		sending: 'A na-eziga foto…',
		submit: 'Lelee ngwugwu ya',
		checking: 'Ana m elele ngwugwu ya',
		yourCheck: 'Nlele gị',
		serialRead: 'E gụrụ serial: Dabara na ndekọ',
		photosReceived: 'Anyị natara foto 3',
		comparing: 'Ana m atụnyere logo, ihe e dere, agba na akara nchekwa',
		serialRow: 'Serial',
		valid: 'Dabara na ndekọ',
		journeyRow: 'Njem',
		packagingRow: 'Ngwugwu',
		somethingDifferent: 'Otu ihe yiri ka ọ dị iche',
		retakePhotos: 'See foto ndị ahụ ọzọ',
		notAvailableYet: 'Nlele ngwugwu adịbeghị.',
		dailyLimit: 'I ruola oke nlele ngwugwu e kwere maka taa na ngwaọrụ a. Nwaa ọzọ echi.',
		checkSerialFirst:
			'Buru ụzọ lelee nọmba serial. Nlele ngwugwu bụ maka ngwugwu nke nọmba serial ya dị na ndekọ.',
		addPhoto: {
			front: 'Tinye foto ihu ngwugwu ahụ.',
			back: 'Tinye foto azụ ngwugwu ahụ.',
			label: 'Tinye foto label na batch.'
		},
		photoProblems: {
			unreadable: 'Faịlụ a abụghị foto anyị nwere ike imepe. Jiri JPG ma ọ bụ PNG.',
			too_small: 'Foto a pere mpe nke ukwuu. Jiri foto ka ibu, nke doro anya karịa.',
			blurry:
				'Foto a edoghị anya nke ọma. Enweghị m ike ịgụ ihe e dere. Jide ekwentị ahụ nke ọma, emegharịla ya, ebe ìhè zuru ezu.',
			dark: 'Foto a gbara ọchịchịrị nke ukwuu. See ya ọzọ ebe ìhè ka mma.',
			bright:
				'Ìhè karịrị akarị mere ka foto a doghị anya. Tụgharịa ngwugwu ahụ ntakịrị ka ìhè ghara ịdakwasị ya, wee nwaa ọzọ.'
		},
		categories: {
			logo: 'Logo yiri ka ọ dị iche na nke ngwugwu ụlọ ọrụ mepụtara ya',
			font: 'Mkpụrụedemede yiri ka ha dị iche na nke ngwugwu ụlọ ọrụ mepụtara ya',
			colour: 'Agba yiri ka ọ dị iche na nke ngwugwu ụlọ ọrụ mepụtara ya',
			print_quality: 'Otú e si bipụta ya yiri ka ọ dị iche na nke ngwugwu ụlọ ọrụ mepụtara ya',
			missing_security_feature: 'A hụghị otu akara nchekwa dị na ngwugwu ụlọ ọrụ mepụtara ya',
			label_layout: 'Otú e si hazie label yiri ka ọ dị iche na nke ngwugwu ụlọ ọrụ mepụtara ya'
		},
		sides: {
			front: 'Ihu ngwugwu ahụ',
			back: 'Azụ ngwugwu ahụ',
			label: 'Label na batch'
		},
		disclaimer:
			"Nke a bụ nlele ndekọ na otú ngwugwu ahụ si dị. O nweghị ike ịnwale ihe dị n'ime ya, ya mere soro ntụziaka dọkịta ma ọ bụ pharmacist gị.",
		notAvailable:
			'Ụlọ ọrụ a enyebeghị DETECK foto ngwugwu ya, ya mere naanị nọmba serial ka m nwere ike ilele.',
		analysing: 'Ana m atụnyere ya na ngwugwu ụlọ ọrụ mepụtara ya…',
		analysingNote: 'Nke a na-ewekarị ihe na-erughị sekọnd 30.',
		photoRules: 'Akụkụ ngwugwu ahụ dum ga-apụta · ìhè zuru ezu · ọ dịghị ìhè na-egbuke egbuke',
		retain:
			'Debe foto m ruo ụbọchị 90 iji nyere DETECK aka mara otú nlele ngwugwu si ziri ezi. A ga-ehichapụ ha mgbe ahụ gasịrị.',
		beta: 'Beta: a ka na-anwale nlele ngwugwu. Were ya dịka otu ihe ngosi ọzọ, ọ bụghị azịza ikpeazụ.',
		provider:
			'A na-eziga foto gị na Anthropic, ụlọ ọrụ na-enye DETECK AI, ka e jiri ha tụnyere foto ụlọ ọrụ mepụtara ya. Ekwela ka ihu mmadụ ma ọ bụ akwụkwọ ọgwụ dọkịta dị na ha.',
		outcomes: {
			match: {
				badge: 'Ọ DỊGHỊ ỌDỊICHE A HỤRỤ',
				title: 'Ọ dịghị ọdịiche a hụrụ na foto ndị a',
				bubble:
					"Nọmba serial dabara na ndekọ ụlọ ọrụ mepụtara ya, ahụghịkwa m ọdịiche ọ bụla n'etiti ya na ngwugwu ụlọ ọrụ ahụ na foto ndị a.",
				line: 'A hụghị ihe adabaghị na foto ndị a'
			},
			mismatch: {
				badge: 'OTU IHE ADABAGHỊ',
				title: 'Otu ihe adabaghị',
				bubble:
					'Nọmba serial dị na ndekọ, mana ngwugwu ahụ yiri ka ọ dị iche na nke ụlọ ọrụ mepụtara ya.',
				nextStep:
					"Gosi pharmacist nsonaazụ a tupu i jiri ọgwụ ahụ, ma ọ bụ zụta n'ụlọ ahịa ọgwụ ọzọ.",
				line: 'A hụrụ ihe adabaghị'
			},
			unsure: {
				badge: 'O DOGHỊ ANYA',
				title: 'Enweghị m ike ịmata site na foto ndị a',
				bubble:
					'Nọmba serial dị na ndekọ, mana o doghị m anya nke ọma banyere ngwugwu ahụ ka m kwuo otu ụzọ ma ọ bụ nke ọzọ.',
				nextStep:
					"Foto doro anya karịa, e sere n'ìhè ehihie, na-enyekarị aka. Ma ọ bụ rịọ pharmacist gị ka unu lelee ya ọnụ.",
				line: 'A pụghị ịmata site na foto ndị a'
			}
		}
	},

	report: {
		metaTitle: 'Kọọ ọgwụ i chere na ọ bụ adịgboroja · DETECK',
		title: 'Kọọ ọgwụ i chere na ọ bụ adịgboroja',
		intro:
			'Gwa DETECK maka ngwugwu na-echegbu gị. Anyị na-enyocha akụkọ ọ bụla, anyị nwekwara ike izigara ya NAFDAC na ụlọ ọrụ mepụtara ya.',
		medicine: 'Ọgwụ ahụ',
		nameLabel: 'Aha na ike ọgwụ (mg) dị na ngwugwu ahụ',
		namePlaceholder: 'dịka Amoxil 500 mg kapsul',
		photosLabel: 'Foto ngwugwu ahụ (ruo {n}, ọ bụghị iwu)',
		photosHelp: 'Foto ihu, azụ na label nwere nọmba batch kacha enye aka.',
		where: 'Ebe i nwetara ya',
		place: 'Ụlọ ahịa ọgwụ, ụlọ ahịa ma ọ bụ onye na-ere ya',
		state: 'Steeti',
		chooseState: 'Họrọ steeti',
		town: 'Obodo ma ọ bụ mpaghara',
		boughtOn: 'Mgbe ị zụtara ya (ọ bụghị iwu)',
		details: 'Gịnị chegburu gị? (ọ bụghị iwu)',
		reach: 'Otú anyị ga-esi kpọtụrụ gị (ọ bụghị iwu)',
		reachNote:
			'Naanị DETECK na-ahụ ihe ndị a, iji jụọ gị ajụjụ ndị ọzọ. Ọ dịghị mgbe anyị na-enye ha ụlọ ọrụ mepụtara ya ma ọ bụ onye na-ere ya.',
		name: 'Aha',
		email: 'Email',
		phone: 'Nọmba ekwentị',
		consent:
			'Ekwere m ka DETECK kesaa akụkọ a na foto ya (ọ bụghị ozi e ji akpọtụrụ m) na NAFDAC na ụlọ ọrụ mepụtara ya.',
		submit: 'Ziga akụkọ a',
		unwell:
			'Ọ bụrụ na ahụ adịghị gị mma, ma ọ bụ ahụ adịghị onye ọzọ mma, mgbe ọ ṅụchara ọgwụ, gaa hụ dọkịta ma ọ bụ pharmacist ozugbo.',
		errors: {
			limit: 'I zigala ọtụtụ akụkọ taa. Nwaa ọzọ echi.',
			missing_drug: 'Kwuo ọgwụ ọ bụ, dịka aha na ike ọgwụ (mg) dị na ngwugwu ahụ.',
			missing_place: 'Kwuo ebe ị zụtara ya, dịka aha ụlọ ahịa ọgwụ ahụ.',
			bad_state: 'Họrọ steeti.',
			bad_email: "Ihe kọrọ n'adreesị email ahụ, dịka .com ma ọ bụ .ng.",
			photo_too_large: "Foto ọ bụla ga-adị n'okpuru 12 MB.",
			photo_unreadable: '{name} abụghị foto anyị nwere ike imepe.'
		},
		thanks: {
			metaTitle: 'E zigala akụkọ · DETECK',
			title: 'Daalụ. Akụkọ gị eruola DETECK aka.',
			body: 'Onye DETECK na-elele akụkọ ọ bụla. Ọ bụrụ na ị hapụrụ ozi e ji akpọtụrụ gị, anyị nwere ike ịkpọtụrụ gị ma anyị nwee ajụjụ. Debe ngwugwu ahụ na rịsịtị gị ma ọ bụrụ na i nwere ike.'
		}
	},

	error: {
		notFoundTitle: 'Achọtaghị m peeji ahụ',
		notFoundBody: 'O nwere ike ịbụ na link ahụ adịla ochie ma ọ bụ na e dehiere ya.',
		forbiddenTitle: 'Peeji a emepeghị maka gị',
		forbiddenBody: 'Akaụntụ gị enweghị ikike ịbanye na peeji a.',
		tooManyTitle: 'Arịrịọ karịrị akarị',
		tooManyBody: 'Biko chere otu nkeji.',
		otherTitle: "Otu ihe mebiri n'akụkụ anyị",
		otherBody:
			'Ọ bụghị ihe ọ bụla i mere kpatara nke a. Biko nwaa ọzọ mgbe otu nkeji gachara. Ọ bụrụ na ị na-elele ọgwụ, dee nọmba serial ọzọ.',
		code: 'Njehie {status}'
	},

	landing: {
		metaTitle: 'Banyere DETECK · Lelee ma ọgwụ dabara na ndekọ ụlọ ọrụ mepụtara ha',
		metaDescription:
			'DETECK na-enyere onye ọ bụla nọ na Naịjirịa aka ilele ma nọmba serial ọgwụ dabara na ndekọ ụlọ ọrụ mepụtara ya nyere, ma hụ njem e dekọrọ maka ya. Ị chọghị akaụntụ, DETECK anaghịkwa ana ego.',
		navWho: 'Ndị anyị na-ejere ozi',
		navVision: 'Ọhụụ anyị',
		eyebrow: 'Nlele ọgwụ maka Naịjirịa · DETECK anaghị ana ego',
		heroTitle: 'Nyochaa tupu ị tụkwasị obi.',
		lede: 'Dee nọmba serial dị na ngwugwu ọgwụ, ma ọ bụ scan koodu ya. DETECK na-atụnyere ya na ndekọ ụlọ ọrụ mepụtara ya nyere, ma gosi gị onye mepụtara ya na njem e dekọrọ ruo mgbe o ruru gị aka.',
		scanPack: 'Scan ngwugwu',
		seeHow: 'Hụ otú o si arụ ọrụ',
		heroBubble: 'Ndewo, abụ m Deteck. Anọ m ebe a inyere gị aka.',
		heroAlt:
			"Nwaanyị pharmacist onye Naịjirịa ji ekwentị ya na-elele igbe ọgwụ, ebe onye ahịa na-eche n'ihu kanta",
		heroChip: 'Dabara na ndekọ: nke ụlọ ọrụ mepụtara ya',
		heroChipSub: 'Ọmụmaatụ · Onye mepụtara ya → Onye na-ekesa ọgwụ → Ụlọ ahịa ọgwụ',
		runPharmacy: 'I nwere ụlọ ahịa ọgwụ?',
		runPharmacyLink: 'Hụ otú DETECK si enyere gị aka',
		step1Title: 'Dee ma ọ bụ scan koodu',
		step1Text:
			'Dee nọmba serial e dere na ngwugwu ahụ, ma ọ bụ jiri ekwentị gị scan koodu ngwaahịa ahụ.',
		step2Title: 'Anyị na-elele ndekọ',
		step2Text:
			"DETECK na-achọ nọmba serial ahụ na ndekọ ụlọ ọrụ mepụtara ya nyere, gụnyere njem e dekọrọ ka o si n'aka ndị na-ekesa ọgwụ na ụlọ ahịa ọgwụ gafee.",
		step3Title: 'Deteck na-agwa gị nsonaazụ',
		step3Text:
			"“Dabara na ndekọ” ma ọ bụ “A maghị ya”, n'okwu dị mfe, tinyere njem e dekọrọ maka ọgwụ ahụ. Ọ bụrụ na ndekọ ezughị ezu iji jide n'aka, Deteck ga-agwa gị.",
		whoLead: 'E mere ya maka onye ọ bụla na-azụ, na-ebugharị ma ọ bụ na-enye ndị mmadụ ọgwụ.',
		audiences: {
			citizens: {
				label: 'Ụmụ amaala Naịjirịa',
				alt: "Nne ji ekwentị ya na-elele igbe ọgwụ n'ihu kanta ụlọ ahịa ọgwụ",
				title: 'Lelee tupu ị zụta ya ma ọ bụ jiri ya',
				text: "Dee nọmba serial dị n'ọgwụ, ma ọ bụ scan koodu ya, ma hụ ma ọ dabara na ndekọ ụlọ ọrụ mepụtara ya."
			},
			pharmacies: {
				label: 'Ụlọ ahịa ọgwụ',
				alt: 'Nwaanyị pharmacist ji ekwentị ya na-elele igbe ọgwụ',
				title: 'Lelee ihe ị natara',
				text: "Lelee ọgwụ sitere n'aka ndị na-enye gị ngwaahịa, ma hụ ụlọ ọrụ mepụtara ha na otú e si kesaa ha dịka ndekọ si dị, tupu ha erute n'ụlọ ahịa gị."
			},
			hospitals: {
				label: 'Ụlọ ọgwụ na ebe ọgwụgwọ',
				alt: "Nọọsụ na-elele igbe ọgwụ n'ụlọ nchekwa ngwa nke ụlọ ọgwụ",
				title: 'Lelee tupu i nye ndị ọrịa',
				text: 'Lelee ọgwụ ebe ọrụ gị na-anata tupu e nye ndị ọrịa ha.'
			},
			distributors: {
				label: "Ndị na-ekesa na ndị na-ere n'ọtụtụ",
				alt: '',
				title: 'Sonye na njem e dekọrọ',
				text: "Mgbe ụlọ ọrụ na-emepụta ọgwụ dekọrọ na o nyere gị ọgwụ, azụmahịa gị ga-apụta na njem ọgwụ ahụ, ka ndị na-azụ ahịa wee hụ ebe e dekọrọ ngwaahịa ahụ n'ụzọ."
			},
			manufacturers: {
				label: 'Ndị na-emepụta ọgwụ',
				alt: "Onye ọrụ na-enyocha igbe ọgwụ n'ahịrị a na-etinye ọgwụ n'igbe",
				title: 'Kesaa ozi gbasara ngwaahịa gị',
				text: 'Bulite ngwaahịa gị, nọmba serial, ndekọ nkesa ọgwụ na foto ngwugwu, ka ndị mmadụ wee lelee ma ọgwụ gị dabara na ndekọ gị.'
			}
		},
		visionTitle:
			"Ọgwụ ọ bụla dị na Naịjirịa, **a ga-esoro njem ya** site n'ụlọ nrụpụta ruo n'aka gị.",
		visionText:
			"Onye Naịjirịa ọ bụla kwesịrị ịma ebe ọgwụ ya si bịa. DETECK na-ejikọ nọmba serial nke ngwugwu ọ bụla na ndekọ ụlọ ọrụ mepụtara ya, ka i wee nwee ike ilele ihe ọ bụ na njem e dekọrọ maka ya, kama ịdabere naanị n'otú ngwugwu ahụ si dị.",
		impactTitle: 'Mgbanwe anyị na-agba mbọ ịhụ',
		impact1Alt: "Nne ji ekwentị ya na-elele igbe ọgwụ n'ihu kanta ụlọ ahịa ọgwụ",
		impact1Title: 'Ezinụlọ nwere obi ike',
		impact1Text: "Ndị mmadụ nwere ike ilele ọgwụ n'onwe ha tupu ha zụta ya ma ọ bụ jiri ya.",
		impact2Alt: "Nọọsụ ji tablet na-elele igbe ọgwụ dị n'elu shelf n'ụlọ nchekwa ngwa nke ụlọ ọgwụ",
		impact2Title: 'Inye ọgwụ na nlezianya',
		impact2Text:
			'Ụlọ ahịa ọgwụ na ụlọ ọgwụ nwere ike ilele ọgwụ ha natara tupu ha nye ndị mmadụ ya.',
		impact3Alt: "Onye ọrụ yi uwe nchedo na-enyocha igbe ọgwụ n'ahịrị a na-etinye ọgwụ n'igbe",
		impact3Title: 'Ndekọ ndị nwe ya ga-aza ajụjụ maka ya',
		impact3Text:
			'Ndị na-emepụta ọgwụ na-edebanye aha ngwaahịa ha ka ndị mmadụ wee lelee ma ha dabara na ndekọ ha.',
		whyEyebrow: 'Gịnị kpatara DETECK',
		whyTitle: 'Otu azịza doro anya, nke na-ekwu eziokwu banyere ihe ọ maara.',
		strengths: {
			serial: 'Na-atụnyere nọmba serial na ndekọ ụlọ ọrụ mepụtara ya nyere DETECK',
			journey: "Na-egosi njem e dekọrọ site n'aka ndị na-ekesa ọgwụ na ụlọ ahịa ọgwụ",
			packaging:
				'Nwere ike ịtụnyere foto ngwugwu na ngwugwu ụlọ ọrụ mepụtara ya (beta, maka ụfọdụ ngwaahịa)',
			network:
				'Nlele nọmba serial na-arụ ọrụ na 2G na 3G. DETECK anaghị ana ego; ị ga-akwụ ụgwọ data dịka ọ na-adị',
			honest: "Na-agwa gị n'eziokwu mgbe ozi ezughị ezu iji jide n'aka"
		},
		verifyTitle: "Ngwugwu ọgwụ dị gị n'aka? Lelee ya ugbu a.",
		verifyLabel: 'Nọmba serial dị na ngwugwu ahụ',
		verifyButton: 'Lelee ya',
		verifyFine:
			"Nlele nọmba serial na-arụ ọrụ na 2G na 3G. DETECK anaghị ana ego; ị ga-akwụ ụgwọ data dịka ọ na-adị. Nsonaazụ dabere na ndekọ ndị na-emepụta ọgwụ na-enye DETECK. Mgbe ozi ezughị ezu iji jide n'aka, Deteck ga-agwa gị.",
		footerLead: "Anyị na ndị mmekọ n'ụzọ nkesa ọgwụ na Naịjirịa niile na-ewu DETECK.",
		pilotPartner: 'Bụrụ onye mmekọ nnwale',
		registerCompany: 'Debanye aha ụlọ ọrụ gị',
		footerNav: 'Ala peeji',
		footerProduct: 'Ngwaahịa',
		footerCompany: 'Ụlọ ọrụ',
		contact: 'Kpọtụrụ anyị',
		legal:
			"© 2026 DETECK. Aha ngwaahịa na ndekọ e gosiri bụ ọmụmaatụ. Nlele dabere na ndị na-emepụta ọgwụ sonyere na-edekọ ngwaahịa ha na otú e si ekesa ha. DETECK na-elele ndekọ, na n'ime beta, otú ngwugwu si dị; o nweghị ike ịnwale ihe dị n'ime ngwugwu."
	}
};
