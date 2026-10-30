/**
 * Photos for the landing pages. The public page uses `hero` and `citizens`; the others wait for the
 * business landing page (B-82). From Unsplash (unsplash.com/license: free, credit optional), Pexels
 * (pexels.com/license: free, credit optional) and Wikimedia Commons (CC BY-SA: credit it with the
 * licence, and mark it as cropped). The people shown don't endorse DETECK, so a page must never say
 * or imply they do. Each file is saved as `static/img/landing/<file>-{640,1024,1600}.webp`, 3:2.
 */
interface Photo {
	file: string;
	photographer: string;
	source: 'Pexels' | 'Unsplash' | 'Wikimedia Commons';
	/** The photo's own page, where its licence and photographer are shown. */
	page: string;
	/** Set when the licence asks for more than a credit (CC BY-SA: a link, and that it was changed). */
	licence?: { name: string; url: string };
}

export const LANDING_PHOTOS = {
	// No brand is readable on the box or the foil. Not taken in Nigeria, and the page doesn't say so.
	hero: {
		file: 'counter-capsules',
		photographer: 'Melany (tuinfosalud.com)',
		source: 'Unsplash',
		page: 'https://unsplash.com/photos/F6clvre8fGg'
	},
	citizens: {
		file: 'abuja-cafe',
		photographer: 'Muhammad-Taha Ibrahim',
		source: 'Pexels',
		page: 'https://www.pexels.com/photo/33837432/'
	},
	pharmacies: {
		file: 'ikeja-pharmacy',
		photographer: 'FrankvEck',
		source: 'Wikimedia Commons',
		page: 'https://commons.wikimedia.org/wiki/File:Pharmacy_ikeja_lagos.jpg',
		licence: { name: 'CC BY-SA 4.0', url: 'https://creativecommons.org/licenses/by-sa/4.0/' }
	},
	hospitals: {
		file: 'abuja-nurse',
		photographer: 'Taiye Salawu',
		source: 'Pexels',
		page: 'https://www.pexels.com/photo/36450260/'
	},
	// No free photo of a Nigerian warehouse or lab without consumer brands was found, so these two
	// aren't of Nigeria. Replace them with stills from the DETECK film when it's shot.
	distributors: {
		file: 'stock-check',
		photographer: 'Tima Miroshnichenko',
		source: 'Pexels',
		page: 'https://www.pexels.com/photo/6169643/'
	},
	manufacturers: {
		file: 'lab',
		photographer: 'RF._.studio',
		source: 'Pexels',
		page: 'https://www.pexels.com/photo/3825414/'
	}
} as const satisfies Record<string, Photo>;

export type LandingPhoto = keyof typeof LANDING_PHOTOS;

export const photoSrcset = (file: string) =>
	`/img/landing/${file}-640.webp 640w, /img/landing/${file}-1024.webp 1024w, /img/landing/${file}-1600.webp 1600w`;
