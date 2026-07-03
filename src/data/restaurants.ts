// The card display model plus the data layer. Real Google Places results are
// adapted into `Restaurant`; when no API key is configured we fall back to the
// bundled mock deck so the app still runs end-to-end.

import {
	buildPhotoUri,
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
	/** Hue (0–360) tinting the striped placeholder when there's no photo. */
	hue: number;
	/** Caption shown on the placeholder, e.g. the signature dish or cuisine. */
	photoLabel: string;
	/** Real photo URL when available; otherwise the striped placeholder shows. */
	photoUri?: string;
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
		photoLabel: `${getPlaceEmoji(place.primaryType)} ${cuisine}`,
		photoUri: place.photoName ? buildPhotoUri(place.photoName) : undefined,
	};
}

/** Bundled demo deck — used when no Google API key is configured. */
export const MOCK_RESTAURANTS: Restaurant[] = [
	{ id: 'm1', name: 'Casa Verde', cuisine: 'Mexican', price: '$$', distance: '0.4 mi', rating: 4.6, hue: 130, photoLabel: 'tacos al pastor' },
	{ id: 'm2', name: 'Noodle Theory', cuisine: 'Ramen', price: '$$', distance: '1.1 mi', rating: 4.8, hue: 35, photoLabel: 'tonkotsu ramen' },
	{ id: 'm3', name: "Lucia's", cuisine: 'Pizza', price: '$$', distance: '0.7 mi', rating: 4.5, hue: 8, photoLabel: 'margherita pizza' },
	{ id: 'm4', name: 'Golden Lotus', cuisine: 'Dim Sum', price: '$$$', distance: '2.3 mi', rating: 4.7, hue: 48, photoLabel: 'har gow + siu mai' },
	{ id: 'm5', name: 'Burger Alibi', cuisine: 'Burgers', price: '$', distance: '0.5 mi', rating: 4.3, hue: 25, photoLabel: 'double smash burger' },
	{ id: 'm6', name: 'Petit Bouchon', cuisine: 'French', price: '$$$', distance: '1.6 mi', rating: 4.9, hue: 280, photoLabel: 'steak frites' },
	{ id: 'm7', name: 'Saffron House', cuisine: 'Indian', price: '$$', distance: '1.9 mi', rating: 4.4, hue: 18, photoLabel: 'butter chicken' },
	{ id: 'm8', name: 'Sea & Salt', cuisine: 'Sushi', price: '$$$', distance: '0.9 mi', rating: 4.6, hue: 200, photoLabel: 'chef omakase' },
];

/**
 * Resolves a query into a deck to swipe. Falls back to the mock deck when no API
 * key is present. Returns an empty array when a live search finds nothing.
 */
export async function searchRestaurants(query: SearchQuery): Promise<Restaurant[]> {
	if (!hasApiKey) return MOCK_RESTAURANTS;

	const coords = query.coords ?? (await fetchCoordinates(query.location));
	if (!coords) return [];

	const radiusMetres = RADIUS_METRES[query.radius] ?? 1600;
	const places = await fetchPlaces(
		coords.lat,
		coords.lng,
		query.cravings,
		radiusMetres,
		query.priceLevels,
		query.openNow
	);
	return places.map(placeToRestaurant);
}

/** Formats the meta line under a card: "Mexican · $$ · 0.4 mi · ★ 4.6". */
export function metaLine(r: Restaurant, showRating: boolean): string {
	const parts = [r.cuisine, r.price, r.distance].filter(Boolean);
	if (showRating && typeof r.rating === 'number') parts.push(`★ ${r.rating.toFixed(1)}`);
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

/** Deep link to the winner in Google Maps. */
export function mapsUrl(r: Restaurant): string {
	const q = encodeURIComponent(r.name);
	// Mock ids aren't real place ids, so only attach when it looks like one.
	const placeId = r.id.startsWith('m') && r.id.length <= 3 ? '' : `&query_place_id=${r.id}`;
	return `https://www.google.com/maps/search/?api=1&query=${q}${placeId}`;
}
