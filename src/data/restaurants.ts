// The card display model plus the data layer. Real Google Places results are
// adapted into `Restaurant`; when no API key is configured we fall back to the
// bundled mock deck so the app still runs end-to-end.

import { type ImageSourcePropType } from 'react-native';
import {
	fetchCoordinates,
	fetchPlaces,
	hasApiKey,
	type Coordinates,
	type Place,
} from '../api/googlePlaces';
import { DIETARY_OPTIONS, formatPlaceType, getPlaceEmoji, PRICE_MAP } from '../constants/googlePlaces';

export type Restaurant = {
	id: string;
	name: string;
	cuisine: string;
	price: string;
	distance: string;
	rating?: number;
	ratingCount?: number;
	/** Hue (0–360) tinting the placeholder card when there's no photo. */
	hue: number;
	/** Big emoji shown on the placeholder card in lieu of a (separately-billed) photo. */
	emoji: string;
	/**
	 * Bundled card photo (a `require(...)` asset). Only the mock deck sets this;
	 * real Places results leave it unset and fall back to the emoji placeholder,
	 * since fetching Google photos is separately billed.
	 */
	photo?: ImageSourcePropType;
	/** Street address, shown in the detail sheet. */
	address?: string;
};

export type SearchQuery = {
	location: string;
	coords?: Coordinates;
	radius: number; // search radius in metres
	priceLevels: string[];
	openNow: boolean;
	/** Selected dietary filter key (see DIETARY_OPTIONS); unset = no constraint. */
	dietary?: string;
	/**
	 * Live Google Autocomplete session token for the location field. Set only when
	 * the user typed an address without picking a prediction, so the geocode step
	 * closes the same billed session those keystrokes opened. Unset once a
	 * prediction or GPS resolves coords (no geocode needed).
	 */
	sessionToken?: string;
};

/**
 * Keep the first occurrence of each id. Guards every downstream list against a
 * repeated place id — which would otherwise collide React keys (the swipe deck,
 * the shortlist, and the verdict wheel all key off `id`).
 */
export function uniqueById<T extends { id: string }>(items: T[]): T[] {
	const seen = new Set<string>();
	const out: T[] = [];
	for (const item of items) {
		if (seen.has(item.id)) continue;
		seen.add(item.id);
		out.push(item);
	}
	return out;
}

// Deterministic hue from a string so each card gets a stable, distinct tint.
function hueFrom(seed: string): number {
	let h = 0;
	for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360;
	return h;
}

function placeToRestaurant(place: Place): Restaurant {
	const cuisine = formatPlaceType(place.primaryType);
	return {
		id: place.id,
		name: place.name ?? 'Unknown spot',
		cuisine,
		price: place.priceLevel ? PRICE_MAP[place.priceLevel] ?? '' : '',
		distance: place.distance ?? '',
		rating: place.rating,
		ratingCount: place.ratingCount,
		hue: hueFrom(place.primaryType || place.name || place.id),
		emoji: getPlaceEmoji(place.primaryType),
		address: place.address,
	};
}

