// Maps a Google `primaryType` to a representative emoji (used on placeholder
// cards and to caption real photos).
const PLACE_EMOJI: Record<string, string> = {
	acai_shop: '🍓',
	bagel_shop: '🥯',
	bakery: '🥐',
	bar: '🍸',
	bar_and_grill: '🍻',
	barbecue_restaurant: '🍖',
	breakfast_restaurant: '🍳',
	brunch_restaurant: '🥞',
	buffet_restaurant: '🍽️',
	cafe: '☕',
	cafeteria: '🍱',
	candy_store: '🍬',
	cat_cafe: '🐱',
	chinese_restaurant: '🥡',
	chocolate_factory: '🍫',
	chocolate_shop: '🍫',
	coffee_shop: '☕',
	confectionery: '🍬',
	deli: '🥪',
	dessert_restaurant: '🍰',
	dessert_shop: '🧁',
	diner: '🍳',
	dog_cafe: '🐶',
	donut_shop: '🍩',
	fast_food_restaurant: '🍟',
	fine_dining_restaurant: '🍷',
	food_court: '🍱',
	french_restaurant: '🥖',
	greek_restaurant: '🥙',
	hamburger_restaurant: '🍔',
	ice_cream_shop: '🍦',
	indian_restaurant: '🍛',
	indonesian_restaurant: '🍲',
	italian_restaurant: '🍝',
	japanese_restaurant: '🍱',
	juice_shop: '🧃',
	korean_restaurant: '🍲',
	lebanese_restaurant: '🧆',
	mediterranean_restaurant: '🫒',
	mexican_restaurant: '🌮',
	middle_eastern_restaurant: '🧆',
	pizza_restaurant: '🍕',
	pub: '🍺',
	ramen_restaurant: '🍜',
	sandwich_shop: '🥪',
	seafood_restaurant: '🦞',
	spanish_restaurant: '🥘',
	steak_house: '🥩',
	sushi_restaurant: '🍣',
	tea_house: '🍵',
	thai_restaurant: '🍜',
	turkish_restaurant: '🥙',
	vegan_restaurant: '🥗',
	vegetarian_restaurant: '🥗',
	vietnamese_restaurant: '🍜',
	wine_bar: '🍷',
};

export const getPlaceEmoji = (primaryType?: string): string =>
	(primaryType && PLACE_EMOJI[primaryType]) || '🍴';

// Turns a Google primaryType into a friendly cuisine label, e.g.
// "italian_restaurant" → "Italian", "coffee_shop" → "Coffee Shop".
export const formatPlaceType = (type?: string): string => {
	if (!type) return 'Restaurant';
	const words = type.replace(/_/g, ' ').split(' ');
	const trimmed = words.length > 1 && words[words.length - 1] === 'restaurant' ? words.slice(0, -1) : words;
	return trimmed.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

export const PRICE_MAP: Record<string, string> = {
	PRICE_LEVEL_INEXPENSIVE: '$',
	PRICE_LEVEL_MODERATE: '$$',
	PRICE_LEVEL_EXPENSIVE: '$$$',
	PRICE_LEVEL_VERY_EXPENSIVE: '$$$$',
};

export const PRICE_KEYS = Object.keys(PRICE_MAP);

// Radius chips shown on the intro, mapped to metres for the API's locationBias.
export const RADII_OPTIONS = ['1 km', '2 km', '5 km', '10 km'] as const;
export const DEFAULT_RADIUS: (typeof RADII_OPTIONS)[number] = '2 km';

export const RADIUS_METRES: Record<string, number> = {
	'1 km': 1000,
	'2 km': 2000,
	'5 km': 5000,
	'10 km': 10000,
};
