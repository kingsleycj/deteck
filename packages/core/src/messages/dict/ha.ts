/** Hausa. Draft: needs a native speaker's review before launch. */
import type { Messages } from './en.ts';

export const ha: Messages = {
	meta: {
		name: 'Hausa',
		reviewed: false
	},

	common: {
		or: 'ko',
		and: 'da',
		back: 'Koma baya',
		checkMedicine: 'Duba magani',
		checkAnother: 'Duba wani magani',
		checkSerial: 'Duba lambar serial',
		language: 'Harshe',
		draftNotice:
			'Wannan fassara har yanzu daftari ce, Hausawa na ci gaba da duba ta. Idan wani abu bai fito fili ba, sauya zuwa Turanci.',
		englishOnly: 'Wannan shafi da Turanci yake.',
		notRecorded: 'Ba a rubuta ba',
		dateNotRecorded: 'Ba a rubuta kwanan wata ba'
	},

	nav: {
		home: 'Shafin farko na Deteck',
		main: 'Babban menu',
		how: 'Yadda yake aiki',
		pharmacies: 'Don kantunan magani',
		manufacturers: 'Don kamfanonin ƙera magani',
		badge: 'Babu kuɗin DETECK'
	},

	footer: {
		about: 'Game da DETECK',
		check: 'Duba magani',
		privacy: 'Sirri',
		terms: 'Sharuɗɗa',
		business: 'Don kamfanonin ƙera magani da kantunan magani',
		developers: 'Masu haɓaka manhaja',
		note: 'Sakamako ya dogara da bayanan da kamfanonin ƙera magani suka ba DETECK.'
	},

	check: {
		metaTitle: 'DETECK · Duba maganinka',
		metaDescription:
			'Rubuta lambar serial da ke kan kwalin magani, ka kwatanta ta da bayanan kamfanin da ya ƙera maganin. Babu buƙatar asusu, babu kuɗin DETECK.',
		pilotOn:
			'An kunna sababbin abubuwa na gwaji a wannan burauza na kwana 90, har da binciken kwali (gwaji).',
		greeting:
			'Sannu, ni ne Deteck. Rubuta lambar serial da ke kan kwalin maganinka, ni kuma zan duba maka ita.',
		title: 'Duba maganinka',
		subtitle: 'Duba ko ya dace da bayanan kamfanin da ya ƙera shi.',
		label: 'Lambar serial',
		placeholder: 'misali 7K4M 9QX2 TB8D',
		hint: 'Duba kusa da barcode, bayan **SN** ko **Serial**.',
		submit: 'Duba magani',
		scan: 'Yi sikan na kod ɗin a maimakon haka',
		footer:
			'Ana iya duba lambar serial a 2G da 3G. Ba a buƙatar asusu. Babu kuɗin DETECK; za a cire kuɗin data kamar yadda aka saba.',
		humanPrompt:
			'**Kana duba kwalaye da yawa?** Tabbatar cewa kai mutum ne domin ka ci gaba ba tare da jira ba.',
		humanButton: 'Ci gaba da dubawa',
		humanFailed: 'Don Allah ka kammala gwajin "kai mutum ne?".',
		asideLabel: 'Abin da DETECK ke dubawa',
		asideTitle: 'Abin da Deteck ke dubawa',
		asideSerial: '**Lambar serial.** Shin ta dace da bayanan kamfanin da ya ƙera maganin?',
		asidePackaging:
			'**Kwalin magani.** AI na neman bambance-bambancen da ake iya gani tsakaninsa da kwalin kamfanin da ya ƙera shi.',
		asideJourney: '**Tafiyar magani.** Waɗanne wuraren kasuwanci ne bayanai suka ce sun riƙe shi.',
		asideNote:
			'Deteck yana faɗin abin da bayanai suka nuna. Ba zai iya gwada abin da ke cikin kwali ba.',
		checkingTitle: 'Ana duba bayanai…',
		checkingBody:
			'Deteck yana kwatanta lambar serial ɗinka da bayanan kamfanin da ya ƙera maganin.',
		retry: 'Sake gwadawa',
		tryAgain: 'Gwada kuma'
	},

	format: {
		empty: 'Rubuta lambar serial da aka buga a kan kwalin.',
		too_short:
			'Wannan ya yi gajarta da yawa ga lambar serial. Lambar serial tana da aƙalla haruffa ko lambobi 4.',
		too_long:
			'Wannan ya fi lambar serial tsawo (har zuwa haruffa da lambobi 20). Tabbatar cewa lambar serial kaɗai ka rubuta.',
		bad_characters: 'Yi amfani da haruffa da lambobin da ke bayan SN a kan kwalin kawai.',
		nafdac_number:
			'Wannan kamar lambar rajistar NAFDAC ce. Lambar serial wata lamba ce daban, wadda galibi ake buga ta bayan SN kusa da barcode.',
		bad_code:
			'Ba mu iya karanta wannan kod ɗin ba. Rubuta lambar serial da ke bayan SN a maimakon haka.',
		mascot:
			'Hmm, wannan bai yi kama da lambar serial ba tukuna. Abin da ka rubuta yana nan a cikin akwatin, don haka sai ka gyara inda ba daidai ba kawai.'
	},

	network: {
		slow: 'Network yana jinkiri. Danna Sake gwadawa. Na adana lambar serial ɗinka.',
		slowServer:
			'Bayanan sun daɗe ba su amsa ba. Lambar serial ɗinka tana nan a cikin akwatin: danna Duba magani don sake gwadawa.',
		offlineTitle: 'Ban iya isa ga bayanan ba',
		offlineBody:
			'Da alama wayarka ba ta da intanet. Lambar serial ɗinka tana nan a cikin akwatin, don haka za ka iya sake danna Duba magani idan network ya dawo.',
		rateLimited: {
			one: 'An yi dubawa da yawa cikin ɗan lokaci. Don Allah jira minti {n} sannan ka sake gwadawa.',
			other:
				'An yi dubawa da yawa cikin ɗan lokaci. Don Allah jira minti {n} sannan ka sake gwadawa.'
		}
	},

	result: {
		metaExpired: 'Lokacin sakamakon ya ƙare',
		head: 'Sakamako',
		backAria: 'Koma shafin farko',
		serialAria: 'Lambar serial da aka duba',
		heading: 'Sakamako: {badges}',
		expiredTitle: 'Lokacin wannan sakamakon ya ƙare',
		expiredBody:
			'Ana ajiye sakamako na minti 30 kawai. Sake duba lambar serial don ganin bayanai na baya-bayan nan.',
		batchLabel: 'Lambar batch',
		batchHelp: 'Ana buga ta bayan LOT, BN ko Batch a kan kwalin.',
		batchMissing: 'Rubuta lambar batch da aka buga a kan kwalin.',
		batchNotMatched:
			'Wannan lambar batch ba ta dace da bayanan wannan lambar serial ba. Duba lambar batch da ke bayan LOT, BN ko Batch, sannan ka sake rubuta ta.',
		continue: 'Ci gaba',
		detailsAria: 'Cikakkun bayanai',
		product: 'Magani',
		manufacturer: 'Kamfanin da ya ƙera',
		nafdac: 'Lambar rajistar NAFDAC',
		batch: 'Batch',
		expires: 'Ranar ƙarewa',
		expired: 'Waʼadi ya ƙare',
		pack: 'Kwali',
		reasonsIntro: 'Hakan na iya faruwa idan:',
		journeyLink: 'Duba tafiyar maganin',
		checkPackaging: 'Duba kwalin magani (gwaji)',
		scanCode: 'Yi sikan na kod ɗin a maimakon haka',
		retype: 'Sake rubuta lambar serial',
		report: 'Kai rahoton zargin magani na jabu',
		worried: 'Duk da haka kana damuwa da wannan kwalin?',
		worriedLink: 'Kai rahoto ga DETECK',
		journeyStillStands: 'Sakamakon lambar serial bai canza ba.',
		footnote:
			'Wannan yana nuna abin da bayanan kamfanin da ya ƙera maganin suka ce. Ba gwajin ɗakin gwaje-gwaje ba ne na abin da ke cikin kwalin.',

		thisMedicine: 'wannan magani',
		theManufacturer: 'kamfanin da ya ƙera shi',
		TheManufacturer: 'Kamfanin da ya ƙera shi',
		askPharmacist: 'Tambayi masanin magunguna kafin ka yi amfani da shi.',
		coverage: 'Ya zuwa yanzu DETECK yana da bayanan {products} daga {manufacturers}.',
		products: { one: 'nauʼin magani {n}', other: 'nauʼikan magani {n}' },
		manufacturers: { one: 'kamfanin ƙera magani {n}', other: 'kamfanonin ƙera magani {n}' },

		valid: {
			badge: 'YA YI DAIDAI DA BAYANAI',
			bubble: 'Wannan lambar serial ta dace da bayanan {maker} na {product}.'
		},
		mismatch: {
			badge: 'DUBA KWALIN',
			title: 'Kwalin bai dace da bayanan ba',
			bubbleLot:
				'Wannan lambar serial ta dace da bayanan {maker} na {product}, amma lambar batch da aka buga a kan wannan kwalin ta bambanta da wadda ke cikin bayanan.',
			bubbleExpiry:
				'Wannan lambar serial ta dace da bayanan {maker} na {product}, amma ranar ƙarewa da aka buga a kan wannan kwalin ta bambanta da wadda ke cikin bayanan.',
			nextStep:
				'Nuna wannan sakamakon ga masanin magunguna kafin ka yi amfani da maganin, kuma ka ajiye kwalin.'
		},
		expiredPack: {
			badge: 'WAʼADI YA ƘARE',
			title: 'Yana cikin bayanai, amma waʼadinsa ya ƙare',
			bubble:
				'Wannan lambar serial ta dace da bayanan {maker} na {product}, amma ranar ƙarewarsa ta wuce.',
			nextStep:
				'Maganin da waʼadinsa ya ƙare mai yiwuwa ba zai yi aiki yadda ya kamata ba. Mayar da shi wurin da ka saye shi, ka nemi kwalin da waʼadinsa bai ƙare ba tukuna.'
		},
		recalled: {
			badgeRecalled: 'AN JANYE',
			badgeWithdrawn: 'AN CIRE DAGA KASUWA',
			titleRecalled: 'An janye wannan batch',
			titleWithdrawn: 'An cire wannan batch daga kasuwa',
			bubbleRecalled: 'An janye batch {lot} na {product}{by}{on}.',
			bubbleWithdrawn: 'An cire batch {lot} na {product} daga kasuwa{by}{on}.',
			by: ' ta hannun {source}',
			on: ' a ranar {date}',
			reason: 'Dalilin da aka bayar: {reason}',
			nextStep:
				'Kafin lokacin shan maganinka na gaba, tambayi masanin magunguna ko likita abin da za ka sha a madadinsa, kuma ka mayar da wannan kwalin wurin da ka saye shi.'
		},
		cantConfirm: {
			badge: 'BA A IYA TABBATARWA BA',
			title: 'Ba za a iya tabbatar da wannan bayani yanzu ba',
			bubbleProduct:
				'An dakatar da bayanan wannan magani a DETECK na ɗan lokaci, don haka ba zan iya ba da sakamako ga wannan kwalin ba.',
			bubbleManufacturer:
				'An dakatar da bayanan kamfanin da ya ƙera maganin a DETECK na ɗan lokaci, don haka ba zan iya ba da sakamako ga wannan kwalin ba.'
		},
		notCovered: {
			badge: 'BABU SHI A DETECK TUKUNA',
			title: 'Babu wannan magani a DETECK tukuna',
			bubble:
				'Kamfanin da ya ƙera shi bai ba DETECK bayanansa ba tukuna, don haka ba zan iya duba wannan kwalin ba. Wannan ba yana nufin na jabu ne ba.',
			reviewBubble:
				'Kamfanin da ya ƙera shi ya ƙara wannan magani, amma DETECK na nan tana duba bayanansa, don haka ba zan iya duba wannan kwalin ba tukuna. Wannan ba yana nufin na jabu ne ba.',
			nextStep: 'Za ka iya tambayar masanin magunguna game da wannan magani.'
		},
		needsBatch: {
			badge: 'SAURA MATAKI ƊAYA',
			title: 'Wanne batch ne a kan kwalin?',
			bubble:
				'Wannan lambar serial ta dace da magani fiye da ɗaya. Rubuta lambar batch domin in gano wanda ya dace.',
			scanTitle: 'Yi sikan na kod ɗin don kammalawa',
			scanBubble:
				'Wannan lambar serial da lambar batch sun yi daidai da magani fiye da ɗaya. Yi sikan na kod mai siffar murabbaʼi da ke kan kwalin domin in gane wanne ne.'
		},
		unrecognised: {
			badge: 'BA A GANE SHI BA',
			title: 'Ba mu sami wannan lambar serial ba',
			not_found: 'Ban sami wannan lambar serial a cikin bayanan da nake da su ba.',
			not_found_for_covered_product:
				'Wannan magani yana cikin DETECK, amma wannan lambar serial ba ta cikin bayanan kamfanin da ya ƙera shi.',
			batch_not_matched: 'Wannan lambar batch ba ta dace da bayanan wannan lambar serial ba.',
			no_serial_in_code:
				'Wannan kod ɗin yana nuna wane magani ne, amma ba shi da lambar serial, don haka ba zan iya duba wannan kwalin ba.',
			mistyped:
				'An rubuta lambar serial ba daidai ba. Sake rubuta ta, kana kwatanta kowane harafi da lamba da na kan kwalin.',
			notShared: 'Kamfanin da ya ƙera maganin bai ba DETECK bayanansa ba tukuna.',
			notRecorded: 'Kamfanin da ya ƙera maganin bai yi rajistar lambar da ke kan kwalin ba.',
			serialWhere: 'Inda za ka sami lambar serial a kan {drug}: {hint}',
			typeInstead: 'Rubuta wannan lambar serial a shafin dubawa maimakon yin sikan.',
			typeToConfirm:
				'Rubuta wannan lambar serial a shafin dubawa, don tabbatar da cewa sikan ɗin ya karanta ta daidai.',
			nextStepKeep: 'Tambayi masanin magunguna kafin ka yi amfani da shi, kuma ka ajiye kwalin.'
		}
	},

	alerts: {
		summary: 'Sanar da ni idan an janye wannan batch',
		how: 'Yadda za mu tuntuɓe ka',
		email: 'Imel',
		whatsapp: 'WhatsApp',
		addressBoth: 'Imel ko lambar WhatsApp',
		consent:
			'DETECK zai iya amfani da wannan kawai don sanar da ni game da wannan batch, kuma ya goge shi kwana 30 bayan waʼadin batch ɗin ya ƙare.',
		signUp: 'Yi rajista',
		needConsent: 'Sa alama a cikin akwatin don amincewa da sanarwar.',
		already: 'Ka riga ka yi rajista don wannan batch.',
		checkEmail: 'Duba imel ɗinka, ka danna link ɗin don tabbatarwa.',
		whatsappDone: 'Mun aiko maka da saƙo a WhatsApp. Ka amsa da YES domin tabbatar da sanarwar.',
		errors: {
			expired: 'Lokacin wannan sakamakon ya ƙare. Sake duba lambar serial, sannan ka yi rajista.',
			bad_email: 'Akwai abin da ya rage a wannan adireshin imel, kamar .com ko .ng.',
			whatsapp_off: 'Sanarwa ta WhatsApp ba ta samu ba tukuna.',
			bad_phone: 'Shigar da lambar WhatsApp ɗinka, kamar 0803 123 4567.',
			whatsapp_failed: 'Ba mu iya aika saƙon WhatsApp zuwa wannan lambar ba.',
			already_recalled:
				'An riga an janye wannan batch ko an cire shi daga kasuwa. Sake duba lambar serial domin ka ga abin da za ka yi.',
			too_many:
				'Mun riga mun aika saƙon rajista zuwa wannan adireshin yau. Duba akwatin saƙonka (har da spam), ko ka sake gwadawa gobe.',
			daily_limit: 'An yi rajistar sanarwa da yawa a yau. Don Allah ka sake gwadawa gobe.'
		},
		confirm: {
			question: 'Ka tabbatar da sanarwar janyewa don batch {lot} na {drug}?',
			button: 'Tabbatar da sanarwa',
			metaTitle: 'Sanarwar janye magani · DETECK',
			doneTitle: 'Ka yi rajista',
			doneBody:
				'Za mu aiko maka da imel idan an janye batch {lot} na {drug} ko an cire shi daga kasuwa. Kowace sanarwa tana da link na dakatar da su.',
			badTitle: 'Wannan link ɗin ba ya aiki',
			badBody:
				'Mai yiwuwa bai cika ba, ko kuma lokacin rajistar ya riga ya ƙare. Sake duba lambar serial don yin rajista.'
		},
		stop: {
			metaTitle: 'Dakatar da sanarwar janye magani · DETECK',
			question: 'A dakatar da sanarwar janye magani don wannan batch?',
			button: 'Dakatar da sanarwa',
			stoppedTitle: 'An dakatar da sanarwa',
			stoppedBody: 'Mun goge adireshinka na wannan batch.',
			badTitle: 'Wannan link ɗin ba ya aiki',
			badBody: 'Mai yiwuwa bai cika ba. Wataƙila an riga an cire rajistarka.'
		},
		emails: {
			confirmSubject: 'Tabbatar da sanarwar janye {drug}',
			confirmBody:
				'Ka nemi DETECK ya sanar da kai idan an janye batch {lot} na {drug} ko an cire shi daga kasuwa.\n\nTabbatar a nan:\n{confirmUrl}\n\nDETECK yana amfani da wannan adireshi ne kawai don wannan sanarwa, kuma yana goge shi kwana 30 bayan waʼadin batch ɗin ya ƙare. Don soke shi yanzu:\n{stopUrl}',
			recallSubjectRecalled: 'An janye batch {lot} na {drug}',
			recallSubjectWithdrawn: 'An cire batch {lot} na {drug} daga kasuwa',
			recallBodyRecalled: 'An janye batch {lot} na {drug}{by}.',
			recallBodyWithdrawn: 'An cire batch {lot} na {drug} daga kasuwa{by}.',
			by: ' ta hannun {source}',
			reason: 'Dalilin da aka bayar: {reason}',
			advice:
				'Idan kana da wannan kwalin, kafin lokacin shan maganinka na gaba, tambayi masanin magunguna ko likita abin da za ka sha a madadinsa, kuma ka mayar da kwalin wurin da ka saye shi.',
			stop: 'Idan DETECK ta soke wannan janyewa, za ka sami ƙarin imel ɗaya. Dakatar da sanarwa yanzu:\n{stopUrl}',
			liftedSubject: 'An soke janye batch {lot} na {drug}',
			liftedBody:
				'Ba a ƙara janye batch {lot} na {drug} ba. Duba kwalayensa yanzu zai ba da sakamako na yau da kullum.',
			liftedStop:
				'Za ka sami wani imel idan aka sake janye wannan batch. Dakatar da sanarwa:\n{stopUrl}',
			signature: 'DETECK\nIdan ba ka yi tsammanin wannan imel ba, za ka iya watsi da shi.'
		}
	},

	journey: {
		metaTitle: 'DETECK · Tafiyar maganin',
		title: 'Tafiyar maganin',
		backAria: 'Koma ga sakamako',
		expiredBody: 'Sake duba lambar serial don ganin tafiyarsa.',
		batchLine: '{product} · Batch {lot}',
		noneTitle: 'Babu tafiyar da aka rubuta tukuna',
		whatWeKnow: 'Abin da muka sani',
		madeBy: '{maker} ne ya ƙera shi',
		madeExpires: 'An ƙera {made} · Ranar ƙarewa {expires}',
		gap: 'Babu bayani na wannan mataki',
		gapBetween: 'Tsakanin {after} da {before}',
		stepBatch: '{place} · Batch {lot} · Ranar ƙarewa {expires}',
		verified: 'DETECK ya tantance',
		confirmed: 'Wannan wurin kasuwanci ya tabbatar da karɓa',
		unverified: 'DETECK bai tantance ba tukuna',
		recordsEnd: 'Bayanai sun ƙare a nan. Ba a rubuta matakan da suka biyo baya a DETECK ba tukuna.',
		sellerPrompt:
			'Kana saye a wani wuri daban? Bayanai sun nuna wannan kwalin yana hannun {holder}. Idan kana saye a wani wuri, tambayi mai sayarwa inda ya samo shi.',
		batchPrompt:
			'Kana saye daga mai kawo kaya? Duba ko yana cikin wannan jerin. Idan ba ya ciki, tambayi inda ya samo kayan.',
		footnote:
			'Tafiya tana nuna abin da kamfanonin ƙera magani suka rubuta. Ba a taɓa nuna farashi, yawan kaya ko sunayen maʼaikata ba.',
		summary: {
			toRetail: 'Ya tashi daga {maker}{via} kuma an rubuta shi na ƙarshe a hannun {last}.{gap}',
			via: ' zuwa {names},',
			gap: ' Akwai mataki ɗaya a hanya da babu shi a cikin bayanai.',
			endsBeforeRetail:
				'Ya tashi daga {maker} zuwa {names}. Bayanai sun ƙare a can: ba a rubuta matakan da suka biyo baya a DETECK ba tukuna.',
			batchLevel: {
				one: '{maker} ya kai wannan batch ga wurin kasuwanci {n}. Bayanai ba su faɗi wanne ne ya riƙe wannan kwalin ba.',
				other:
					'{maker} ya kai wannan batch ga wuraren kasuwanci {n}. Bayanai ba su faɗi wanne daga cikinsu ya riƙe wannan kwalin ba.'
			},
			none: 'Kamfanin da ya ƙera maganin bai bayyana inda aka tura wannan batch ba, don haka ba zan iya nuna waɗanda suka riƙe shi ba.'
		},
		link: {
			none: 'Babu tafiyar da aka rubuta tukuna',
			lastWith: 'An rubuta shi na ƙarshe a hannun {name}{where}',
			suppliedTo: {
				one: 'An kai shi ga wurin kasuwanci {n} da ke cikin bayanai',
				other: 'An kai shi ga wuraren kasuwanci {n} da ke cikin bayanai'
			},
			endsAt: 'Bayanai sun ƙare a {name}{where}'
		},
		step: {
			manufacturer: 'MAI ƘERAWA · AN ƘERA {month}',
			lastHolder: 'MAI RIƘEWA NA ƘARSHE A BAYANAI',
			lastHolderSince: 'MAI RIƘEWA NA ƘARSHE A BAYANAI · TUN {date}'
		},
		roles: {
			manufacturer: 'Mai ƙerawa',
			distributor: 'Mai rarrabawa',
			wholesaler: 'Mai sayar da sari',
			pharmacy: 'Kantin magani',
			hospital: 'Asibiti',
			other: 'Wurin kasuwanci'
		}
	},

	scan: {
		metaTitle: 'Duba ta hanyar sikan · DETECK',
		title: 'Duba ta hanyar sikan',
		closeAria: 'Rufe sikan',
		blockedBubble:
			'Ina buƙatar kyamararka don yin sikan na kwalin. Da alama an kashe ta ga DETECK.',
		turnOnTitle: 'Kunna kyamara',
		turnOn1: 'Buɗe Settings na wayarka, ko ka danna alamar kwaɗo da ke kusa da adireshin shafin.',
		turnOn2: 'Nemo burauzarka (browser), sannan ka zaɓi Camera.',
		turnOn3: 'Ba da izini ga Camera (Allow), sannan ka dawo nan.',
		turnedOn: 'Na kunna ta',
		cameraAria: 'Abin da kyamara ke gani',
		holdAuto: 'Sa kod mai siffar murabbaʼi a cikin akwatin. Zan karanta shi kai tsaye.',
		holdPhoto:
			'Sa kod mai siffar murabbaʼi a cikin akwatin, a wuri mai haske, sannan ka ɗauki hoto.',
		takePhoto: 'Ɗauki hoton kod ɗin',
		reading: 'Ana karanta kod ɗin…',
		intro:
			'Yi sikan na kod mai siffar murabbaʼi da ke kan kwalin, ni kuma zan kwatanta lambar serial ɗinsa da bayanan kamfanin da ya ƙera maganin.',
		unsupported:
			'Wannan burauza ba za ta iya buɗe kyamara a nan ba. Ɗauki hoton kod ɗin a maimakon haka.',
		scanButton: 'Yi sikan na kod ɗin',
		photoIdle: 'Ɗauki ko zaɓi hoton kod ɗin',
		photoGallery: 'Zaɓi hoto daga cikin hotunanka',
		readPhoto: 'Karanta kod ɗin da ke hotona',
		typeInstead: 'Rubuta lambar serial a maimakon haka',
		footer:
			'Ana rage girman hotuna a wayarka kafin a aika, don a rage kashe data. Ana amfani da hoton ne don karanta kod ɗin kawai, ba a ajiye shi.',
		noPhoto: 'Da farko, ɗauki ko zaɓi hoton kod ɗin.',
		tooLarge: 'Wannan hoton ya yi girma da yawa. Sake gwadawa da ƙaramin hoto.',
		unreadable:
			'Ban iya karanta kod a wannan hoton ba. Kusantar da kwalin, a wuri mai haske, kod mai siffar murabbaʼi ya kasance a tsakiya. Ko kuma ka rubuta lambar serial a maimakon haka.'
	},

	packaging: {
		photosMetaTitle: 'Hotuna don binciken kwali · DETECK',
		title: 'Duba kwalin magani (gwaji)',
		backAria: 'Koma ga sakamako',
		serialLine: 'Lambar serial {serial}: Ya yi daidai da bayanai · {product} · Batch {lot}',
		intro:
			'Yanzu ka ɗauki hotuna uku: gaba, baya da lakabi. Riƙe kwalin a kwance, a wuri mai haske.',
		notes: {
			front: 'A iya karanta sunan alama, sunan magani da ƙarfinsa',
			back: 'A iya karanta sinadarai da kamfanin da ya ƙera',
			label: 'A iya karanta batch da ranar ƙarewa'
		},
		clear: '✓ Ya fito sarai',
		checkingPhoto: 'Ana duba hoton…',
		unchecked: 'An ƙara hoto. Za a duba shi idan ka aika.',
		takePhoto: 'Ɗauki hoto',
		retake: 'Sake ɗauka',
		tooDark: 'Ya yi duhu sosai. Sake ɗauka a wuri mai ƙarin haske.',
		glare: 'Haske ya yi yawa ya ɓata shi. Karkata kwalin daga hasken.',
		blurry:
			'Ya yi dishi-dishi sosai. Ba zan iya karanta bayanan ba. Riƙe wayar da kyau ba tare da girgiza ba.',
		sizeNote:
			'Ana rage girman hotuna a wayarka kafin a aika (kusan 750 KB gaba ɗaya), don haka yana aiki a 3G.',
		sending: 'Ana aika hotuna…',
		submit: 'Duba kwalin',
		checking: 'Ana duba kwalin',
		yourCheck: 'Binciken da ka yi',
		serialRead: 'An karanta lambar serial: Ya yi daidai da bayanai',
		photosReceived: 'An karɓi hotuna 3',
		comparing: 'Ana kwatanta tambari, rubutu, launuka da alamomin tsaro',
		serialRow: 'Lambar serial',
		valid: 'Ya yi daidai da bayanai',
		journeyRow: 'Tafiya',
		packagingRow: 'Kwali',
		somethingDifferent: 'Akwai wani abu da ya bambanta',
		retakePhotos: 'Sake ɗaukar hotunan',
		notAvailableYet: 'Binciken kwali bai samu ba tukuna.',
		dailyLimit:
			'Ka kai iyakar binciken kwali da za a iya yi yau a wannan naʼura. Sake gwadawa gobe.',
		checkSerialFirst:
			'Da farko ka duba lambar serial. Binciken kwali na kwalayen da lambar serial ɗinsu ke cikin bayanai ne.',
		addPhoto: {
			front: 'Ƙara hoton gaban kwalin.',
			back: 'Ƙara hoton bayan kwalin.',
			label: 'Ƙara hoton lakabi da batch.'
		},
		photoProblems: {
			unreadable: 'Wannan fayil ba hoto ne da za mu iya buɗewa ba. Yi amfani da JPG ko PNG.',
			too_small: 'Wannan hoton ya yi ƙanƙanta. Yi amfani da hoto mafi girma da ya fi fitowa sarai.',
			blurry:
				'Wannan hoton ya yi dishi-dishi. Ba zan iya karanta bayanan ba. Riƙe wayar da kyau ba tare da girgiza ba, a wuri mai haske.',
			dark: 'Wannan hoton ya yi duhu sosai. Sake ɗauka a wuri mai ƙarin haske.',
			bright:
				'Haske ko kyalli ya yi yawa a wannan hoton. Karkata kwalin daga hasken, sannan ka sake gwadawa.'
		},
		categories: {
			logo: 'Da alama tambarin ya bambanta da na kwalin kamfanin da ya ƙera maganin',
			font: 'Da alama rubutun haruffan ya bambanta da na kwalin kamfanin da ya ƙera maganin',
			colour: 'Da alama launukan sun bambanta da na kwalin kamfanin da ya ƙera maganin',
			print_quality: 'Da alama ingancin bugun ya bambanta da na kwalin kamfanin da ya ƙera maganin',
			missing_security_feature:
				'Ba a ga wata alamar tsaro da ke kan kwalin kamfanin da ya ƙera maganin ba',
			label_layout: 'Da alama tsarin lakabin ya bambanta da na kwalin kamfanin da ya ƙera maganin'
		},
		sides: {
			front: 'Gaban kwalin',
			back: 'Bayan kwalin',
			label: 'Lakabi da batch'
		},
		disclaimer:
			'Wannan dubawa ce ta bayanai da kuma yadda kwalin yake a gani. Ba za ta iya gwada abin da ke ciki ba, don haka ka bi umarnin likitanka ko masanin magunguna.',
		notAvailable:
			'Kamfanin da ya ƙera wannan magani bai ba DETECK hotunan kwalinsa ba tukuna, don haka lambar serial kaɗai zan iya dubawa.',
		analysing: 'Ana kwatantawa da kwalin kamfanin da ya ƙera maganin…',
		analysingNote: 'Wannan yakan ɗauki ƙasa da daƙiƙa 30.',
		photoRules: 'Gefen kwalin gaba ɗaya ya bayyana · wuri mai haske · babu kyalli',
		retain:
			'Ajiye hotunana na kwana 90 don taimaka wa DETECK ya duba yadda binciken kwali ke da inganci. Za a goge su bayan haka.',
		beta: 'Gwaji: ana gwada binciken kwali. Ka ɗauke shi a matsayin ƙarin alama ɗaya, ba amsa ta ƙarshe ba.',
		provider:
			'Ana aika hotunanka ga kamfanin AI da ke yi wa DETECK aiki, wato Anthropic, don a kwatanta su da hotunan kamfanin da ya ƙera maganin. Kada ka sa fuska ko takardar magani ta likita a cikinsu.',
		outcomes: {
			match: {
				badge: 'BABU BAMBANCIN DA AKA GANI',
				title: 'Ba a ga bambanci a waɗannan hotunan ba',
				bubble:
					'Lambar serial ta dace da bayanan kamfanin da ya ƙera maganin, kuma ban ga wani bambanci da kwalin kamfanin a waɗannan hotunan ba.',
				line: 'Ba a sami saɓani da ake iya gani a waɗannan hotunan ba'
			},
			mismatch: {
				badge: 'WANI ABU BAI DACE BA',
				title: 'Wani abu bai dace ba',
				bubble:
					'Lambar serial tana cikin bayanai, amma kwalin ya bambanta a gani da kwalin kamfanin da ya ƙera maganin.',
				nextStep:
					'Nuna wannan sakamakon ga masanin magunguna kafin ka yi amfani da maganin, ko ka saya daga wani kantin magani.',
				line: 'An sami saɓani'
			},
			unsure: {
				badge: 'BA ZAN IYA CEWA BA',
				title: 'Ba zan iya ganewa daga waɗannan hotunan ba',
				bubble:
					'Lambar serial tana cikin bayanai, amma ban tabbata sosai game da kwalin da zan iya cewa wani abu ba.',
				nextStep:
					'Hotuna masu fitowa sarai a hasken rana sukan taimaka. Ko ka roƙi masanin magunguna ya duba shi tare da kai.',
				line: 'Ba za a iya ganewa daga waɗannan hotunan ba'
			}
		}
	},

	report: {
		metaTitle: 'Kai rahoton zargin magani na jabu · DETECK',
		title: 'Kai rahoton zargin magani na jabu',
		intro:
			'Faɗa wa DETECK game da kwalin da kake damuwa da shi. Muna duba kowane rahoto kuma za mu iya miƙa shi ga NAFDAC da kamfanin da ya ƙera maganin.',
		medicine: 'Maganin',
		nameLabel: 'Suna da ƙarfin maganin da ke kan kwalin',
		namePlaceholder: 'misali Amoxil 500 mg kafsul',
		photosLabel: 'Hotunan kwalin (har zuwa {n}, ba dole ba)',
		photosHelp: 'Hotunan gaba, baya da lakabin da ke da lambar batch sun fi taimakawa.',
		where: 'Inda ka samo shi',
		place: 'Kantin magani, shago ko mai sayarwa',
		state: 'Jiha',
		chooseState: 'Zaɓi jiha',
		town: 'Gari ko unguwa',
		boughtOn: 'Lokacin da ka saya (ba dole ba)',
		details: 'Me ya dame ka? (ba dole ba)',
		reach: 'Yadda za mu tuntuɓe ka (ba dole ba)',
		reachNote:
			'DETECK kaɗai ke ganin waɗannan, don yin ƙarin tambayoyi. Ba za a taɓa ba kamfanin da ya ƙera maganin ko mai sayarwa ba.',
		name: 'Suna',
		email: 'Imel',
		phone: 'Lambar waya',
		consent:
			'DETECK zai iya miƙa wannan rahoto da hotunan (amma ba bayanan tuntuɓata ba) ga NAFDAC da kamfanin da ya ƙera maganin.',
		submit: 'Aika rahoton',
		unwell:
			'Idan kai ko wani ya ji rashin lafiya bayan shan magani, a je wurin likita ko masanin magunguna nan take.',
		errors: {
			limit: 'Ka aika rahotanni da dama yau. Sake gwadawa gobe.',
			missing_drug: 'Faɗi wane magani ne, misali suna da ƙarfin maganin da ke kan kwalin.',
			missing_place: 'Faɗi inda ka saye shi, misali sunan kantin magani.',
			bad_state: 'Zaɓi jiha.',
			bad_email: 'Akwai abin da ya rage a wannan adireshin imel, kamar .com ko .ng.',
			photo_too_large: 'Kowane hoto dole ya kasance ƙasa da 12 MB.',
			photo_unreadable: '{name} ba hoto ne da za mu iya buɗewa ba.'
		},
		thanks: {
			metaTitle: 'An aika rahoto · DETECK',
			title: 'Mun gode. Rahotonka ya isa ga DETECK.',
			body: 'Wani maʼaikacin DETECK yana duba kowane rahoto. Idan ka bar bayanan tuntuɓarka, za mu iya tuntuɓarka da tambayoyi. Ajiye kwalin da rasitinka idan za ka iya.'
		}
	},

	error: {
		notFoundTitle: 'Ban sami wannan shafin ba',
		notFoundBody: 'Mai yiwuwa link ɗin ya tsufa ko an rubuta shi ba daidai ba.',
		forbiddenTitle: 'Ba ka da izinin buɗe wannan shafin',
		forbiddenBody: 'Asusunka ba shi da izinin shiga wannan shafin.',
		tooManyTitle: 'Buƙatu sun yi yawa',
		tooManyBody: 'Don Allah jira minti ɗaya.',
		otherTitle: 'Wani abu ya lalace a ɓangarenmu',
		otherBody:
			'Ba kai ne ka jawo wannan ba. Don Allah sake gwadawa nan da minti ɗaya. Idan kana duba magani ne, sake rubuta lambar serial.',
		code: 'Kuskure {status}'
	},

	landing: {
		metaTitle: 'Game da DETECK · Duba magunguna da bayanan kamfanonin da suka ƙera su',
		metaDescription:
			'DETECK yana ba kowa a Najeriya damar kwatanta lambar serial ta magani da bayanan da kamfanin da ya ƙera shi ya bayar, kuma ya ga tafiyarsa da aka rubuta. Babu asusu, babu kuɗin DETECK.',
		navWho: 'Waɗanda muke yi wa hidima',
		navVision: 'Burinmu',
		eyebrow: 'Duba magunguna don Najeriya · babu kuɗin DETECK',
		heroTitle: 'Ka tantance kafin ka amince.',
		lede: 'Rubuta lambar serial da ke kan kwalin magani, ko ka yi sikan na kod ɗinsa. DETECK zai kwatanta ta da bayanan da kamfanin da ya ƙera shi ya bayar, ya kuma nuna maka wanda ya ƙera shi da tafiyarsa da aka rubuta har zuwa gare ka.',
		scanPack: 'Yi sikan na kwali',
		seeHow: 'Ga yadda yake aiki',
		heroBubble: 'Sannu, ni ne Deteck. Ina nan don in taimaka.',
		heroAlt:
			'Wata masaniyar magunguna ʼyar Najeriya tana duba kwalin magani da wayarta, yayin da mai saye ke jira a gaban teburin kanti',
		heroChip: 'Ya yi daidai da bayanan kamfanin da ya ƙera shi',
		heroChipSub: 'Misali · Mai ƙerawa → Mai rarrabawa → Kantin magani',
		runPharmacy: 'Kana da kantin magani?',
		runPharmacyLink: 'Ga yadda DETECK zai taimake ka',
		step1Title: 'Rubuta ko yi sikan na kod',
		step1Text:
			'Rubuta lambar serial da aka buga a kan kwalin, ko ka yi sikan na kod ɗin maganin da wayarka.',
		step2Title: 'Muna duba bayanai',
		step2Text:
			'DETECK yana neman lambar serial a cikin bayanan da kamfanin da ya ƙera maganin ya bayar, har da tafiyarsa da aka rubuta ta hannun masu rarrabawa da kantunan magani.',
		step3Title: 'Deteck yana faɗa maka sakamako',
		step3Text:
			'Ya yi daidai da bayanai ko Ba a gane shi ba, cikin kalmomi masu sauƙi, tare da tafiyar maganin da aka rubuta. Idan bayanan ba su isa a tabbatar ba, Deteck zai faɗa maka haka.',
		whoLead: 'An gina shi ne domin duk mai saye, ko mai jigila, ko mai ba da magani.',
		audiences: {
			citizens: {
				label: 'ʼYan Najeriya',
				alt: 'Wata uwa tana duba kwalin magani a wayarta a gaban teburin kantin magani',
				title: 'Duba kafin ka saya ko ka yi amfani da shi',
				text: 'Rubuta lambar serial da ke kan magani, ko ka yi sikan na kod ɗinsa, ka ga ko ya dace da bayanan kamfanin da ya ƙera shi.'
			},
			pharmacies: {
				label: 'Kantunan magani',
				alt: 'Wata masaniyar magunguna tana duba kwalin magani da wayarta',
				title: 'Duba abin da kake karɓa',
				text: 'Duba magungunan da suka zo daga masu kawo kaya, ka ga kamfanin da ya ƙera su da tarihin rarrabawarsu da aka rubuta kafin ka ɗora su a kan shiryayye.'
			},
			hospitals: {
				label: 'Asibitoci da cibiyoyin lafiya',
				alt: 'Wata maʼaikaciyar jinya tana duba kwalayen magani a ɗakin ajiyar asibiti',
				title: 'Duba kafin ka ba da magani',
				text: 'Duba magungunan da cibiyarka ke karɓa kafin a ba da su ko a ba marasa lafiya.'
			},
			distributors: {
				label: 'Masu rarrabawa da masu sayar da sari',
				alt: '',
				title: 'Ka zama ɓangare na tafiyar da aka rubuta',
				text: 'Idan kamfanin da ya ƙera magani ya rubuta cewa ya kawo maka kaya, sunan kasuwancinka zai bayyana a cikin tafiyar wannan magani, don masu saye su ga inda aka rubuta kayan sun wuce a hanya.'
			},
			manufacturers: {
				label: 'Kamfanonin ƙera magani',
				alt: 'Wani maʼaikacin fasaha yana duba kwalayen magani a layin ɗaure kaya',
				title: 'Raba bayanan magungunanka',
				text: 'Ɗora magungunanka, lambobin serial, bayanan hanyoyin rarraba kaya da hotunan kwalaye, don mutane su iya kwatanta magungunanka da bayananka.'
			}
		},
		visionTitle:
			'Kowane magani a Najeriya, **a iya bin diddiginsa** daga masanaʼanta har zuwa hannunka.',
		visionText:
			'Kowane ɗan Najeriya ya cancanci ya san inda maganinsa ya fito. DETECK yana haɗa lambar serial ta kowane kwali da bayanan kamfanin da ya ƙera shi, don ka iya duba wane magani ne da tafiyarsa da aka rubuta, maimakon ka dogara kawai da yadda kwalin yake a gani.',
		impactTitle: 'Tasirin da muke ƙoƙarin samarwa',
		impact1Alt: 'Wata uwa tana duba kwalin magani a wayarta a gaban teburin kantin magani',
		impact1Title: 'Iyalai masu kwarin gwiwa',
		impact1Text: 'Mutane za su iya duba magani da kansu kafin su saya ko su yi amfani da shi.',
		impact2Alt:
			'Wata maʼaikaciyar jinya tana duba kwalayen magani a kan shiryayyen ɗakin ajiyar asibiti da kwamfutar hannu',
		impact2Title: 'Ba da magani cikin kulawa',
		impact2Text:
			'Kantunan magani da asibitoci za su iya duba magungunan da suke karɓa kafin su ba da su.',
		impact3Alt:
			'Wani maʼaikacin fasaha sanye da kayan ɗaki mai tsafta yana duba kwalayen magani a layin ɗaure kaya',
		impact3Title: 'Bayanai masu nuna alhaki',
		impact3Text:
			'Kamfanonin ƙera magani suna yin rajistar magungunansu don mutane su iya kwatanta su da bayanansu.',
		whyEyebrow: 'Me ya sa DETECK',
		whyTitle: 'Amsa ɗaya bayyananniya, mai gaskiya game da abin da ta sani.',
		strengths: {
			serial: 'Yana kwatanta lambar serial da bayanan da kamfanin da ya ƙera maganin ya ba DETECK',
			journey: 'Yana nuna tafiyar da aka rubuta ta hannun masu rarrabawa da kantunan magani',
			packaging:
				'Zai iya kwatanta hotunan kwali da kwalin kamfanin da ya ƙera maganin (gwaji, ga wasu magunguna)',
			network:
				'Ana iya duba lambar serial a 2G da 3G. Babu kuɗin DETECK; za a cire kuɗin data kamar yadda aka saba',
			honest: 'Yana faɗa maka gaskiya idan babu isasshen bayani da za a tabbatar'
		},
		verifyTitle: 'Kana riƙe da kwalin magani? Duba shi yanzu.',
		verifyLabel: 'Lambar serial da ke kan kwalin',
		verifyButton: 'Duba shi',
		verifyFine:
			'Ana iya duba lambar serial a 2G da 3G. Babu kuɗin DETECK; za a cire kuɗin data kamar yadda aka saba. Sakamako ya dogara da bayanan da kamfanonin ƙera magani suka ba DETECK. Idan babu isasshen bayani da za a tabbatar, Deteck zai faɗa maka.',
		footerLead:
			'Muna gina DETECK tare da abokan hulɗa a duk faɗin hanyar samar da magunguna a Najeriya.',
		pilotPartner: 'Zama abokin hulɗa a gwajin farko',
		registerCompany: 'Yi rajistar kamfaninka',
		footerNav: 'Ƙasan shafi',
		footerProduct: 'Manhaja',
		footerCompany: 'Kamfani',
		contact: 'Tuntuɓe mu',
		legal:
			'© 2026 DETECK. Sunayen magunguna da bayanan da aka nuna a nan misalai ne. Dubawa ya dogara da kamfanonin ƙera magani masu shiga shirin da suke rubuta magungunansu da hanyoyin rarraba su. DETECK yana duba bayanai, kuma a lokacin gwaji, yadda kwali yake a gani; ba zai iya gwada abin da ke cikin kwali ba.'
	}
};
