// The card display model plus the data layer. Real Google Places results are
// adapted into `Restaurant`; when no API key is configured we fall back to the
// bundled mock deck so the app still runs end-to-end.

import {
	fetchCoordinates,
	fetchPlaces,
	hasApiKey,
	type Coordinates,
	type Place,
} from '../api/googlePlaces';
import { formatPlaceType, getPlaceEmoji, PRICE_MAP, RADIUS_METRES } from '../constants/googlePlaces';

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
};

export type SearchQuery = {
	location: string;
	coords?: Coordinates;
	radius: string; // one of RADII_OPTIONS
	cravings: string[];
	priceLevels: string[];
	openNow: boolean;
};

export type WinnerStrategy = 'surprise me' | 'first like' | 'highest rated';

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
	};
}

/** Bundled demo deck — used when no Google API key is configured. */
export const MOCK_RESTAURANTS: Restaurant[] = [
	{ id: 'm1', name: 'Casa Verde', cuisine: 'Mexican', price: '$$', distance: '0.4 mi', rating: 4.6, ratingCount: 812, hue: 130, emoji: '🌮' },
	{ id: 'm2', name: 'Noodle Theory', cuisine: 'Ramen', price: '$$', distance: '1.1 mi', rating: 4.8, ratingCount: 1240, hue: 35, emoji: '🍜' },
	{ id: 'm3', name: "Lucia's", cuisine: 'Pizza', price: '$$', distance: '0.7 mi', rating: 4.5, ratingCount: 356, hue: 8, emoji: '🍕' },
	{ id: 'm4', name: 'Golden Lotus', cuisine: 'Dim Sum', price: '$$$', distance: '2.3 mi', rating: 4.7, ratingCount: 903, hue: 48, emoji: '🥟' },
	{ id: 'm5', name: 'Burger Alibi', cuisine: 'Burgers', price: '$', distance: '0.5 mi', rating: 4.3, ratingCount: 2110, hue: 25, emoji: '🍔' },
	{ id: 'm6', name: 'Petit Bouchon', cuisine: 'French', price: '$$$', distance: '1.6 mi', rating: 4.9, ratingCount: 274, hue: 280, emoji: '🥖' },
	{ id: 'm7', name: 'Saffron House', cuisine: 'Indian', price: '$$', distance: '1.9 mi', rating: 4.4, ratingCount: 640, hue: 18, emoji: '🍛' },
	{ id: 'm8', name: 'Sea & Salt', cuisine: 'Sushi', price: '$$$', distance: '0.9 mi', rating: 4.6, ratingCount: 489, hue: 200, emoji: '🍣' },
];

/** Outcome of a search: whether we could resolve the location, plus the deck. */
export type SearchOutcome = { deck: Restaurant[]; locationResolved: boolean };

/**
 * Resolves a query into a deck to swipe. Falls back to the mock deck when no API
 * key is present. `locationResolved` is false when the typed place couldn't be
 * geocoded, so callers can tell "bad location" apart from "no matches".
 */
export async function searchRestaurants(query: SearchQuery): Promise<SearchOutcome> {
	if (!hasApiKey) return { deck: MOCK_RESTAURANTS, locationResolved: true };

	const coords = query.coords ?? (await fetchCoordinates(query.location));
	if (!coords) return { deck: [], locationResolved: false };

	const radiusMetres = RADIUS_METRES[query.radius] ?? 1600;
	const places = await fetchPlaces(
		coords.lat,
		coords.lng,
		query.cravings,
		radiusMetres,
		query.priceLevels,
		query.openNow
	);
	return { deck: places.map(placeToRestaurant), locationResolved: true };
}

/** Compacts a review count: 1240 → "1.2k". */
function formatCount(n: number): string {
	return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`;
}

/** Formats the meta line under a card: "Mexican · $$ · 0.4 mi · ★ 4.6 (812)". */
export function metaLine(r: Restaurant, showRating: boolean): string {
	const parts = [r.cuisine, r.price, r.distance].filter(Boolean);
	if (showRating && typeof r.rating === 'number') {
		const count = r.ratingCount ? ` (${formatCount(r.ratingCount)})` : '';
		parts.push(`★ ${r.rating.toFixed(1)}${count}`);
	}
	return parts.join(' · ');
}

/** Picks the verdict from the liked pile. Default is a random "surprise me". */
export function pickWinner(likes: Restaurant[], strategy: WinnerStrategy = 'surprise me'): Restaurant | null {
	if (!likes.length) return null;
	if (strategy === 'first like') return likes[0];
	if (strategy === 'highest rated') {
		return likes.slice().sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))[0];
	}
	return likes[Math.floor(Math.random() * likes.length)];
}

/**
 * Picks a *different* winner from the liked pile without re-swiping. Excludes the
 * current pick so "Pick another" always changes; falls back to the same one when
 * there's nothing else to offer.
 */
export function rerollWinner(likes: Restaurant[], currentId: string): Restaurant | null {
	const others = likes.filter((r) => r.id !== currentId);
	if (!others.length) return likes[0] ?? null;
	return others[Math.floor(Math.random() * others.length)];
}

/** Deep link to the winner in Google Maps. */
export function mapsUrl(r: Restaurant): string {
	const q = encodeURIComponent(r.name);
	// Mock ids aren't real place ids, so only attach when it looks like one.
	const placeId = r.id.startsWith('m') && r.id.length <= 3 ? '' : `&query_place_id=${r.id}`;
	return `https://www.google.com/maps/search/?api=1&query=${q}${placeId}`;
}
