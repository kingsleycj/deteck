/** Yorùbá. Draft: needs a native speaker's review before launch. */
import type { Messages } from './en.ts';

export const yo: Messages = {
	meta: {
		name: 'Yorùbá',
		reviewed: false
	},

	common: {
		or: 'tàbí',
		and: 'àti',
		back: 'Padà',
		checkMedicine: 'Ṣàyẹ̀wò oògùn',
		checkAnother: 'Ṣàyẹ̀wò oògùn mìíràn',
		checkSerial: 'Ṣàyẹ̀wò nọ́mbà serial',
		language: 'Èdè',
		draftNotice:
			'Ìtumọ̀ yìí kò tíì jẹ́ ti ìkẹyìn: àwọn tí Yorùbá jẹ́ èdè abínibí wọn ṣì ń yẹ̀ ẹ́ wò. Bí ohunkóhun kò bá yé yín, ẹ yí èdè padà sí Gẹ̀ẹ́sì.',
		englishOnly: 'Èdè Gẹ̀ẹ́sì ni ojú-ìwé yìí wà.',
		notRecorded: 'Kò sí nínú àkọsílẹ̀',
		dateNotRecorded: 'Ọjọ́ kò sí nínú àkọsílẹ̀'
	},

	nav: {
		home: 'Ojú-ìwé àkọ́kọ́ Deteck',
		main: 'Àwọn ojú-ìwé pàtàkì',
		how: 'Bí ó ṣe ń ṣiṣẹ́',
		pharmacies: 'Fún àwọn ilé ìtajà oògùn',
		manufacturers: 'Fún àwọn ilé-iṣẹ́ tó ń ṣe oògùn',
		badge: 'DETECK kò gba owó'
	},

	footer: {
		about: 'Nípa DETECK',
		check: 'Ṣàyẹ̀wò oògùn',
		privacy: 'Àṣírí',
		terms: 'Àwọn òfin lílò',
		business: 'Fún àwọn ilé-iṣẹ́ tó ń ṣe oògùn àti àwọn ilé ìtajà oògùn',
		developers: 'Fún àwọn developer',
		note: 'Àbájáde dá lórí àkọsílẹ̀ tí àwọn ilé-iṣẹ́ tó ń ṣe oògùn fún DETECK.'
	},

	check: {
		metaTitle: 'DETECK · Ṣàyẹ̀wò oògùn yín',
		metaDescription:
			'Ẹ tẹ nọ́mbà serial tó wà lórí páálí oògùn, kí ẹ sì fi wé àkọsílẹ̀ ilé-iṣẹ́ tó ṣe é. Ẹ kò nílò àkáǹtì, DETECK kò sì gba owó.',
		pilotOn:
			'Àwọn ẹ̀yà ìgbìyànjú (pilot) ti ṣí sílẹ̀ nínú browser yìí fún ọjọ́ 90, títí kan àyẹ̀wò páálí (ìdánwò).',
		greeting:
			'Ẹ n lẹ́, Deteck ni mí. Ẹ tẹ nọ́mbà serial tó wà lórí páálí yín, màá sì bá yín yẹ̀ ẹ́ wò.',
		title: 'Ṣàyẹ̀wò oògùn yín',
		subtitle: 'Ẹ wò bóyá ó bá àkọsílẹ̀ ilé-iṣẹ́ tó ṣe é mu.',
		label: 'Nọ́mbà serial',
		placeholder: 'àpẹẹrẹ: 7K4M 9QX2 TB8D',
		hint: 'Ẹ wò ó lẹ́gbẹ̀ẹ́ barcode, lẹ́yìn **SN** tàbí **Serial**.',
		submit: 'Ṣàyẹ̀wò oògùn',
		scan: 'Fi kámẹ́rà ka kóòdù dípò bẹ́ẹ̀',
		footer:
			'Àyẹ̀wò serial ń ṣiṣẹ́ lórí 2G àti 3G. Ẹ kò nílò àkáǹtì. DETECK kò gba owó; owó dátà yín yóò lọ bí ó ṣe máa ń lọ.',
		humanPrompt:
			'**Ṣé ẹ ń ṣàyẹ̀wò ọ̀pọ̀lọpọ̀ páálí?** Ẹ fìdí rẹ̀ múlẹ̀ pé ènìyàn ni yín, kí ẹ lè máa bá a lọ láìdúró.',
		humanButton: 'Máa bá àyẹ̀wò lọ',
		humanFailed: 'Ẹ jọ̀wọ́, ẹ parí àyẹ̀wò "ṣé ènìyàn ni yín?".',
		asideLabel: 'Ohun tí DETECK ń ṣàyẹ̀wò',
		asideTitle: 'Ohun tí Deteck ń ṣàyẹ̀wò',
		asideSerial: '**Serial náà.** Ṣé ó bá àkọsílẹ̀ ilé-iṣẹ́ tó ṣe é mu?',
		asidePackaging:
			'**Páálí náà.** AI ń wá ìyàtọ̀ tí ojú lè rí láàárín rẹ̀ àti páálí ilé-iṣẹ́ tó ṣe é.',
		asideJourney: '**Ìrìn-àjò rẹ̀.** Àwọn ilé-iṣẹ́ tí àkọsílẹ̀ sọ pé ó ti kọjá lọ́wọ́ wọn.',
		asideNote: 'Deteck ń sọ ohun tí àkọsílẹ̀ fi hàn. Kò lè dán ohun tó wà nínú páálí wò.',
		checkingTitle: 'A ń ṣàyẹ̀wò àkọsílẹ̀…',
		checkingBody: 'Deteck ń fi serial yín wé àkọsílẹ̀ ilé-iṣẹ́ tó ṣe é.',
		retry: 'Tún gbìyànjú',
		tryAgain: 'Gbìyànjú lẹ́ẹ̀kan sí i'
	},

	format: {
		empty: 'Ẹ tẹ nọ́mbà serial tí wọ́n tẹ̀ sórí páálí.',
		too_short:
			'Ìyẹn ti kéré jù fún nọ́mbà serial. Serial máa ń ní lẹ́tà tàbí nọ́mbà mẹ́rin ó kéré tán.',
		too_long:
			'Ìyẹn gùn ju nọ́mbà serial lọ (serial kì í ju lẹ́tà àti nọ́mbà 20 lọ). Ẹ rí i dájú pé serial nìkan ni ẹ tẹ.',
		bad_characters: 'Lẹ́tà àti nọ́mbà tí wọ́n tẹ̀ lẹ́yìn SN lórí páálí nìkan ni kí ẹ lò.',
		nafdac_number:
			'Ìyẹn jọ nọ́mbà ìforúkọsílẹ̀ NAFDAC. Kóòdù mìíràn ni serial, wọ́n sábà máa ń tẹ̀ ẹ́ lẹ́yìn SN nítòsí barcode.',
		bad_code: 'A kò lè ka kóòdù yẹn. Ẹ tẹ serial tí wọ́n tẹ̀ lẹ́yìn SN dípò rẹ̀.',
		mascot:
			'Hmm, ìyẹn kò tíì jọ nọ́mbà serial. Ohun tí ẹ tẹ ṣì wà nínú àpótí, kí ẹ lè ṣàtúnṣe ibi tí kò tọ̀nà nìkan.'
	},

	network: {
		slow: 'Ìsopọ̀ ayélujára ń lọ́ra. Ẹ tẹ "Tún gbìyànjú". Mo ti fi serial yín pamọ́.',
		slowServer:
			'Àkọsílẹ̀ pẹ́ jù kí ó tó dáhùn. Serial yín ṣì wà nínú àpótí: ẹ tẹ "Ṣàyẹ̀wò oògùn" láti gbìyànjú lẹ́ẹ̀kan sí i.',
		offlineTitle: 'N kò lè kàn sí àkọsílẹ̀',
		offlineBody:
			'Ó dà bí ẹni pé fóònù yín kò sí lórí ayélujára. Serial yín ṣì wà nínú àpótí, nítorí náà ẹ lè tẹ "Ṣàyẹ̀wò oògùn" lẹ́ẹ̀kan sí i nígbà tí ìsopọ̀ ayélujára bá padà.',
		rateLimited: {
			one: 'Àyẹ̀wò ti pọ̀ jù láàárín àkókò kúkúrú. Ẹ jọ̀wọ́, ẹ dúró fún ìṣẹ́jú {n}, kí ẹ tó gbìyànjú lẹ́ẹ̀kan sí i.',
			other:
				'Àyẹ̀wò ti pọ̀ jù láàárín àkókò kúkúrú. Ẹ jọ̀wọ́, ẹ dúró fún ìṣẹ́jú {n}, kí ẹ tó gbìyànjú lẹ́ẹ̀kan sí i.'
		}
	},

	result: {
		metaExpired: 'Àbájáde ti kọjá àkókò',
		head: 'Àbájáde',
		backAria: 'Padà sí ojú-ìwé àkọ́kọ́',
		serialAria: 'Serial tí a ṣàyẹ̀wò',
		heading: 'Àbájáde: {badges}',
		expiredTitle: 'Àbájáde yìí ti kọjá àkókò',
		expiredBody:
			'Ìṣẹ́jú 30 péré ni a máa ń tọ́jú àbájáde. Ẹ tún ṣàyẹ̀wò serial náà láti rí àkọsílẹ̀ tuntun.',
		batchLabel: 'Nọ́mbà batch',
		batchHelp: 'Wọ́n tẹ̀ ẹ́ lẹ́yìn LOT, BN tàbí Batch lórí páálí.',
		batchMissing: 'Ẹ tẹ nọ́mbà batch tí wọ́n tẹ̀ sórí páálí.',
		batchNotMatched:
			'Nọ́mbà batch yẹn kò bá àkọsílẹ̀ serial yìí mu. Ẹ wo batch tí wọ́n tẹ̀ lẹ́yìn LOT, BN tàbí Batch, kí ẹ sì tún un tẹ.',
		continue: 'Tẹ̀síwájú',
		detailsAria: 'Àlàyé àkọsílẹ̀',
		product: 'Oògùn',
		manufacturer: 'Ilé-iṣẹ́ tó ṣe é',
		nafdac: 'Nọ́mbà ìforúkọsílẹ̀ NAFDAC',
		batch: 'Batch',
		expires: 'Ọjọ́ ìparí',
		expired: 'Ọjọ́ rẹ̀ ti kọjá',
		pack: 'Páálí',
		reasonsIntro: 'Ohun tó lè fà á nìyí:',
		journeyLink: 'Ẹ wo ìrìn-àjò oògùn náà',
		checkPackaging: 'Ṣàyẹ̀wò páálí (ìdánwò)',
		scanCode: 'Fi kámẹ́rà ka kóòdù dípò bẹ́ẹ̀',
		retype: 'Tẹ serial náà lẹ́ẹ̀kan sí i',
		report: 'Ròyìn oògùn tí ẹ fura pé ayédèrú ni',
		worried: 'Ṣé páálí yìí ṣì ń dà yín láàmú?',
		worriedLink: 'Ẹ fi tó DETECK létí',
		journeyStillStands: 'Àbájáde serial náà kò yí padà.',
		footnote:
			'Èyí ń fi ohun tí àkọsílẹ̀ ilé-iṣẹ́ tó ṣe é sọ hàn. Kì í ṣe àyẹ̀wò yàrá ìwádìí (lab) lórí ohun tó wà nínú páálí.',

		thisMedicine: 'oògùn yìí',
		theManufacturer: 'ilé-iṣẹ́ tó ṣe é',
		TheManufacturer: 'Ilé-iṣẹ́ tó ṣe é',
		askPharmacist: 'Ẹ béèrè lọ́wọ́ pharmacist kí ẹ tó lò ó.',
		coverage: 'Títí di ìsinsìnyí, DETECK ní àkọsílẹ̀ {products} láti ọ̀dọ̀ {manufacturers}.',
		products: { one: 'oògùn {n}', other: 'oògùn {n}' },
		manufacturers: { one: 'ilé-iṣẹ́ {n}', other: 'ilé-iṣẹ́ {n}' },

		valid: {
			badge: 'Ó BÁ ÀKỌSÍLẸ̀ MU',
			bubble: 'Serial yìí bá àkọsílẹ̀ {maker} fún {product} mu.'
		},
		mismatch: {
			badge: 'ṢÀYẸ̀WÒ PÁÁLÍ',
			title: 'Páálí náà kò bá àkọsílẹ̀ mu',
			bubbleLot:
				'Serial yìí bá àkọsílẹ̀ {maker} fún {product} mu, ṣùgbọ́n nọ́mbà batch tí wọ́n tẹ̀ sórí páálí yìí yàtọ̀ sí èyí tó wà nínú àkọsílẹ̀.',
			bubbleExpiry:
				'Serial yìí bá àkọsílẹ̀ {maker} fún {product} mu, ṣùgbọ́n ọjọ́ ìparí tí wọ́n tẹ̀ sórí páálí yìí yàtọ̀ sí èyí tó wà nínú àkọsílẹ̀.',
			nextStep: 'Ẹ fi àbájáde yìí han pharmacist kí ẹ tó lò ó, kí ẹ sì tọ́jú páálí náà.'
		},
		expiredPack: {
			badge: 'ỌJỌ́ RẸ̀ TI KỌJÁ',
			title: 'Ó wà nínú àkọsílẹ̀, ṣùgbọ́n ọjọ́ ìparí rẹ̀ ti kọjá',
			bubble: 'Serial yìí bá àkọsílẹ̀ {maker} fún {product} mu, ṣùgbọ́n ọjọ́ ìparí rẹ̀ ti kọjá.',
			nextStep:
				'Oògùn tí ọjọ́ ìparí rẹ̀ ti kọjá lè má ṣiṣẹ́ bí ó ṣe yẹ. Ẹ gbé e padà sí ibi tí ẹ ti rà á, kí ẹ sì béèrè fún páálí tí ọjọ́ ìparí rẹ̀ kò tíì kọjá.'
		},
		recalled: {
			badgeRecalled: 'WỌ́N TI PÈ É PADÀ',
			badgeWithdrawn: 'WỌ́N TI YỌ Ọ́ NÍ ỌJÀ',
			titleRecalled: 'Wọ́n ti pè batch yìí padà',
			titleWithdrawn: 'Wọ́n ti yọ batch yìí kúrò ní ọjà',
			bubbleRecalled: 'Wọ́n ti pè batch {lot} ti {product} padà{by}{on}.',
			bubbleWithdrawn: 'Wọ́n ti yọ batch {lot} ti {product} kúrò ní ọjà{by}{on}.',
			by: ' láti ọwọ́ {source}',
			on: ' ní ọjọ́ {date}',
			reason: 'Ìdí tí wọ́n sọ: {reason}',
			nextStep:
				'Kí ẹ tó tún lo oògùn yín, ẹ béèrè lọ́wọ́ pharmacist tàbí dókítà ohun tí ẹ lè lò dípò rẹ̀, kí ẹ sì gbé páálí yìí padà sí ibi tí ẹ ti rà á.'
		},
		cantConfirm: {
			badge: 'A KÒ LÈ FÌDÍ RẸ̀ MÚLẸ̀',
			title: 'A kò lè fìdí àkọsílẹ̀ yìí múlẹ̀ báyìí',
			bubbleProduct:
				'Wọ́n ti dá àkọsílẹ̀ oògùn yìí dúró fún ìgbà díẹ̀ lórí DETECK, nítorí náà n kò lè fún yín ní àbájáde fún páálí yìí.',
			bubbleManufacturer:
				'Wọ́n ti dá àkọsílẹ̀ ilé-iṣẹ́ tó ṣe é dúró fún ìgbà díẹ̀ lórí DETECK, nítorí náà n kò lè fún yín ní àbájáde fún páálí yìí.'
		},
		notCovered: {
			badge: 'KÒ TÍÌ SÍ LÓRÍ DETECK',
			title: 'Oògùn yìí kò tíì sí lórí DETECK',
			bubble:
				'Ilé-iṣẹ́ tó ṣe é kò tíì fún DETECK ní àkọsílẹ̀ rẹ̀, nítorí náà n kò lè ṣàyẹ̀wò páálí yìí. Èyí kò túmọ̀ sí pé ayédèrú ni.',
			reviewBubble:
				'Ilé-iṣẹ́ tó ṣe é ti fi oògùn yìí kún un, ṣùgbọ́n DETECK ṣì ń ṣàyẹ̀wò àkọsílẹ̀ rẹ̀, nítorí náà n kò lè ṣàyẹ̀wò páálí yìí báyìí. Èyí kò túmọ̀ sí pé ayédèrú ni.',
			nextStep: 'Ẹ lè béèrè lọ́wọ́ pharmacist yín nípa oògùn yìí.'
		},
		needsBatch: {
			badge: 'Ó KÙ ÌGBÉSẸ̀ KAN',
			title: 'Batch wo ló wà lórí páálí?',
			bubble: 'Serial yìí bá oògùn tó ju ẹyọ kan lọ mu. Ẹ tẹ nọ́mbà batch kí n lè rí èyí tó tọ́.',
			scanTitle: 'Ẹ ṣe scan kóòdù náà láti parí',
			scanBubble:
				'Serial àti nọ́mbà batch yìí bá oògùn tó ju ẹyọ kan lọ mu. Ẹ ṣe scan kóòdù onígun mẹ́rin tó wà lórí páálí kí n lè mọ èyí tó jẹ́.'
		},
		unrecognised: {
			badge: 'A KÒ DÁ A MỌ̀',
			title: 'A kò rí serial yìí',
			not_found: 'N kò rí serial yìí nínú àkọsílẹ̀ tí mo ní.',
			not_found_for_covered_product:
				'Oògùn yìí wà lórí DETECK, ṣùgbọ́n serial yìí kò sí nínú àkọsílẹ̀ ilé-iṣẹ́ tó ṣe é.',
			batch_not_matched: 'Nọ́mbà batch yẹn kò bá àkọsílẹ̀ serial yìí mu.',
			no_serial_in_code:
				'Kóòdù yìí sọ irú oògùn tí ó jẹ́, ṣùgbọ́n kò ní nọ́mbà serial, nítorí náà n kò lè ṣàyẹ̀wò páálí yìí.',
			mistyped:
				'Àṣìṣe wáyé nígbà tí a ń tẹ serial náà. Ẹ tún un tẹ, kí ẹ sì fi lẹ́tà àti nọ́mbà kọ̀ọ̀kan wé èyí tó wà lórí páálí.',
			notShared: 'Ilé-iṣẹ́ tó ṣe é kò tíì fún DETECK ní àkọsílẹ̀ rẹ̀.',
			notRecorded: 'Kóòdù tó wà lórí páálí kì í ṣe èyí tí ilé-iṣẹ́ tó ṣe é kọ sílẹ̀.',
			serialWhere: 'Ibi tí ẹ ti lè rí serial lórí {drug}: {hint}',
			typeInstead: 'Ẹ tẹ serial yẹn sí ojú-ìwé àyẹ̀wò dípò kí ẹ fi kámẹ́rà kà á.',
			typeToConfirm: 'Ẹ tẹ serial yẹn sí ojú-ìwé àyẹ̀wò, láti rí i dájú pé kámẹ́rà kà á dáadáa.',
			nextStepKeep: 'Ẹ béèrè lọ́wọ́ pharmacist kí ẹ tó lò ó, kí ẹ sì tọ́jú páálí náà.'
		}
	},

	alerts: {
		summary: 'Ẹ sọ fún mi bí wọ́n bá pè batch yìí padà',
		how: 'Bí a ṣe lè kàn sí yín',
		email: 'Email',
		whatsapp: 'WhatsApp',
		addressBoth: 'Email tàbí nọ́mbà WhatsApp',
		consent:
			'DETECK lè lo èyí láti sọ fún mi nípa batch yìí nìkan, kí ó sì pa á rẹ́ ní ọjọ́ 30 lẹ́yìn tí ọjọ́ ìparí batch náà bá kọjá.',
		signUp: 'Forúkọ sílẹ̀',
		needConsent: 'Ẹ fi àmì sí àpótí náà láti gbà fún ìkìlọ̀ náà.',
		already: 'Ẹ ti forúkọ sílẹ̀ fún batch yìí tẹ́lẹ̀.',
		checkEmail: 'Ẹ wo email yín, kí ẹ sì tẹ líǹkì náà láti fìdí rẹ̀ múlẹ̀.',
		whatsappDone: 'A ti fi ọ̀rọ̀ WhatsApp ránṣẹ́ sí yín. Ẹ fèsì YES láti fìdí ìkìlọ̀ náà múlẹ̀.',
		errors: {
			expired: 'Àbájáde yìí ti kọjá àkókò. Ẹ tún ṣàyẹ̀wò serial náà, lẹ́yìn náà kí ẹ forúkọ sílẹ̀.',
			bad_email: 'Nǹkan kan kù nínú àdírẹ́sì email yẹn, bí .com tàbí .ng.',
			whatsapp_off: 'Ìkìlọ̀ lórí WhatsApp kò tíì sí.',
			bad_phone: 'Ẹ tẹ nọ́mbà WhatsApp yín, bí 0803 123 4567.',
			whatsapp_failed: 'A kò lè fi ọ̀rọ̀ WhatsApp ránṣẹ́ sí nọ́mbà yẹn.',
			already_recalled:
				'Wọ́n ti pe batch yìí padà tàbí wọ́n ti yọ ọ́ ní ọjà. Ẹ tún ṣàyẹ̀wò serial náà láti rí ohun tí ẹ máa ṣe.',
			too_many:
				'A ti fi ọ̀rọ̀ ìforúkọsílẹ̀ ránṣẹ́ sí àdírẹ́sì yìí lónìí. Ẹ wo inbox yín (àti spam), tàbí kí ẹ gbìyànjú lọ́la.',
			daily_limit: 'Ìforúkọsílẹ̀ fún ìkìlọ̀ ti pọ̀ jù fún òní. Ẹ jọ̀wọ́, ẹ gbìyànjú lọ́la.'
		},
		confirm: {
			question: 'Ṣé ẹ fẹ́ gba ìkìlọ̀ ìpèpadà fún batch {lot} ti {drug}?',
			button: 'Gba ìkìlọ̀ náà',
			metaTitle: 'Ìkìlọ̀ ìpèpadà · DETECK',
			doneTitle: 'Ẹ ti forúkọ sílẹ̀',
			doneBody:
				'A máa fi email ránṣẹ́ sí yín bí wọ́n bá pè batch {lot} ti {drug} padà, tàbí tí wọ́n bá yọ ọ́ kúrò ní ọjà. Gbogbo ìkìlọ̀ ló ní líǹkì tí ẹ lè fi dá wọn dúró.',
			badTitle: 'Líǹkì yìí kò ṣiṣẹ́',
			badBody:
				'Ó lè jẹ́ pé kò pé, tàbí pé ìforúkọsílẹ̀ náà ti kọjá àkókò. Ẹ tún ṣàyẹ̀wò serial náà láti forúkọ sílẹ̀.'
		},
		stop: {
			metaTitle: 'Dá ìkìlọ̀ ìpèpadà dúró · DETECK',
			question: 'Ṣé kí a dá ìkìlọ̀ ìpèpadà fún batch yìí dúró?',
			button: 'Dá ìkìlọ̀ dúró',
			stoppedTitle: 'A ti dá ìkìlọ̀ dúró',
			stoppedBody: 'A ti pa àdírẹ́sì yín rẹ́ fún batch yìí.',
			badTitle: 'Líǹkì yìí kò ṣiṣẹ́',
			badBody: 'Ó lè jẹ́ pé kò pé. Ó sì lè jẹ́ pé a ti yọ ìforúkọsílẹ̀ yín kúrò tẹ́lẹ̀.'
		},
		emails: {
			confirmSubject: 'Ẹ fìdí ìkìlọ̀ ìpèpadà fún {drug} múlẹ̀',
			confirmBody:
				'Ẹ ní kí DETECK sọ fún yín bí wọ́n bá pè batch {lot} ti {drug} padà, tàbí tí wọ́n bá yọ ọ́ kúrò ní ọjà.\n\nẸ fìdí rẹ̀ múlẹ̀ níbí:\n{confirmUrl}\n\nDETECK ń lo àdírẹ́sì yìí fún ìkìlọ̀ yìí nìkan, yóò sì pa á rẹ́ ní ọjọ́ 30 lẹ́yìn tí ọjọ́ ìparí batch náà bá kọjá. Láti fagilé báyìí:\n{stopUrl}',
			recallSubjectRecalled: 'Wọ́n ti pè batch {lot} ti {drug} padà',
			recallSubjectWithdrawn: 'Wọ́n ti yọ batch {lot} ti {drug} kúrò ní ọjà',
			recallBodyRecalled: 'Wọ́n ti pè batch {lot} ti {drug} padà{by}.',
			recallBodyWithdrawn: 'Wọ́n ti yọ batch {lot} ti {drug} kúrò ní ọjà{by}.',
			by: ' láti ọwọ́ {source}',
			reason: 'Ìdí tí wọ́n sọ: {reason}',
			advice:
				'Bí ẹ bá ní páálí yìí, kí ẹ tó tún lo oògùn yín, ẹ béèrè lọ́wọ́ pharmacist tàbí dókítà ohun tí ẹ lè lò dípò rẹ̀, kí ẹ sì gbé páálí náà padà sí ibi tí ẹ ti rà á.',
			stop: 'Tí DETECK bá fagi lé ìpèpadà yìí, ẹ ó gba ímeèlì kan sí i. Láti dá ìkìlọ̀ dúró báyìí:\n{stopUrl}',
			liftedSubject: 'Wọ́n ti fagi lé ìpèpadà batch {lot} ti {drug}',
			liftedBody:
				'Batch {lot} ti {drug} kò sí lábẹ́ ìpèpadà mọ́. Àyẹ̀wò àwọn páálí rẹ̀ yóò fún yín ní èsì bí ó ti máa ń rí.',
			liftedStop:
				'Ẹ ó gba ímeèlì mìíràn tí wọ́n bá tún pe batch yìí padà. Láti dá ìkìlọ̀ dúró:\n{stopUrl}',
			signature: 'DETECK\nBí ẹ kò bá retí email yìí, ẹ lè fojú fò ó.'
		}
	},

	journey: {
		metaTitle: 'DETECK · Ìrìn-àjò oògùn náà',
		title: 'Ìrìn-àjò oògùn náà',
		backAria: 'Padà sí àbájáde',
		expiredBody: 'Ẹ tún ṣàyẹ̀wò serial náà láti rí ìrìn-àjò rẹ̀.',
		batchLine: '{product} · Batch {lot}',
		noneTitle: 'Kò tíì sí ìrìn-àjò tí a kọ sílẹ̀',
		whatWeKnow: 'Ohun tí a mọ̀',
		madeBy: '{maker} ló ṣe é',
		madeExpires: 'Wọ́n ṣe é ní {made} · Ọjọ́ ìparí: {expires}',
		gap: 'Kò sí àkọsílẹ̀ fún ìgbésẹ̀ yìí',
		gapBetween: 'Láàárín {after} àti {before}',
		stepBatch: '{place} · Batch {lot} · Ọjọ́ ìparí: {expires}',
		verified: 'DETECK ti fìdí rẹ̀ múlẹ̀',
		confirmed: 'Ilé-iṣẹ́ yìí ti fìdí rẹ̀ múlẹ̀ pé àwọn gbà á',
		unverified: 'DETECK kò tíì fìdí rẹ̀ múlẹ̀',
		recordsEnd: 'Àkọsílẹ̀ parí síbí. Àwọn ìgbésẹ̀ tó tẹ̀lé kò tíì sí nínú àkọsílẹ̀ DETECK.',
		sellerPrompt:
			'Ṣé ibòmìíràn lẹ ti ń rà á? Àkọsílẹ̀ fi hàn pé páálí yìí wà lọ́dọ̀ {holder}. Bí ẹ bá ń rà á níbòmìíràn, ẹ béèrè lọ́wọ́ ẹni tó ń tà á ibi tí ó ti wá.',
		batchPrompt:
			'Ṣé ẹ ń rà á lọ́wọ́ olùpèsè (supplier)? Ẹ wò ó bóyá wọ́n wà nínú àtòjọ yìí. Bí wọn kò bá sí, ẹ béèrè ibi tí ọjà náà ti wá.',
		footnote:
			'Ìrìn-àjò ń fi ohun tí àwọn ilé-iṣẹ́ tó ń ṣe oògùn kọ sílẹ̀ hàn. A kì í fi iye owó, iye ọjà, tàbí orúkọ òṣìṣẹ́ hàn rárá.',
		summary: {
			toRetail: 'Ó kúrò lọ́dọ̀ {maker}{via}, àkọsílẹ̀ tó kẹ́yìn sì fi hàn pé ó wà lọ́dọ̀ {last}.{gap}',
			via: ' lọ sọ́dọ̀ {names}',
			gap: ' Ìgbésẹ̀ kan lójú ọ̀nà kò sí nínú àkọsílẹ̀.',
			endsBeforeRetail:
				'Ó kúrò lọ́dọ̀ {maker} lọ sọ́dọ̀ {names}. Àkọsílẹ̀ parí síbẹ̀: àwọn ìgbésẹ̀ tó tẹ̀lé kò tíì sí nínú àkọsílẹ̀ DETECK.',
			batchLevel: {
				one: '{maker} pèsè batch yìí fún ilé-iṣẹ́ {n}. Àkọsílẹ̀ kò sọ èwo ni páálí yìí kọjá lọ́dọ̀ rẹ̀.',
				other:
					'{maker} pèsè batch yìí fún ilé-iṣẹ́ {n}. Àkọsílẹ̀ kò sọ èwo nínú wọn ni páálí yìí kọjá lọ́dọ̀ rẹ̀.'
			},
			none: 'Ilé-iṣẹ́ tó ṣe é kò tíì sọ ibi tí wọ́n kó batch yìí lọ, nítorí náà n kò lè fi hàn yín àwọn tí ó ti kọjá lọ́wọ́ wọn.'
		},
		link: {
			none: 'Kò tíì sí ìrìn-àjò tí a kọ sílẹ̀',
			lastWith: 'Àkọsílẹ̀ tó kẹ́yìn: ó wà lọ́dọ̀ {name}{where}',
			suppliedTo: {
				one: 'Wọ́n pèsè rẹ̀ fún ilé-iṣẹ́ {n} tó wà nínú àkọsílẹ̀',
				other: 'Wọ́n pèsè rẹ̀ fún ilé-iṣẹ́ {n} tó wà nínú àkọsílẹ̀'
			},
			endsAt: 'Àkọsílẹ̀ parí lọ́dọ̀ {name}{where}'
		},
		step: {
			manufacturer: 'ILÉ-IṢẸ́ TÓ ṢE É · WỌ́N ṢE É NÍ {month}',
			lastHolder: 'IBI TÓ KẸ́YÌN NÍNÚ ÀKỌSÍLẸ̀',
			lastHolderSince: 'IBI TÓ KẸ́YÌN NÍNÚ ÀKỌSÍLẸ̀ · LÁTI {date}'
		},
		roles: {
			manufacturer: 'Ilé-iṣẹ́ tó ṣe é',
			distributor: 'Olùpínkiri',
			wholesaler: 'Olùtajà lódìdì',
			pharmacy: 'Ilé ìtajà oògùn',
			hospital: 'Ilé ìwòsàn',
			other: 'Ilé-iṣẹ́'
		}
	},

	scan: {
		metaTitle: 'Ṣàyẹ̀wò pẹ̀lú kámẹ́rà · DETECK',
		title: 'Ṣàyẹ̀wò pẹ̀lú kámẹ́rà',
		closeAria: 'Pa kámẹ́rà dé',
		blockedBubble:
			'Mo nílò kámẹ́rà yín láti ka kóòdù orí páálí. Ó dà bí ẹni pé kámẹ́rà ti wà ní pípa fún DETECK.',
		turnOnTitle: 'Ẹ ṣí kámẹ́rà sílẹ̀',
		turnOn1: 'Ẹ ṣí Settings fóònù yín, tàbí kí ẹ tẹ àmì àgádágodo tó wà lẹ́gbẹ̀ẹ́ àdírẹ́sì wẹ́ẹ̀bù.',
		turnOn2: 'Ẹ wá browser yín, lẹ́yìn náà Camera.',
		turnOn3: 'Ẹ gba Camera láàyè (Allow), lẹ́yìn náà ẹ padà wá síbí.',
		turnedOn: 'Mo ti ṣí i sílẹ̀',
		cameraAria: 'Ohun tí kámẹ́rà ń rí',
		holdAuto: 'Ẹ fi kóòdù onígun mẹ́rin náà sínú àpótí tó wà lójú fóònù. Màá kà á fúnra mi.',
		holdPhoto:
			'Ẹ fi kóòdù onígun mẹ́rin náà sínú àpótí tó wà lójú fóònù, níbi tí ìmọ́lẹ̀ ti dáa, lẹ́yìn náà kí ẹ ya fọ́tò.',
		takePhoto: 'Ya fọ́tò kóòdù náà',
		reading: 'Mo ń ka kóòdù náà…',
		intro:
			'Ẹ fi kámẹ́rà ka kóòdù onígun mẹ́rin tó wà lórí páálí, màá sì fi serial rẹ̀ wé àkọsílẹ̀ ilé-iṣẹ́ tó ṣe é.',
		unsupported: 'Browser yìí kò lè ṣí kámẹ́rà níbí. Ẹ ya fọ́tò kóòdù náà dípò bẹ́ẹ̀.',
		scanButton: 'Ka kóòdù pẹ̀lú kámẹ́rà',
		photoIdle: 'Ya fọ́tò kóòdù náà, tàbí yan èyí tí ẹ ti yà',
		photoGallery: 'Yan fọ́tò láti inú gallery yín',
		readPhoto: 'Ka kóòdù tó wà nínú fọ́tò mi',
		typeInstead: 'Tẹ serial dípò bẹ́ẹ̀',
		footer:
			'A máa ń sọ fọ́tò di kékeré lórí fóònù yín kí a tó fi ránṣẹ́, láti dín ìnáwó dátà kù. Láti ka kóòdù nìkan ni a fi ń lo fọ́tò náà, a kò sì ní tọ́jú rẹ̀.',
		noPhoto: 'Ẹ kọ́kọ́ ya fọ́tò kóòdù náà, tàbí kí ẹ yan ọ̀kan.',
		tooLarge: 'Fọ́tò yẹn tóbi jù. Ẹ gbìyànjú lẹ́ẹ̀kan sí i pẹ̀lú èyí tó kéré.',
		unreadable:
			'N kò lè ka kóòdù kankan nínú fọ́tò yìí. Ẹ mú páálí náà súnmọ́ kámẹ́rà, níbi tí ìmọ́lẹ̀ ti dáa, kí kóòdù onígun mẹ́rin náà wà ní àárín. Tàbí kí ẹ tẹ serial dípò bẹ́ẹ̀.'
	},

	packaging: {
		photosMetaTitle: 'Fọ́tò fún àyẹ̀wò páálí · DETECK',
		title: 'Ṣàyẹ̀wò páálí (ìdánwò)',
		backAria: 'Padà sí àbájáde',
		serialLine: 'Serial {serial}: Ó bá àkọsílẹ̀ mu · {product} · Batch {lot}',
		intro:
			'Ní báyìí, ẹ ya fọ́tò mẹ́ta: iwájú páálí, ẹ̀yìn rẹ̀, àti label. Ẹ mú páálí náà dúró tẹ́jú, níbi tí ìmọ́lẹ̀ ti dáa.',
		notes: {
			front: 'Àmì ilé-iṣẹ́, orúkọ oògùn àti ìwọ̀n rẹ̀ hàn kedere',
			back: 'Àwọn èròjà inú rẹ̀ àti orúkọ ilé-iṣẹ́ tó ṣe é hàn kedere',
			label: 'Batch àti ọjọ́ ìparí hàn kedere'
		},
		clear: '✓ Ó hàn kedere',
		checkingPhoto: 'Mo ń ṣàyẹ̀wò fọ́tò náà…',
		unchecked: 'A ti fi fọ́tò kún un. A máa ṣàyẹ̀wò rẹ̀ nígbà tí ẹ bá fi ránṣẹ́.',
		takePhoto: 'Ya fọ́tò',
		retake: 'Tún fọ́tò yà',
		tooDark: 'Ó ṣókùnkùn jù. Ẹ tún un yà níbi tí ìmọ́lẹ̀ ti dáa jù.',
		glare: 'Ìmọ́lẹ̀ ti tàn jù sí i. Ẹ yí páálí náà díẹ̀ kí ìmọ́lẹ̀ má bàa tàn sí i tààrà.',
		blurry: 'Ó rí bàìbàì jù. N kò lè ka àwọn ọ̀rọ̀ inú rẹ̀. Ẹ mú fóònù dúró ṣinṣin.',
		sizeNote:
			'A máa ń sọ fọ́tò di kékeré lórí fóònù yín kí a tó fi ránṣẹ́ (nǹkan bí 750 KB lápapọ̀), kí èyí lè ṣiṣẹ́ lórí 3G.',
		sending: 'A ń fi fọ́tò ránṣẹ́…',
		submit: 'Ṣàyẹ̀wò páálí',
		checking: 'A ń ṣàyẹ̀wò páálí',
		yourCheck: 'Àyẹ̀wò yín',
		serialRead: 'Serial tí a kà: Ó bá àkọsílẹ̀ mu',
		photosReceived: 'A ti gba fọ́tò 3',
		comparing: 'A ń fi lógò, ọ̀rọ̀ orí rẹ̀, àwọ̀ àti àwọn àmì ààbò wéra',
		serialRow: 'Serial',
		valid: 'Ó bá àkọsílẹ̀ mu',
		journeyRow: 'Ìrìn-àjò',
		packagingRow: 'Páálí',
		somethingDifferent: 'Nǹkan kan dà bí ẹni pé ó yàtọ̀',
		retakePhotos: 'Tún àwọn fọ́tò náà yà',
		notAvailableYet: 'Àyẹ̀wò páálí kò tíì sí.',
		dailyLimit:
			'Ẹ ti dé òpin àyẹ̀wò páálí tí ẹ lè ṣe lórí ẹ̀rọ yìí lónìí. Ẹ gbìyànjú lẹ́ẹ̀kan sí i lọ́la.',
		checkSerialFirst:
			'Ẹ kọ́kọ́ ṣàyẹ̀wò serial. Àyẹ̀wò páálí wà fún páálí tí serial rẹ̀ wà nínú àkọsílẹ̀.',
		addPhoto: {
			front: 'Ẹ fi fọ́tò iwájú páálí kún un.',
			back: 'Ẹ fi fọ́tò ẹ̀yìn páálí kún un.',
			label: 'Ẹ fi fọ́tò label àti batch kún un.'
		},
		photoProblems: {
			unreadable: 'Fáìlì yìí kì í ṣe fọ́tò tí a lè ṣí. Ẹ lo JPG tàbí PNG.',
			too_small: 'Fọ́tò yìí kéré jù. Ẹ lo fọ́tò tó tóbi jù, tó sì mọ́ kedere.',
			blurry:
				'Fọ́tò yìí rí bàìbàì jù. N kò lè ka àwọn ọ̀rọ̀ inú rẹ̀. Ẹ mú fóònù dúró ṣinṣin, níbi tí ìmọ́lẹ̀ ti dáa.',
			dark: 'Fọ́tò yìí ṣókùnkùn jù. Ẹ tún un yà níbi tí ìmọ́lẹ̀ ti dáa jù.',
			bright:
				'Ìmọ́lẹ̀ tàbí ìtànṣán ti bo fọ́tò yìí. Ẹ yí páálí náà díẹ̀ kí ìmọ́lẹ̀ má bàa tàn sí i tààrà, kí ẹ sì gbìyànjú lẹ́ẹ̀kan sí i.'
		},
		categories: {
			logo: 'Lógò rẹ̀ rí yàtọ̀ sí ti páálí ilé-iṣẹ́ tó ṣe é',
			font: 'Lẹ́tà rẹ̀ rí yàtọ̀ sí ti páálí ilé-iṣẹ́ tó ṣe é',
			colour: 'Àwọ̀ rẹ̀ rí yàtọ̀ sí ti páálí ilé-iṣẹ́ tó ṣe é',
			print_quality: 'Dídára ìtẹ̀wé rẹ̀ rí yàtọ̀ sí ti páálí ilé-iṣẹ́ tó ṣe é',
			missing_security_feature: 'Àmì ààbò kan tó wà lórí páálí ilé-iṣẹ́ tó ṣe é kò hàn',
			label_layout: 'Bí wọ́n ṣe to label rẹ̀ rí yàtọ̀ sí ti páálí ilé-iṣẹ́ tó ṣe é'
		},
		sides: {
			front: 'Iwájú páálí',
			back: 'Ẹ̀yìn páálí',
			label: 'Label àti batch'
		},
		disclaimer:
			'Èyí jẹ́ àyẹ̀wò àkọsílẹ̀ àti bí páálí ṣe rí. Kò lè dán ohun tó wà nínú rẹ̀ wò, nítorí náà ẹ tẹ̀lé ìlànà dókítà tàbí pharmacist yín.',
		notAvailable:
			'Ilé-iṣẹ́ tó ṣe oògùn yìí kò tíì fún DETECK ní fọ́tò páálí rẹ̀, nítorí náà serial nìkan ni mo lè ṣàyẹ̀wò.',
		analysing: 'Mo ń fi wé páálí ilé-iṣẹ́ tó ṣe é…',
		analysingNote: 'Èyí kì í sábà ju ìṣẹ́jú-àáyá 30 lọ.',
		photoRules: 'Gbogbo ẹ̀gbẹ́ páálí hàn · ìmọ́lẹ̀ tó dáa · kí ìmọ́lẹ̀ má tàn sí i tààrà',
		retain:
			'Ẹ tọ́jú àwọn fọ́tò mi fún ọjọ́ 90 láti ran DETECK lọ́wọ́ láti mọ bí àyẹ̀wò páálí ṣe péye tó. DETECK yóò pa wọ́n rẹ́ lẹ́yìn náà.',
		beta: 'Ìdánwò: a ṣì ń dán àyẹ̀wò páálí wò. Ẹ kà á sí àfikún àmì kan, kì í ṣe ìdáhùn ìkẹyìn.',
		provider:
			'A máa ń fi fọ́tò yín ránṣẹ́ sí Anthropic, ilé-iṣẹ́ AI tí DETECK ń lò, láti fi wé fọ́tò ilé-iṣẹ́ tó ṣe oògùn náà. Ẹ má jẹ́ kí ojú ènìyàn tàbí ìwé oògùn tí dókítà kọ (prescription) hàn nínú wọn.',
		outcomes: {
			match: {
				badge: 'KÒ SÍ ÌYÀTỌ̀ TÓ HÀN',
				title: 'Kò sí ìyàtọ̀ tó hàn nínú àwọn fọ́tò yìí',
				bubble:
					'Serial náà bá àkọsílẹ̀ ilé-iṣẹ́ tó ṣe é mu, n kò sì rí ìyàtọ̀ láàárín páálí yìí àti páálí ilé-iṣẹ́ tó ṣe é nínú àwọn fọ́tò yìí.',
				line: 'A kò rí ohun tí kò bára mu tó hàn nínú àwọn fọ́tò yìí'
			},
			mismatch: {
				badge: 'NǸKAN KAN KÒ BÁRA MU',
				title: 'Nǹkan kan kò bára mu',
				bubble: 'Serial náà wà nínú àkọsílẹ̀, ṣùgbọ́n páálí náà rí yàtọ̀ sí páálí ilé-iṣẹ́ tó ṣe é.',
				nextStep:
					'Ẹ fi àbájáde yìí han pharmacist kí ẹ tó lò ó, tàbí kí ẹ rà á ní ilé ìtajà oògùn mìíràn.',
				line: 'A rí àwọn nǹkan tí kò bára mu'
			},
			unsure: {
				badge: 'KÒ DÁ MI LÓJÚ',
				title: 'N kò lè sọ láti inú àwọn fọ́tò yìí',
				bubble:
					'Serial náà wà nínú àkọsílẹ̀, ṣùgbọ́n páálí náà kò dá mi lójú tó láti sọ bóyá ó yàtọ̀ tàbí kò yàtọ̀.',
				nextStep:
					'Fọ́tò tó mọ́ kedere ní ọ̀sán máa ń ṣèrànwọ́. Tàbí kí ẹ ní kí pharmacist yín bá yín wò ó.',
				line: 'A kò lè sọ láti inú àwọn fọ́tò yìí'
			}
		}
	},

	report: {
		metaTitle: 'Ròyìn oògùn tí ẹ fura pé ayédèrú ni · DETECK',
		title: 'Ròyìn oògùn tí ẹ fura pé ayédèrú ni',
		intro:
			'Ẹ sọ fún DETECK nípa páálí tó ń dà yín láàmú. A máa ń wo gbogbo ìròyìn, a sì lè fi ránṣẹ́ sí NAFDAC àti ilé-iṣẹ́ tó ṣe é.',
		medicine: 'Oògùn náà',
		nameLabel: 'Orúkọ àti ìwọ̀n tó wà lórí páálí',
		namePlaceholder: 'àpẹẹrẹ: Amoxil 500 mg capsules',
		photosLabel: 'Fọ́tò páálí (kò ju {n} lọ, kò pọn dandan)',
		photosHelp: 'Iwájú, ẹ̀yìn, àti label tí nọ́mbà batch wà lórí rẹ̀ ló ń ṣèrànwọ́ jù.',
		where: 'Ibi tí ẹ ti rí i gbà',
		place: 'Ilé ìtajà oògùn, ṣọ́ọ̀bù tàbí ẹni tó tà á',
		state: 'Ìpínlẹ̀',
		chooseState: 'Yan ìpínlẹ̀',
		town: 'Ìlú tàbí agbègbè',
		boughtOn: 'Ìgbà tí ẹ rà á (kò pọn dandan)',
		details: 'Kí ló ń dà yín láàmú? (kò pọn dandan)',
		reach: 'Bí a ṣe lè kàn sí yín (kò pọn dandan)',
		reachNote:
			'DETECK nìkan ló máa rí àwọn wọ̀nyí, láti bi yín ní ìbéèrè síwájú sí i. A kì í fi wọ́n han ilé-iṣẹ́ tó ṣe é tàbí ẹni tó tà á rárá.',
		name: 'Orúkọ',
		email: 'Email',
		phone: 'Fóònù',
		consent:
			'DETECK lè fi ìròyìn yìí àti àwọn fọ́tò náà ránṣẹ́ sí NAFDAC àti ilé-iṣẹ́ tó ṣe é, láìfi orúkọ, email àti fóònù mi kún un.',
		submit: 'Fi ìròyìn ránṣẹ́',
		unwell:
			'Bí ara yín tàbí ara ẹlòmìíràn kò bá yá lẹ́yìn lílo oògùn kan, ẹ lọ rí dókítà tàbí pharmacist lẹ́sẹ̀kẹsẹ̀.',
		errors: {
			limit: 'Ẹ ti fi ìròyìn púpọ̀ ránṣẹ́ lónìí. Ẹ gbìyànjú lẹ́ẹ̀kan sí i lọ́la.',
			missing_drug: 'Ẹ sọ irú oògùn tí ó jẹ́, bí àpẹẹrẹ orúkọ àti ìwọ̀n tó wà lórí páálí.',
			missing_place: 'Ẹ sọ ibi tí ẹ ti rà á, bí àpẹẹrẹ orúkọ ilé ìtajà oògùn náà.',
			bad_state: 'Yan ìpínlẹ̀ kan.',
			bad_email: 'Nǹkan kan kù nínú àdírẹ́sì email yẹn, bí .com tàbí .ng.',
			photo_too_large: 'Fọ́tò kọ̀ọ̀kan gbọ́dọ̀ kéré sí 12 MB.',
			photo_unreadable: '{name} kì í ṣe fọ́tò tí a lè ṣí.'
		},
		thanks: {
			metaTitle: 'A ti fi ìròyìn ránṣẹ́ · DETECK',
			title: 'Ẹ ṣé. Ìròyìn yín ti dé ọ̀dọ̀ DETECK.',
			body: 'Òṣìṣẹ́ DETECK kan máa ń wo gbogbo ìròyìn. Bí ẹ bá fi bí a ṣe lè kàn sí yín sílẹ̀, a lè kàn sí yín láti bi yín ní ìbéèrè. Ẹ tọ́jú páálí náà àti rìsíìtì yín bí ẹ bá lè ṣe é.'
		}
	},

	error: {
		notFoundTitle: 'N kò rí ojú-ìwé yẹn',
		notFoundBody: 'Líǹkì náà lè ti pẹ́, tàbí kí àṣìṣe wà nínú rẹ̀.',
		forbiddenTitle: 'Ojú-ìwé yìí kò ṣí sílẹ̀ fún yín',
		forbiddenBody: 'Àkáǹtì yín kò ní àṣẹ láti wọ ojú-ìwé yìí.',
		tooManyTitle: 'Ìbéèrè ti pọ̀ jù',
		tooManyBody: 'Ẹ jọ̀wọ́, ẹ dúró fún ìṣẹ́jú kan.',
		otherTitle: 'Nǹkan kan ti bàjẹ́ ní ọ̀dọ̀ wa',
		otherBody:
			'Kì í ṣe ohun tí ẹ ṣe ló fà á. Ẹ jọ̀wọ́, ẹ gbìyànjú lẹ́ẹ̀kan sí i lẹ́yìn ìṣẹ́jú kan. Bí ẹ bá ń ṣàyẹ̀wò oògùn, ẹ tún serial náà tẹ.',
		code: 'Àṣìṣe {status}'
	},

	landing: {
		metaTitle: 'Nípa DETECK · Ẹ fi oògùn wé àkọsílẹ̀ ilé-iṣẹ́ tó ṣe é',
		metaDescription:
			'DETECK ń jẹ́ kí ẹnikẹ́ni ní Nàìjíríà fi nọ́mbà serial oògùn wé àkọsílẹ̀ tí ilé-iṣẹ́ tó ṣe é fún DETECK, kí wọ́n sì rí ìrìn-àjò rẹ̀ tó wà nínú àkọsílẹ̀. Kò sí àkáǹtì, DETECK kò sì gba owó.',
		navWho: 'Àwọn tí a ń sìn',
		navVision: 'Ìran wa',
		eyebrow: 'Àyẹ̀wò oògùn fún Nàìjíríà · DETECK kò gba owó',
		heroTitle: 'Ẹ ṣàyẹ̀wò kí ẹ tó gbẹ́kẹ̀lé.',
		lede: 'Ẹ tẹ nọ́mbà serial tó wà lórí páálí oògùn, tàbí kí ẹ fi kámẹ́rà ka kóòdù rẹ̀. DETECK máa fi wé àkọsílẹ̀ tí ilé-iṣẹ́ tó ṣe é fún DETECK, yóò sì fi hàn yín ẹni tó ṣe é àti ìrìn-àjò rẹ̀ títí dé ọ̀dọ̀ yín, bí àkọsílẹ̀ ṣe sọ.',
		scanPack: 'Ka kóòdù páálí pẹ̀lú kámẹ́rà',
		seeHow: 'Ẹ wo bí ó ṣe ń ṣiṣẹ́',
		heroBubble: 'Ẹ n lẹ́, Deteck ni mí. Mo wà níbí láti ràn yín lọ́wọ́.',
		heroAlt:
			'Obìnrin pharmacist ọmọ Nàìjíríà kan tó ń fi fóònù rẹ̀ ṣàyẹ̀wò páálí oògùn, nígbà tí oníbàárà kan ń dúró ní káńtà',
		heroChip: 'Ó bá àkọsílẹ̀ ilé-iṣẹ́ tó ṣe é mu',
		heroChipSub: 'Àpẹẹrẹ · Ilé-iṣẹ́ tó ṣe é → Olùpínkiri → Ilé ìtajà oògùn',
		runPharmacy: 'Ṣé ẹ ní ilé ìtajà oògùn?',
		runPharmacyLink: 'Ẹ wo bí DETECK ṣe lè ràn yín lọ́wọ́',
		step1Title: 'Ẹ tẹ kóòdù, tàbí kí ẹ fi kámẹ́rà kà á',
		step1Text: 'Ẹ tẹ nọ́mbà serial tí wọ́n tẹ̀ sórí páálí, tàbí kí ẹ fi fóònù yín ka kóòdù oògùn náà.',
		step2Title: 'A ń ṣàyẹ̀wò àkọsílẹ̀',
		step2Text:
			'DETECK máa wá serial náà nínú àkọsílẹ̀ tí ilé-iṣẹ́ tó ṣe é fún DETECK, títí kan ìrìn-àjò rẹ̀ láti ọ̀dọ̀ àwọn olùpínkiri dé àwọn ilé ìtajà oògùn, bí àkọsílẹ̀ ṣe sọ.',
		step3Title: 'Deteck á sọ àbájáde fún yín',
		step3Text:
			'"Ó bá àkọsílẹ̀ mu" tàbí "A kò dá a mọ̀", ní èdè tó rọrùn, pẹ̀lú ìrìn-àjò oògùn náà tó wà nínú àkọsílẹ̀. Bí àkọsílẹ̀ kò bá tó láti mọ̀ dájú, Deteck á sọ bẹ́ẹ̀.',
		whoLead: 'A ṣe é fún gbogbo ẹni tó ń rà, tó ń kó, tàbí tó ń fúnni ní oògùn.',
		audiences: {
			citizens: {
				label: 'Àwọn ọmọ Nàìjíríà',
				alt: 'Ìyá kan tó ń fi fóònù rẹ̀ ṣàyẹ̀wò páálí oògùn ní káńtà ilé ìtajà oògùn',
				title: 'Ẹ ṣàyẹ̀wò kí ẹ tó rà á tàbí lò ó',
				text: 'Ẹ tẹ nọ́mbà serial tó wà lórí oògùn, tàbí kí ẹ fi kámẹ́rà ka kóòdù rẹ̀, kí ẹ sì rí bóyá ó bá àkọsílẹ̀ ilé-iṣẹ́ tó ṣe é mu.'
			},
			pharmacies: {
				label: 'Àwọn ilé ìtajà oògùn',
				alt: 'Obìnrin pharmacist kan tó ń fi fóònù rẹ̀ ṣàyẹ̀wò páálí oògùn',
				title: 'Ẹ ṣàyẹ̀wò ohun tí ẹ gbà',
				text: 'Ẹ ṣàyẹ̀wò oògùn tí ẹ gbà lọ́wọ́ àwọn olùpèsè, kí ẹ sì rí ilé-iṣẹ́ tó ṣe wọ́n àti ìtàn ìpínkiri wọn nínú àkọsílẹ̀, kí wọ́n tó dé orí pẹpẹ yín.'
			},
			hospitals: {
				label: 'Ilé ìwòsàn àti ibùdó ìlera',
				alt: 'Nọ́ọ̀sì kan tó ń ṣàyẹ̀wò páálí oògùn ní yàrá ìkẹ́rùsí ilé ìwòsàn',
				title: 'Ẹ ṣàyẹ̀wò kí ẹ tó fún ẹnikẹ́ni ní oògùn',
				text: 'Ẹ ṣàyẹ̀wò oògùn tí ibùdó yín gbà, kí ẹ tó pín wọn tàbí fún àwọn aláìsàn.'
			},
			distributors: {
				label: 'Olùpínkiri àti olùtajà lódìdì',
				alt: '',
				title: 'Ẹ jẹ́ ara ìrìn-àjò tó wà nínú àkọsílẹ̀',
				text: 'Nígbà tí ilé-iṣẹ́ tó ṣe oògùn bá kọ sílẹ̀ pé àwọn pèsè rẹ̀ fún yín, orúkọ ilé-iṣẹ́ yín á hàn nínú ìrìn-àjò oògùn náà, kí àwọn olùrà lè rí ibi tí ọjà náà kọjá lójú ọ̀nà, bí àkọsílẹ̀ ṣe fi hàn.'
			},
			manufacturers: {
				label: 'Àwọn ilé-iṣẹ́ tó ń ṣe oògùn',
				alt: 'Onímọ̀ ẹ̀rọ kan tó ń ṣàyẹ̀wò páálí oògùn níbi ẹ̀rọ tí wọ́n fi ń di oògùn sínú páálí',
				title: 'Ẹ fi àlàyé oògùn yín ránṣẹ́',
				text: 'Ẹ gbé àwọn oògùn yín, nọ́mbà serial, àkọsílẹ̀ ìpínkiri àti fọ́tò páálí yín sókè, kí àwọn ènìyàn lè fi oògùn yín wé àkọsílẹ̀ yín.'
			}
		},
		visionTitle:
			'Kí gbogbo oògùn ní Nàìjíríà **ṣeé tọpasẹ̀** láti ilé-iṣẹ́ tí wọ́n ti ṣe é dé ọwọ́ yín.',
		visionText:
			'Gbogbo ọmọ Nàìjíríà ló yẹ kí ó mọ ibi tí oògùn wọn ti wá. DETECK ń so nọ́mbà serial páálí kọ̀ọ̀kan pọ̀ mọ́ àkọsílẹ̀ ilé-iṣẹ́ tó ṣe é, kí ẹ lè ṣàyẹ̀wò irú oògùn tí ó jẹ́ àti ìrìn-àjò rẹ̀ tó wà nínú àkọsílẹ̀, dípò kí ẹ gbẹ́kẹ̀lé bí páálí ṣe rí nìkan.',
		impactTitle: 'Àyípadà tí a ń ṣiṣẹ́ fún',
		impact1Alt: 'Ìyá kan tó ń fi fóònù rẹ̀ ṣàyẹ̀wò páálí oògùn ní káńtà ilé ìtajà oògùn',
		impact1Title: 'Ìdílé tó ní ìgbọ́kànlé',
		impact1Text: 'Àwọn ènìyàn lè ṣàyẹ̀wò oògùn fúnra wọn kí wọ́n tó rà á tàbí lò ó.',
		impact2Alt: 'Nọ́ọ̀sì kan tó ń fi tablet ṣàyẹ̀wò páálí oògùn lórí pẹpẹ ní yàrá ìkẹ́rùsí ilé ìwòsàn',
		impact2Title: 'Pípín oògùn pẹ̀lú ìṣọ́ra',
		impact2Text:
			'Àwọn ilé ìtajà oògùn àti ilé ìwòsàn lè ṣàyẹ̀wò oògùn tí wọ́n gbà kí wọ́n tó pín wọn fún ènìyàn.',
		impact3Alt:
			'Onímọ̀ ẹ̀rọ kan tó wọ aṣọ ààbò yàrá mímọ́, tó ń ṣàyẹ̀wò páálí oògùn níbi ẹ̀rọ tí wọ́n fi ń di oògùn sínú páálí',
		impact3Title: 'Àkọsílẹ̀ tí ẹnìkan ń dáhùn fún',
		impact3Text:
			'Àwọn ilé-iṣẹ́ tó ń ṣe oògùn ń forúkọ oògùn wọn sílẹ̀, kí àwọn ènìyàn lè fi wé àkọsílẹ̀ wọn.',
		whyEyebrow: 'Ìdí tí ẹ fi nílò DETECK',
		whyTitle: 'Ìdáhùn kan tó ṣe kedere, tó sì sọ òtítọ́ nípa ohun tó mọ̀.',
		strengths: {
			serial: 'Ó ń fi serial wé àkọsílẹ̀ tí ilé-iṣẹ́ tó ṣe é fún DETECK',
			journey:
				'Ó ń fi ìrìn-àjò rẹ̀ láti ọ̀dọ̀ àwọn olùpínkiri dé àwọn ilé ìtajà oògùn hàn, bí àkọsílẹ̀ ṣe sọ',
			packaging: 'Ó lè fi fọ́tò páálí wé páálí ilé-iṣẹ́ tó ṣe é (ìdánwò, fún àwọn oògùn kan)',
			network:
				'Àyẹ̀wò serial ń ṣiṣẹ́ lórí 2G àti 3G. DETECK kò gba owó; owó dátà yín yóò lọ bí ó ṣe máa ń lọ',
			honest: 'Ó ń sọ òtítọ́ fún yín nígbà tí àlàyé kò bá tó láti mọ̀ dájú'
		},
		verifyTitle: 'Ṣé páálí oògùn wà lọ́wọ́ yín? Ẹ ṣàyẹ̀wò rẹ̀ báyìí.',
		verifyLabel: 'Nọ́mbà serial tó wà lórí páálí',
		verifyButton: 'Ṣàyẹ̀wò rẹ̀',
		verifyFine:
			'Àyẹ̀wò serial ń ṣiṣẹ́ lórí 2G àti 3G. DETECK kò gba owó; owó dátà yín yóò lọ bí ó ṣe máa ń lọ. Àbájáde dá lórí àkọsílẹ̀ tí àwọn ilé-iṣẹ́ tó ń ṣe oògùn fún DETECK. Nígbà tí àlàyé kò bá tó láti mọ̀ dájú, Deteck á sọ fún yín.',
		footerLead: 'A ń kọ́ DETECK pẹ̀lú àwọn alábàáṣiṣẹ́pọ̀ káàkiri ètò ìpèsè oògùn ní Nàìjíríà.',
		pilotPartner: 'Ẹ di alábàáṣiṣẹ́pọ̀ nínú ètò ìgbìyànjú wa',
		registerCompany: 'Ẹ forúkọ ilé-iṣẹ́ yín sílẹ̀',
		footerNav: 'Ìsàlẹ̀ ojú-ìwé',
		footerProduct: 'Ọjà wa',
		footerCompany: 'Ilé-iṣẹ́ wa',
		contact: 'Ẹ kàn sí wa',
		legal:
			'© 2026 DETECK. Àpẹẹrẹ ni orúkọ oògùn àti àkọsílẹ̀ tí a fi hàn. Àyẹ̀wò dá lórí àwọn ilé-iṣẹ́ tó ń ṣe oògùn tó kópa, tí wọ́n sì ń kọ oògùn wọn àti ìpínkiri wọn sílẹ̀. DETECK ń ṣàyẹ̀wò àkọsílẹ̀ àti, nínú ìdánwò (beta), bí páálí ṣe rí; kò lè dán ohun tó wà nínú páálí wò.'
	}
};
