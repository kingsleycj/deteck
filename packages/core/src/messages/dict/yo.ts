/** Yorùbá. Approved for production by the product owner (5 Nov 2026). */
import type { Messages } from './en.ts';

export const yo: Messages = {
	meta: {
		name: 'Yorùbá',
		reviewed: true
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
		contact: 'Ẹ kàn sí wa',
		menu: 'Àwọn àṣàyàn'
	},

	footer: {
		about: 'Nípa DETECK',
		check: 'Ṣàyẹ̀wò oògùn',
		privacy: 'Àṣírí',
		terms: 'Àwọn òfin lílò',
		business: 'Fún àwọn ilé-iṣẹ́ tó ń ṣe oògùn àti àwọn ilé ìtajà oògùn',
		developers: 'Fún àwọn developer',
		contact: 'Ẹ kàn sí wa',
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
		scan: 'Ṣàyẹ̀wò síwájú pẹ̀lú kámẹ́rà',
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
		tryAgain: 'Gbìyànjú lẹ́ẹ̀kan sí i',
		lede: 'Ẹ tẹ nọ́mbà serial tó wà lórí páálí. Deteck yóò fi wé àkọsílẹ̀ ilé-iṣẹ́ tó ṣe é, yóò sì fi ibi tí ó ti kọjá hàn yín.',
		scanNote: 'Ẹ lo kámẹ́rà yín, tàbí kí ẹ gbé fọ́tò páálí náà sókè.',
		helloTitle: 'Ẹ n lẹ́, èmi ni Deteck.',
		helloBody:
			'Ẹ fún mi ní nọ́mbà serial, màá sì sọ èsì fún yín: bóyá ó bá àkọsílẹ̀ mu, ẹni tó ṣe é, àti ilé-iṣẹ́ tó kẹ́yìn tí wọ́n kọ sílẹ̀ pé ó wà lọ́dọ̀ rẹ̀.',
		step1Title: '1 · Ó bá a mu?',
		step1Text: 'Ó bá àkọsílẹ̀ ẹni tó ṣe é mu, tàbí kò bá a mu',
		step2Title: '2 · Páálí',
		step2Text: 'AI ń rí ìyàtọ̀ tí ojú lè rí',
		step3Title: '3 · Ìrìn-àjò',
		step3Text: 'Láti ọ̀dọ̀ ẹni tó ṣe é dé ilé-iṣẹ́ tó kẹ́yìn nínú àkọsílẹ̀',
		tipsTitle: 'Ibi tí ẹ ti lè rí serial',
		tip1: 'Nítòsí barcode, lẹ́yìn **SN** tàbí **Serial**',
		tip2: 'Kò ju lẹ́tà àti nọ́mbà 20 lọ, nígbà míì ní ìsọ̀rí-ìsọ̀rí',
		tip3: 'Lẹ́tà O àti nọ́mbà 0 jọra, ẹ ṣàyẹ̀wò méjèèjì'
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
			'Hmm, ìyẹn kò tíì jọ nọ́mbà serial. Ohun tí ẹ tẹ ṣì wà nínú àpótí, kí ẹ lè ṣàtúnṣe ibi tí kò tọ̀nà nìkan.',
		batch_number:
			'Ìyẹn dà bí nọ́mbà batch (lẹ́yìn LOT tàbí BATCH). Serial jẹ́ kóòdù mìíràn, tí wọ́n sábà máa ń tẹ̀ lẹ́yìn SN nítòsí barcode.'
	},

	network: {
		slow: 'Ìsopọ̀ ayélujára ń lọ́ra. Ẹ tẹ "Tún gbìyànjú". Mo ti fi serial yín pamọ́.',
		slowServer:
			'Àkọsílẹ̀ pẹ́ jù kí ó tó dáhùn. Serial yín ṣì wà nínú àpótí: ẹ tẹ "Ṣàyẹ̀wò oògùn" láti gbìyànjú lẹ́ẹ̀kan sí i.',
		offlineTitle: 'N kò lè kàn sí àkọsílẹ̀',
		offlineBody:
			'Ìsopọ̀ yín já nígbà tí mo ń ṣàyẹ̀wò. Kò sí ohun tó sọnù: mo ti fi serial yín pamọ́, màá sì tún gbìyànjú ní kété tí ẹ bá padà sórí ayélujára.',
		rateLimited: {
			one: 'Àyẹ̀wò ti pọ̀ jù láàárín àkókò kúkúrú. Ẹ jọ̀wọ́, ẹ dúró fún ìṣẹ́jú {n}, kí ẹ tó gbìyànjú lẹ́ẹ̀kan sí i.',
			other:
				'Àyẹ̀wò ti pọ̀ jù láàárín àkókò kúkúrú. Ẹ jọ̀wọ́, ẹ dúró fún ìṣẹ́jú {n}, kí ẹ tó gbìyànjú lẹ́ẹ̀kan sí i.'
		},
		editSerial: 'Ṣàtúnṣe serial',
		offlineNote:
			'Ìṣàyẹ̀wò kan kì í lo data tó bí fọ́tò kan, nítorí náà àmì 2G tàbí 3G tí kò lágbára sábà máa ń tó.'
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
		checkPackaging: 'Ṣàyẹ̀wò síwájú pẹ̀lú kámẹ́rà',
		scanCode: 'Ṣàyẹ̀wò síwájú pẹ̀lú kámẹ́rà',
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
			title: 'Ó bá àkọsílẹ̀ mu',
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
		},
		serialChecked: 'Serial tí a ṣàyẹ̀wò',
		checkAgain: 'Tún ṣàyẹ̀wò',
		whatToDo: 'Ohun tí ẹ lè ṣe:',
		notSure: 'Ẹ kò dá yín lójú?',
		checkAnotherShort: 'Ṣàyẹ̀wò òmíràn'
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
		noneTitle: 'Ohun tí a ti kọ sílẹ̀ títí di báyìí',
		whatWeKnow: 'Ohun tí a mọ̀',
		madeBy: '{maker} ló ṣe é',
		madeExpires: 'Wọ́n ṣe é ní {made} · Ọjọ́ ìparí: {expires}',
		stepBatch: '{place} · Batch {lot} · Ọjọ́ ìparí: {expires}',
		verified: 'DETECK ti fìdí rẹ̀ múlẹ̀',
		confirmed: 'Ilé-iṣẹ́ yìí ti fìdí rẹ̀ múlẹ̀ pé àwọn gbà á',
		unverified: 'DETECK kò tíì fìdí rẹ̀ múlẹ̀',
		sellerPrompt:
			'Ṣé ibòmìíràn lẹ ti ń rà á? Àkọsílẹ̀ fi hàn pé páálí yìí wà lọ́dọ̀ {holder}. Bí ẹ bá ń rà á níbòmìíràn, ẹ béèrè lọ́wọ́ ẹni tó ń tà á ibi tí ó ti wá.',
		batchPrompt:
			'Ṣé ẹ ń rà á lọ́wọ́ olùpèsè (supplier)? Ẹ wò ó bóyá wọ́n wà nínú àtòjọ yìí. Bí wọn kò bá sí, ẹ béèrè ibi tí ọjà náà ti wá.',
		footnote:
			'Ìrìn-àjò ń fi ohun tí àwọn ilé-iṣẹ́ tó ń ṣe oògùn kọ sílẹ̀ hàn. A kì í fi iye owó, iye ọjà, tàbí orúkọ òṣìṣẹ́ hàn rárá.',
		summary: {
			toRetail: 'Ó kúrò lọ́dọ̀ {maker}{via}, àkọsílẹ̀ tó kẹ́yìn sì fi hàn pé ó wà lọ́dọ̀ {last}.',
			via: ' lọ sọ́dọ̀ {names}',
			batchLevel: {
				one: '{maker} pèsè batch yìí fún ilé-iṣẹ́ {n}. Àkọsílẹ̀ kò sọ èwo ni páálí yìí kọjá lọ́dọ̀ rẹ̀.',
				other:
					'{maker} pèsè batch yìí fún ilé-iṣẹ́ {n}. Àkọsílẹ̀ kò sọ èwo nínú wọn ni páálí yìí kọjá lọ́dọ̀ rẹ̀.'
			},
			none: 'Títí di báyìí, DETECK ní àkọsílẹ̀ ilé-iṣẹ́ tó ṣe batch yìí. Àwọn ilé-iṣẹ́ tó bá ṣe é lọ́wọ́ yóò hàn níbí nígbà tí wọ́n bá kọ wọ́n sílẹ̀.'
		},
		link: {
			none: 'Wo ohun tí a ti kọ sílẹ̀ títí di báyìí',
			lastWith: 'Àkọsílẹ̀ tó kẹ́yìn: ó wà lọ́dọ̀ {name}{where}',
			suppliedTo: {
				one: 'Wọ́n pèsè rẹ̀ fún ilé-iṣẹ́ {n} tó wà nínú àkọsílẹ̀',
				other: 'Wọ́n pèsè rẹ̀ fún ilé-iṣẹ́ {n} tó wà nínú àkọsílẹ̀'
			}
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
		},
		stepsCount: { one: 'Ìgbésẹ̀ {n} tí wọ́n kọ sílẹ̀', other: 'Ìgbésẹ̀ {n} tí wọ́n kọ sílẹ̀' }
	},

	scan: {
		metaTitle: 'Ṣàyẹ̀wò síwájú pẹ̀lú kámẹ́rà · DETECK',
		metaDescription:
			'Ya fọ́tò páálí oògùn, DETECK yóò fi wé páálí tí ilé-iṣẹ́ tó ṣe é ń lò. Ọ̀fẹ́ ni, kò sí àkọọ́lẹ̀ tí ẹ nílò.',
		title: 'Ṣàyẹ̀wò síwájú pẹ̀lú kámẹ́rà',
		closeAria: 'Pa kámẹ́rà dé',
		cameraAria: 'Ohun tí kámẹ́rà ń rí',
		startBubble: 'Ẹ ya fọ́tò páálí náà, màá sì fi wé páálí tí ilé-iṣẹ́ tó ṣe é ń lò.',
		startButton: 'Ka páálí náà pẹ̀lú kámẹ́rà',
		startUpload: 'Gbé fọ́tò páálí mẹ́ta sókè',
		startUploadNote:
			'Iwájú, ẹ̀yìn àti label. A máa ń sọ fọ́tò di kékeré lórí fóònù yín kí a tó fi ránṣẹ́, láti dín ìnáwó dátà kù. Láti fi páálí wéra nìkan ni a fi ń lo àwọn fọ́tò náà, a kò sì ní tọ́jú wọn.',
		startPhotoAlt: 'Ọwọ́ tó gbé fóònù sókè láti ya fọ́tò páálí oògùn',
		howTitle: 'Bí ó ṣe ń ṣiṣẹ́',
		how1: 'Ẹ mú páálí náà dúró níbi tí ìmọ́lẹ̀ ti dáa.',
		how2: 'Ẹ ya fọ́tò mẹ́ta: iwájú, ẹ̀yìn, àti label tó ní nọ́mbà batch.',
		how3: 'Deteck yóò fi wọ́n wé páálí tí ilé-iṣẹ́ tó ṣe é ń lò.',
		how4: 'Ẹ óò rí ohun tó bá a mu àti ohun tó dà bí ẹni pé ó yàtọ̀.',
		typeInstead: 'Tẹ serial dípò bẹ́ẹ̀',
		cancel: 'Fagilé',
		tabCamera: 'Lo kámẹ́rà',
		tabUpload: 'Gbé fọ́tò sókè',
		methodAria: 'Bí ẹ ṣe máa fi fọ́tò kún un',
		photoOf: 'Fọ́tò {n} nínú 3 · {side}',
		serialValid: 'Serial {serial}: Ó bá àkọsílẹ̀ mu',
		sayFront: 'Ẹ di iwájú páálí mú ní títẹ́jú níwájú kámẹ́rà, níbi tí ìmọ́lẹ̀ wà.',
		sayBack: 'Ẹ̀yìn rẹ̀ báyìí, kí kóòdù onígun mẹ́rin hàn. Láti ibẹ̀ ni mo ti ń ka kóòdù.',
		sayLabel: 'Èyí tó kẹ́yìn: label tó ní nọ́mbà batch àti ọjọ́ ìparí.',
		gotCode: 'Mo ti rí kóòdù.',
		photosTitle: 'Fọ́tò fún ìṣàyẹ̀wò páálí',
		taken: 'Ó ti yà',
		takingNow: 'À ń yà á báyìí',
		next: 'Tó kàn',
		noCameraTitle: 'Kò sí kámẹ́rà?',
		noCameraText:
			'Ẹ yí padà sí **Gbé fọ́tò sókè**, kí ẹ fi fọ́tò iwájú, ẹ̀yìn àti label tó hàn kedere kún un. A máa ń dín fọ́tò kù kí a tó fi ránṣẹ́, láti ṣọ́ data.',
		blocked:
			'**Wọ́n ti dí kámẹ́rà yín tàbí kò sí.** Ẹ fàyè gbà á nínú ọ̀pá àdírẹ́sì browser yín, tàbí kí ẹ gbé fọ́tò tí ẹ fi fóònù yín yà sókè.',
		uploadBubble:
			'Fọ́tò láti fóònù yín náà ṣiṣẹ́. Ẹ rí i dájú pé ọ̀kọ̀ọ̀kan hàn kedere, ó sì fi gbogbo ẹ̀gbẹ́ hàn.',
		rulesTitle: 'Òfin fọ́tò',
		rule1: 'JPG tàbí PNG, tí kò ju MB 10 lọ ọ̀kọ̀ọ̀kan',
		rule2: 'Gbogbo ẹ̀gbẹ́ páálí hàn',
		rule3: 'Ìmọ́lẹ̀ tó dáa, kí ìmọ́lẹ̀ má tàn sí i tààrà',
		added: 'Fọ́tò {n} nínú 3 ti wọlé',
		reviewTitle: 'Fọ́tò náà dáa',
		reviewText: 'Wọ́n hàn kedere, ìmọ́lẹ̀ tó, gbogbo páálí sì hàn.',
		reviewBubble: 'Mo ti ṣetán láti fi wọ́n wé páálí ilé-iṣẹ́ náà.',
		retakeOne: 'Tún fọ́tò kan yà',
		noCode:
			'N kò lè ka kóòdù nínú àwọn fọ́tò wọ̀nyí. Ẹ tún ẹ̀yìn páálí yà, ní ìtòsí, kí kóòdù onígun mẹ́rin hàn. Tàbí kí ẹ tẹ serial dípò bẹ́ẹ̀.',
		startCamera: 'Ṣí kámẹ́rà',
		capture: 'Ya fọ́tò',
		busy: 'À ń ka ọ̀pọ̀ fọ́tò lọ́wọ́lọ́wọ́. Ẹ dúró díẹ̀ kí ẹ sì tún gbìyànjú; fọ́tò yín ṣì wà níbí.'
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

	contact: {
		metaTitle: 'Ẹ kàn sí wa · DETECK',
		metaDescription:
			'Ẹ fi ọ̀rọ̀ ránṣẹ́ sí àwọn òṣìṣẹ́ DETECK nípa àyẹ̀wò oògùn, bíbá DETECK ṣiṣẹ́ pọ̀ tàbí lílo API.',
		title: 'Ẹ kàn sí wa',
		lede: 'Ṣé ẹ ní ìbéèrè nípa àyẹ̀wò oògùn, bíbá DETECK ṣiṣẹ́ pọ̀ tàbí lílo API wa? Ẹ fi ọ̀rọ̀ ránṣẹ́ sí wa, a ó sì fi email fèsì sí yín.',
		bubble: 'Ẹ n lẹ́! Ẹ sọ fún wa bí a ṣe lè ràn yín lọ́wọ́.',
		waysTitle: 'Àwọn ọ̀nà mìíràn láti kàn sí wa',
		emailTitle: 'Email',
		partnerTitle: 'Ẹ bá wa ṣiṣẹ́ pọ̀',
		partnerText:
			'Àwọn ilé-iṣẹ́ tó ń ṣe oògùn, àwọn olùpínkiri, ilé-ìtajà oògùn àti ilé-ìwòsàn: ẹ yan "Bíbá DETECK ṣiṣẹ́ pọ̀" nínú fọ́ọ̀mù náà, kí ẹ sì sọ fún wa nípa ilé-iṣẹ́ yín.',
		devTitle: 'Fún àwọn developer',
		devText: 'Ẹ ka ìwé àlàyé API',
		faqTitle: 'Ìdáhùn kíákíá',
		faqText: 'Ẹ wo àwọn ìbéèrè tí àwọn ènìyàn ń béèrè',
		formTitle: 'Ẹ fi ọ̀rọ̀ ránṣẹ́ sí wa',
		name: 'Orúkọ yín ní kíkún',
		email: 'Email',
		organisation: 'Ilé-iṣẹ́ tàbí àjọ (kò pọn dandan)',
		topic: 'Nípa kí ni ọ̀rọ̀ yín?',
		chooseTopic: 'Ẹ yan ọ̀kan',
		topics: {
			general: 'Ìbéèrè gbogbogbò',
			checking: 'Àyẹ̀wò oògùn',
			partnering: 'Bíbá DETECK ṣiṣẹ́ pọ̀',
			developers: 'API náà',
			press: 'Àwọn oníròyìn àti ilé-iṣẹ́ ìròyìn',
			problem: 'Ìṣòro kan lórí ojú-òpó wẹ́ẹ̀bù yìí'
		},
		message: 'Ọ̀rọ̀ yín',
		messageHint: 'Kò gbọ́dọ̀ ju lẹ́tà 3,000 lọ.',
		privacy: 'Láti fèsì sí ọ̀rọ̀ yìí nìkan ni a fi ń lo àlàyé yín.',
		privacyLink: 'Ìkéde àṣírí',
		send: 'Fi ọ̀rọ̀ ránṣẹ́',
		sending: 'A ń fi ránṣẹ́…',
		sentTitle: 'Ẹ ṣé. Ọ̀rọ̀ yín ti dé ọ̀dọ̀ àwọn òṣìṣẹ́ DETECK.',
		sentText: 'A ó fi email fèsì sí yín.',
		sendAnother: 'Fi ọ̀rọ̀ mìíràn ránṣẹ́',
		worried:
			'Ṣé oògùn kan tí ẹ ní báyìí ń dà yín láàmú? Ẹ ṣàyẹ̀wò rẹ̀ lórí DETECK, kí ẹ sì béèrè lọ́wọ́ pharmacist.',
		errors: {
			name: 'Ẹ sọ orúkọ yín fún wa.',
			email: 'Nǹkan kan kù nínú àdírẹ́sì email yẹn, bí .com tàbí .ng.',
			topic: 'Ẹ yan ohun tí ọ̀rọ̀ yín jẹ mọ́.',
			message: 'Ẹ kọ ọ̀rọ̀ yín (lẹ́tà 10 ó kéré tán).',
			too_long: 'Ọ̀rọ̀ yín ti gùn jù. Ẹ jẹ́ kí ó kéré sí lẹ́tà 3,000.',
			human: 'Ẹ jọ̀wọ́, ẹ parí àyẹ̀wò "ṣé ènìyàn ni yín?".',
			limit: 'Ẹ ti fi ọ̀rọ̀ ránṣẹ́ ní ọ̀pọ̀ ìgbà. Ẹ jọ̀wọ́, ẹ tún gbìyànjú tó bá yá.',
			failed: 'A kò lè fi ọ̀rọ̀ yín ránṣẹ́ báyìí. Ẹ jọ̀wọ́, ẹ tún gbìyànjú lẹ́yìn ìṣẹ́jú díẹ̀.'
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
		metaTitle: 'DETECK · Ẹ fi oògùn wé àkọsílẹ̀ ilé-iṣẹ́ tó ṣe é',
		metaDescription:
			'DETECK ń jẹ́ kí ẹnikẹ́ni ní Nàìjíríà fi nọ́mbà serial oògùn wé àkọsílẹ̀ tí ilé-iṣẹ́ tó ṣe é fún DETECK. Ọ̀fẹ́ ni àyẹ̀wò, kò sì sí àkáǹtì.',
		navVision: 'Ìran wa',
		navFaq: 'Àwọn ìbéèrè',
		signIn: 'Wọlé',
		skip: 'Fò lọ sí àkóónú pàtàkì',
		heroTitle: 'Ẹ ṣàyẹ̀wò kí ẹ tó gbẹ́kẹ̀lé.',
		lede: 'Ẹ tẹ nọ́mbà serial tó wà lórí páálí oògùn. DETECK yóò fi wé àkọsílẹ̀ tí ilé-iṣẹ́ tó ṣe é pín.',
		scanPack: 'Ṣàyẹ̀wò síwájú pẹ̀lú kámẹ́rà',
		seeHow: 'Ẹ wo bí ó ṣe ń ṣiṣẹ́',
		heroBubble: 'Ẹ n lẹ́, Deteck ni mí. Mo wà níbí láti ràn yín lọ́wọ́.',
		heroAlt: 'Àwọn kápsúlù aláwọ̀ ọsàn lẹ́gbẹ̀ẹ́ páálí blíster òfìfo lórí ìpìlẹ̀ búlúù fẹ́ẹ́rẹ́',
		heroNote: 'Ẹ kò nílò àkọọ́lẹ̀. Ìdáhùn máa ń dé láàrin ìṣẹ́jú-àáyá díẹ̀.',
		trust: {
			free: 'Ọ̀fẹ́ ni àyẹ̀wò',
			network: 'Ó ń ṣiṣẹ́ lórí 2G àti 3G',
			languages: 'Gẹ̀ẹ́sì, Pidgin, Haúsá, Yorùbá àti Ìgbò',
			records: 'Ìdáhùn láti inú àkọsílẹ̀ ilé-iṣẹ́ tó ṣe oògùn náà'
		},
		reel: {
			soon: 'Fíìmù náà ń bọ̀ láìpẹ́',
			label: 'Fíìmù DETECK'
		},
		howTitle: 'Ìgbésẹ̀ mẹ́ta sí ìdáhùn tó ṣe kedere',
		step1Title: 'Ẹ tẹ serial náà',
		step1Text:
			'Ẹ tẹ nọ́mbà serial tí wọ́n tẹ̀ sórí páálí. Tàbí kí ẹ ya fọ́tò páálí náà: DETECK yóò ka kóòdù rẹ̀, AI yóò sì ṣàyẹ̀wò páálí náà.',
		step2Title: 'A ń ṣàyẹ̀wò àkọsílẹ̀',
		step2Text: 'DETECK máa wá serial náà nínú àkọsílẹ̀ tí ilé-iṣẹ́ tó ṣe é fún DETECK.',
		step3Title: 'Deteck á sọ àbájáde fún yín',
		step3Text:
			'"Ó bá àkọsílẹ̀ mu" tàbí "A kò dá a mọ̀", ní èdè tó rọrùn. Bí àkọsílẹ̀ kò bá tó láti mọ̀ dájú, Deteck á sọ bẹ́ẹ̀.',
		biz: {
			registerManufacturer: 'Forúkọ sílẹ̀ bí ilé-iṣẹ́ tó ń ṣe oògùn',
			registerBusiness: 'Forúkọ sílẹ̀ bí ilé-ìtajà oògùn, ilé-ìwòsàn tàbí olùpínkiri',
			docs: 'Ìwé àlàyé API'
		},
		verifyFurther: {
			title: 'Ẹ ṣàyẹ̀wò páálí, kì í ṣe kóòdù nìkan.',
			text: 'Ẹ ya fọ́tò iwájú, ẹ̀yìn àti label páálí yín. Deteck yóò fi wọ́n wé páálí tí ilé-iṣẹ́ tó ṣe é ń lò, yóò sì sọ fún yín bí nǹkan kan bá dà bí ẹni pé ó yàtọ̀.',
			button: 'Ṣàyẹ̀wò síwájú',
			alt: 'Ojú kámẹ́rà DETECK tó ń fi férémù yí páálí blíster àwọn oògùn tí kò ní àmì ká'
		},
		who: {
			title: 'A ṣe é fún gbogbo ẹni tó ń rà, tó ń kó, tàbí tó ń fúnni ní oògùn.',
			individuals: {
				tab: 'Ẹnì kọ̀ọ̀kan',
				title: 'Ẹ ṣàyẹ̀wò kí ẹ tó rà á tàbí lò ó',
				text: 'Ẹ tẹ nọ́mbà serial tó wà lórí oògùn, tàbí kí ẹ ya fọ́tò páálí rẹ̀, kí ẹ rí i bóyá ó bá àkọsílẹ̀ tó ṣeé gbẹ́kẹ̀lé mu.',
				alt: 'Ọ̀dọ́bìnrin kan ní Èkó ń rẹ́rìn-ín bí ó ṣe ń wo fóònù rẹ̀ lórí àga',
				cta: 'Ṣàyẹ̀wò oògùn'
			},
			facilities: {
				tab: 'Ilé-ìtajà oògùn, ilé-ìwòsàn àti ibùdó ìlera',
				title: 'Ẹ ṣàyẹ̀wò kí ẹ tó tà á tàbí kí ẹ tó fi fúnni',
				text: 'Ẹ ṣàyẹ̀wò àwọn oògùn tí ẹ gbà lọ́wọ́ àwọn olùpèsè kí wọ́n tó dé orí pẹpẹ yín tàbí kí wọ́n tó dé ọwọ́ àwọn aláìsàn.',
				alt: 'Káńtà àti pẹpẹ ilé-ìtajà oògùn ìgbàlódé kan ní Ikeja, Èkó',
				pharmacy: 'Forúkọ sílẹ̀ bí ilé-ìtajà oògùn',
				hospital: 'Forúkọ sílẹ̀ bí ilé-ìwòsàn'
			},
			makers: {
				tab: 'Ilé-iṣẹ́ tó ń ṣe oògùn àti olùpínkiri',
				title: 'Ẹ pín àlàyé nípa ọjà yín',
				text: 'Yálà ẹ̀yin lẹ ń ṣe oògùn, tàbí ẹ ń kó o wọlé tí ẹ sì ń dì í sínú páálí, ẹ gbé àwọn ọjà yín, nọ́mbà serial wọn àti páálí tí ẹ ń lò sókè, kí àwọn ènìyàn lè fi wọ́n wé àkọsílẹ̀ yín.',
				alt: 'Ọkùnrin kan ń ṣàyẹ̀wò àwọn páálí ọjà lórí pẹpẹ ilé-ìpamọ́ ọjà',
				manufacturer: 'Forúkọ sílẹ̀ bí ilé-iṣẹ́ tó ń ṣe oògùn',
				distributor: 'Forúkọ sílẹ̀ bí olùpínkiri'
			}
		},
		impact: {
			title: 'Ipa tí à ń ṣiṣẹ́ láti ní',
			familiesTitle: 'Ìdílé tó ní ìgbọ́kànlé',
			familiesText: 'Àwọn ènìyàn lè ṣàyẹ̀wò oògùn fúnra wọn kí wọ́n tó rà á tàbí lò ó.',
			dispensingTitle: 'Fífi oògùn fúnni tó túbọ̀ láàbò',
			dispensingText:
				'Ilé-ìtajà oògùn àti ilé-ìwòsàn lè fìdí oògùn tí wọ́n gbà múlẹ̀ kí wọ́n tó fi fúnni.',
			productsTitle: 'Ọjà tó ṣeé gbẹ́kẹ̀lé',
			productsText:
				'Àwọn ilé-iṣẹ́ tó ń ṣe oògùn lè forúkọ ọjà wọn sílẹ̀, kí wọ́n sì ran àwọn ènìyàn lọ́wọ́ láti fi wọ́n wé àkọsílẹ̀ wọn.'
		},
		visionTitle: 'Ó yẹ kí ẹnikẹ́ni ní Nàìjíríà lè ṣàyẹ̀wò oògùn rẹ̀.',
		visionAlt: 'Ọ̀dọ́bìnrin kan ń rẹ́rìn-ín bó ṣe ń wo fóònù rẹ̀ ní ilé kọfí kan ní Àbújá',
		visionText:
			'DETECK ń so nọ́mbà serial páálí kọ̀ọ̀kan pọ̀ mọ́ àkọsílẹ̀ ilé-iṣẹ́ tó ṣe é, kí ẹ lè ṣàyẹ̀wò rẹ̀ fúnra yín, dípò kí ẹ gbẹ́kẹ̀lé bí páálí ṣe rí nìkan.',
		faq: {
			title: 'Àwọn ìbéèrè tí àwọn ènìyàn ń béèrè',
			useQ: 'Báwo ni mo ṣe lè lo DETECK?',
			useA: 'Ẹ tẹ nọ́mbà serial tí wọ́n tẹ̀ sórí páálí, lẹ́yìn náà ẹ tẹ Ṣàyẹ̀wò rẹ̀. Deteck yóò fi wé àkọsílẹ̀ ilé-iṣẹ́ tó ṣe é, yóò sì sọ àbájáde fún yín láàrin ìṣẹ́jú-àáyá díẹ̀. Kí ó lè túbọ̀ dá yín lójú, ẹ tẹ Ṣàyẹ̀wò síwájú kí ẹ sì ya fọ́tò páálí náà.',
			helpQ: 'Báwo ni DETECK ṣe ń ràn mí lọ́wọ́?',
			helpA:
				'Ẹ lè ṣàyẹ̀wò oògùn kí ẹ tó rà á, kí ẹ tó lò ó, tàbí kí ẹ tó fún ìdílé yín, dípò kí ẹ máa dájọ́ nípa bí páálí ṣe rí. Ọ̀fẹ́ ni, kò nílò àkọọ́lẹ̀, ó sì ń ṣiṣẹ́ lórí 2G àti 3G ní èdè márùn-ún.',
			resultsQ: 'Kí ni àbájáde náà túmọ̀ sí?',
			resultsA:
				'**Ó bá àkọsílẹ̀ mu:** serial náà bá àkọsílẹ̀ ilé-iṣẹ́ tó ṣe é mu.\n**A kò dá a mọ̀:** a kò rí serial náà. Ẹ wò ó bóyá ẹ tẹ̀ ẹ́ dáadáa, ẹ má sì lo oògùn náà títí yóò fi dá yín lójú.\n**Ó nílò àyẹ̀wò síwájú:** nǹkan kan kò bá a mu. Ẹ ṣàyẹ̀wò síwájú nípa yíya fọ́tò páálí náà.',
			sourceQ: 'Níbo ni DETECK ti ń rí àlàyé rẹ̀?',
			sourceA:
				'Láti ọ̀dọ̀ àwọn ilé-iṣẹ́ tó ń ṣe oògùn àti àwọn olùpínkiri nínú ètò ìpèsè oògùn ní Nàìjíríà tí a jọ ń ṣiṣẹ́. Wọ́n ń pín àkọsílẹ̀ ọjà wọn pẹ̀lú wa: àlàyé nípa ọjà, nọ́mbà batch àti serial, ọjọ́ ìparí àti fọ́tò páálí tí wọ́n ń lò.',
			coverQ: 'Ṣé gbogbo oògùn tó wà ní Nàìjíríà ló wà lórí DETECK?',
			coverA:
				'Kò tíì rí bẹ́ẹ̀. À ń fi àwọn ilé-iṣẹ́ tó ń ṣe oògùn àti oògùn wọn kún un lọ́kọ̀ọ̀kan. Bí oògùn kan kò bá tíì sí lórí DETECK, Deteck á sọ fún yín pé a kò ní àkọsílẹ̀ rẹ̀. Ìyẹn kò túmọ̀ sí pé ayédèrú ni. Ẹ béèrè lọ́wọ́ pharmacist tó ní ìwé-àṣẹ kí ẹ tó lò ó.',
			nextQ: 'Kí ló kàn fún DETECK?',
			nextA:
				'À ń kọ́ ètò ìtọpinpin ìpèsè oògùn, kí ẹ lè rí ibi tí batch kan ti kọjá, láti ilé-iṣẹ́ tí wọ́n ti ṣe é, lọ́dọ̀ olùpínkiri kọ̀ọ̀kan, títí dé ilé-ìtajà oògùn tàbí ilé-ìwòsàn tó tà á.',
			more: 'Ṣé ẹ ṣì ní ìbéèrè? Ẹ kàn sí wa tààrà.',
			partner: 'Ẹ bá wa ṣiṣẹ́ pọ̀',
			api: 'API fún àwọn developer',
			contactUs: 'Ẹ kàn sí wa'
		},
		verifyTitle: 'Ṣé páálí oògùn wà lọ́wọ́ yín? Ẹ ṣàyẹ̀wò rẹ̀ báyìí.',
		verifyLabel: 'Nọ́mbà serial tó wà lórí páálí',
		verifyButton: 'Ṣàyẹ̀wò rẹ̀',
		footerLead: 'A ń kọ́ DETECK pẹ̀lú àwọn alábàáṣiṣẹ́pọ̀ káàkiri ètò ìpèsè oògùn ní Nàìjíríà.',
		footerNav: 'Ìsàlẹ̀ ojú-ìwé',
		footerProduct: 'Ọjà wa',
		footerCompany: 'Ilé-iṣẹ́ wa',
		footerBusiness: 'Fún ilé-iṣẹ́',
		contact: 'Ẹ kàn sí wa',
		photoCredit: 'Àwọn fọ́tò láti Unsplash, Pexels àti Wikimedia Commons',
		cropped: 'a gé e',
		legal:
			'© 2026 DETECK. Àyẹ̀wò dá lórí àwọn ilé-iṣẹ́ tó ń ṣe oògùn tó kópa, tí wọ́n sì ń kọ oògùn wọn sílẹ̀. DETECK ń ṣàyẹ̀wò àkọsílẹ̀ àti, nínú ìdánwò (beta), bí páálí ṣe rí; kò lè dán ohun tó wà nínú páálí wò.'
	}
};