/** Bundled demo deck — used when no Google API key is configured. */
export const MOCK_RESTAURANTS: Restaurant[] = [
	{ id: 'ChIJ2ZDgUg0Z2jERXUJpEsR0Oto', name: 'Tian Tian Hainanese Chicken Rice', cuisine: 'Chicken Rice', price: '$', distance: '0.9 km', rating: 3.9, ratingCount: 6277, hue: 42, emoji: '🍗', photo: require('../../assets/images/mock/tian-tian-chicken-rice.jpg'), address: '1 Kadayanallur St, #01-10/11 Maxwell Food Centre, Singapore 069184' },
	{ id: 'ChIJuU6afXIY2jER21Ir01uoZUY', name: '328 Katong Laksa', cuisine: 'Laksa', price: '$$', distance: '2.4 km', rating: 3.9, ratingCount: 3815, hue: 14, emoji: '🍜', photo: require('../../assets/images/mock/katong-laksa.jpg'), address: '51 E Coast Rd, Singapore 428770' },
	{ id: 'ChIJsfizTCMa2jER0PvLzgOm59g', name: 'JUMBO Seafood - Dempsey Hill', cuisine: 'Chilli Crab', price: '$$$', distance: '1.6 km', rating: 4.5, ratingCount: 4404, hue: 9, emoji: '🦀', photo: require('../../assets/images/mock/jumbo-seafood.jpg'), address: '11 Dempsey Rd, #01-16, Singapore 249673' },
	{ id: 'ChIJDcaRbY8Z2jER9weu8geZhtU', name: 'Song Fa Bak Kut Teh Chinatown Point', cuisine: 'Bak Kut Teh', price: '$$', distance: '1.2 km', rating: 4.4, ratingCount: 3469, hue: 28, emoji: '🍲', photo: require('../../assets/images/mock/song-fa-bak-kut-teh.jpg'), address: '133 New Bridge Rd, #01-04 Chinatown Point, Singapore 059413' },
	{ id: 'ChIJcxFXaw8Z2jERMXh3inxmsdA', name: 'Satay Street @ Lau Pa Sat', cuisine: 'Satay', price: '$$', distance: '0.7 km', rating: 4.4, ratingCount: 2963, hue: 24, emoji: '🍢', photo: require('../../assets/images/mock/lau-pa-sat-satay.jpg'), address: 'Boon Tat St, Singapore' },
	{ id: 'ChIJXwLbnv0Z2jERsUDm0FMFSlg', name: 'Ya Kun Kaya Toast (Maxwell)', cuisine: 'Kaya Toast', price: '$', distance: '0.5 km', rating: 4.1, ratingCount: 345, hue: 46, emoji: '🍞', photo: require('../../assets/images/mock/ya-kun-kaya-toast.jpg'), address: '297 S Bridge Rd, Singapore 058839' },
	{ id: 'ChIJhxMBFFEQ2jERTFZ30j_3k2A', name: 'Springleaf Prata Place - The Rail Mall', cuisine: 'Roti Prata', price: '$', distance: '4.8 km', rating: 4.4, ratingCount: 4466, hue: 33, emoji: '🫓', photo: require('../../assets/images/mock/springleaf-prata.jpg'), address: '396 Upper Bukit Timah Road, The Rail Mall, Singapore 678048' },
	{ id: 'ChIJv4Mk4QYa2jERczmNSOPbWeY', name: 'Selera Rasa Nasi Lemak', cuisine: 'Nasi Lemak', price: '$', distance: '5.5 km', rating: 4.0, ratingCount: 555, hue: 95, emoji: '🍚', photo: require('../../assets/images/mock/selera-rasa-nasi-lemak.jpg'), address: '2 Adam Rd, #01-02 Food Centre, Singapore 289876' },
];

/**
 * Outcome of a search:
 *  - `ok`          — deck resolved (may still be empty = genuinely no matches)
 *  - `no-location` — the typed place couldn't be geocoded ("bad location")
 *  - `error`       — a network/API failure; the deck is unknown, not empty
 */
export type SearchStatus = 'ok' | 'no-location' | 'error';
export type SearchOutcome = { deck: Restaurant[]; status: SearchStatus };

/**
 * Resolves a query into a deck to swipe. Falls back to the mock deck when no API
 * key is present. The status lets callers tell a bad location and a network
 * failure apart from a genuine "nothing matched", so each gets the right screen.
 */
export async function searchRestaurants(query: SearchQuery): Promise<SearchOutcome> {
	if (!hasApiKey) return { deck: MOCK_RESTAURANTS, status: 'ok' };

	try {
		const coords = query.coords ?? (await fetchCoordinates(query.location, query.sessionToken));
		if (!coords) return { deck: [], status: 'no-location' };

		// Resolve the dietary key to the term folded into the text query (if any).
		const dietaryQuery = query.dietary
			? DIETARY_OPTIONS.find((d) => d.key === query.dietary)?.query
			: undefined;

		const places = await fetchPlaces(
			coords.lat,
			coords.lng,
			query.radius,
			query.priceLevels,
			query.openNow,
			dietaryQuery
		);
		return { deck: uniqueById(places.map(placeToRestaurant)), status: 'ok' };
	} catch {
		// fetchCoordinates / fetchPlaces rethrow on network/API failure.
		return { deck: [], status: 'error' };
	}
}

/** Compacts a review count: 1240 → "1.2k". */
export function formatCount(n: number): string {
	return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`;
}

/** The descriptor row under a card name: "Mexican · $$ · 0.6 km". */
export function descriptorLine(r: Restaurant): string {
	return [r.cuisine, r.price, r.distance].filter(Boolean).join(' · ');
}

/** Formats the meta line under a card: "Mexican · $$ · 0.6 km · ★ 4.6 (812)". */
export function metaLine(r: Restaurant): string {
	const parts = [r.cuisine, r.price, r.distance].filter(Boolean);
	if (typeof r.rating === 'number') {
		const count = r.ratingCount ? ` (${formatCount(r.ratingCount)})` : '';
		parts.push(`★ ${r.rating.toFixed(1)}${count}`);
	}
	return parts.join(' · ');
}

/** Deep link to the winner in Google Maps. */
export function mapsUrl(r: Restaurant): string {
	// Both the mock deck and live Places results carry a real Google place id, so
	// we can open the place's detail card directly rather than a name search.
	return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.name)}&query_place_id=${r.id}`;
}
