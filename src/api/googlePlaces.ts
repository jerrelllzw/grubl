import axios from 'axios';
import { handleError } from '../utils/errorHandler';

const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_API_KEY;

/** Whether live Google Places data is available; when false we fall back to mock. */
export const hasApiKey = Boolean(API_KEY);

export interface Coordinates {
	lat: number;
	lng: number;
}

export interface Place {
	id: string;
	name?: string;
	rating?: number;
	ratingCount?: number;
	priceLevel?: string;
	primaryType: string;
	distance?: string;
	address?: string;
}

// Straight-line distance between two points, in metres.
const distanceInMetres = (point1: Coordinates, point2: Coordinates): number => {
	const R = 6371000; // Earth's radius in metres
	const dLat = ((point2.lat - point1.lat) * Math.PI) / 180;
	const dLon = ((point2.lng - point1.lng) * Math.PI) / 180;

	const a =
		Math.sin(dLat / 2) ** 2 +
		Math.cos((point1.lat * Math.PI) / 180) * Math.cos((point2.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;

	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return R * c;
};

const formatDistance = (metres: number): string =>
	metres < 1000 ? `${Math.round(metres)} m` : `${(metres / 1000).toFixed(1)} km`;

// NOTE: restaurant photos are intentionally not fetched — the Places "photos"
// field and the Place Photo media endpoint are separately billed. Cards use the
// striped placeholder instead. Re-add `places.photos` to the field mask + a
// media-URL helper if that changes.

// Grubl deliberately doesn't ask what you're craving — the whole point is that it
// decides for you — so the search is always the broad "food nearby".
const FOOD_QUERY = 'food';

// Location lookups (autocomplete + geocoding) use Photon — Komoot's free,
// key-less search-as-you-type service over OpenStreetMap data. Photon returns
// coordinates inline, so a picked suggestion needs no separate geocoding call.
// Data © OpenStreetMap contributors.
const PHOTON_URL = 'https://photon.komoot.io/api/';

export interface Suggestion {
	label: string;
	coords: Coordinates;
}

// Builds a readable one-line label from a Photon feature's properties, dropping
// blanks and consecutive duplicates (e.g. a city named the same as its region).
function photonLabel(props: Record<string, any>): string {
	const primary = props.name || [props.housenumber, props.street].filter(Boolean).join(' ');
	const out: string[] = [];
	for (const part of [primary, props.city, props.state, props.country]) {
		if (part && out[out.length - 1] !== part) out.push(part);
	}
	return out.join(', ');
}

// A Photon feature is GeoJSON: geometry.coordinates is [lon, lat].
function photonToSuggestion(feature: any): Suggestion | null {
	const coordinates = feature?.geometry?.coordinates;
	if (!Array.isArray(coordinates) || coordinates.length < 2) return null;
	const label = photonLabel(feature.properties ?? {});
	if (!label) return null;
	return { label, coords: { lat: coordinates[1], lng: coordinates[0] } };
}

// Geocoding — resolve a free-typed place to coordinates. Returns null when the
// place can't be found; the caller surfaces a "couldn't find that place" screen.
export async function fetchCoordinates(address: string): Promise<Coordinates | null> {
	try {
		const response = await axios.get(PHOTON_URL, { params: { q: address, limit: 1 } });
		const suggestion = photonToSuggestion(response.data?.features?.[0]);
		return suggestion?.coords ?? null;
	} catch (error: any) {
		// A network/geocoder failure is not the same as "place not found" (which
		// returns null above): rethrow so the caller can show a connectivity error
		// instead of the misleading "WHERE'S THAT?" screen.
		handleError(error);
		throw error;
	}
}

// Autocomplete — search-as-you-type suggestions, each carrying its coordinates.
export async function fetchAutoComplete(input: string): Promise<Suggestion[]> {
	try {
		const response = await axios.get(PHOTON_URL, { params: { q: input, limit: 5 } });
		return (response.data?.features ?? [])
			.map(photonToSuggestion)
			.filter((s: Suggestion | null): s is Suggestion => s !== null);
	} catch (error: any) {
		// Silent on failure — this fires on every keystroke; no alert spam.
		handleError(error);
		return [];
	}
}

const ALL_PRICE_LEVELS = [
	'PRICE_LEVEL_INEXPENSIVE',
	'PRICE_LEVEL_MODERATE',
	'PRICE_LEVEL_EXPENSIVE',
	'PRICE_LEVEL_VERY_EXPENSIVE',
];

// A short, decisive deck: too many cards fatigues the swiper and pressures them to
// grind through everything, and relevance-ranked results this far down are weaker
// anyway. Cap the deck and stop paging once we've filled it. One page (20) usually
// covers it; a second is a safety top-up when the radius filter trims the first.
const DECK_LIMIT = 15;
const MAX_PAGES = 2; // Text Search returns up to 20 per page.

// Text Search. Builds a deeper, more relevant deck than Nearby Search: it ranks
// by relevance to the craving, filters price/open-now server-side, and paginates.
export async function fetchPlaces(
	latitude: number,
	longitude: number,
	radius: number,
	priceLevels: string[],
	openNow: boolean
): Promise<Place[]> {
	const url = 'https://places.googleapis.com/v1/places:searchText';
	const headers = {
		'Content-Type': 'application/json',
		'X-Goog-Api-Key': API_KEY,
		// formattedAddress is a "Pro" field — no extra cost here since rating /
		// priceLevel / userRatingCount already put this call in the Enterprise SKU.
		'X-Goog-FieldMask': [
			'places.displayName',
			'places.rating',
			'places.id',
			'places.location',
			'places.priceLevel',
			'places.userRatingCount',
			'places.primaryType',
			'places.formattedAddress',
			'nextPageToken',
		].join(','),
	};

	const body: Record<string, any> = {
		textQuery: FOOD_QUERY,
		locationBias: {
			circle: {
				center: { latitude, longitude },
				radius,
			},
		},
		pageSize: 20,
	};

	// Only constrain open-now when the user wants it on; the API treats a `false`
	// as "no filter" anyway, so we just omit it.
	if (openNow) body.openNow = true;

	// Pushing price server-side excludes places that have no price data, so only
	// do it when the user has actually narrowed from "any price".
	const narrowedPrice = priceLevels.length > 0 && priceLevels.length < ALL_PRICE_LEVELS.length;
	if (narrowedPrice) body.priceLevels = priceLevels;

	const origin: Coordinates = { lat: latitude, lng: longitude };
	const seen = new Set<string>();
	const places: Place[] = [];

	try {
		let pageToken: string | undefined;
		for (let page = 0; page < MAX_PAGES; page++) {
			const response = await axios.post(url, pageToken ? { ...body, pageToken } : body, { headers });

			for (const place of response.data.places ?? []) {
				if (!place.id || seen.has(place.id)) continue;
				seen.add(place.id);

				const coords = place.location
					? { lat: place.location.latitude, lng: place.location.longitude }
					: undefined;
				// locationBias can spill beyond the circle; keep the deck honest.
				if (coords && distanceInMetres(coords, origin) > radius) continue;

				places.push({
					id: place.id,
					name: place.displayName?.text ?? undefined,
					rating: place.rating ?? undefined,
					ratingCount: place.userRatingCount ?? undefined,
					priceLevel: place.priceLevel ?? undefined,
					primaryType: place.primaryType ?? undefined,
					distance: coords ? formatDistance(distanceInMetres(coords, origin)) : undefined,
					address: place.formattedAddress ?? undefined,
				});
			}

			pageToken = response.data.nextPageToken;
			if (!pageToken || places.length >= DECK_LIMIT) break;
		}
		return places.slice(0, DECK_LIMIT);
	} catch (error: any) {
		// Rethrow so searchRestaurants can show a distinct "couldn't reach the
		// kitchen" state rather than a false "nothing matched your search".
		handleError(error);
		throw error;
	}
}
