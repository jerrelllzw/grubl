import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { handleError } from '../utils/errorHandler';

const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_API_KEY;

/** Whether live Google Places data is available; when false we fall back to mock. */
export const hasApiKey = Boolean(API_KEY);

// Hidden dev switch: force the bundled mock deck even when a live key is present.
// There's no visible control — it's toggled by tapping the intro wordmark 7×
// (see IntroScreen) — so demos and offline testing don't burn Places quota.
// Persisted so it survives reloads; loaded once at startup via loadForceMock.
const FORCE_MOCK_KEY = 'grubl.forceMockPlaces.v1';
let forceMock = false;

/** True when the app should serve the bundled mock deck instead of live Places. */
export function useMockData(): boolean {
	return !hasApiKey || forceMock;
}

/** Current state of the hidden mock switch (independent of whether a key exists). */
export function isForceMock(): boolean {
	return forceMock;
}

/** Restore the persisted switch state. Call once at app start, before any search. */
export async function loadForceMock(): Promise<void> {
	try {
		forceMock = (await AsyncStorage.getItem(FORCE_MOCK_KEY)) === '1';
	} catch {
		// Ignore — defaults to live data when a key is present.
	}
}

/** Flip the switch and persist it. Returns the new state. */
export async function toggleForceMock(): Promise<boolean> {
	forceMock = !forceMock;
	try {
		await AsyncStorage.setItem(FORCE_MOCK_KEY, forceMock ? '1' : '0');
	} catch {
		// Ignore — the toggle still applies for this session.
	}
	return forceMock;
}

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
	// Optional: the Places response omits primaryType for some establishments, so
	// downstream (emoji/cuisine/hue) must tolerate it being absent.
	primaryType?: string;
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

// Location lookups use the Google Places API (New) — the same pipeline Google
// Maps uses: Autocomplete (New) returns predictions carrying a placeId (not
// coordinates), and Place Details (New) resolves a chosen placeId to its exact
// location. A session token groups the per-keystroke autocomplete calls and the
// final Details call into ONE billed Autocomplete session (the cheapest, intended
// pattern) — mint one per search with `newSessionToken`, reuse it across
// keystrokes, then discard it once a place is resolved.
const PLACES_V1 = 'https://places.googleapis.com/v1';

const googleHeaders = (fieldMask?: string) => ({
	'Content-Type': 'application/json',
	'X-Goog-Api-Key': API_KEY,
	...(fieldMask ? { 'X-Goog-FieldMask': fieldMask } : {}),
});

export interface Suggestion {
	placeId: string;
	/** Bold primary line, e.g. "Marina Bay Sands". */
	mainText: string;
	/** Muted secondary line, e.g. "Bayfront Avenue, Singapore". */
	secondaryText?: string;
	/** Full one-line text — becomes the input value once the prediction is picked. */
	label: string;
}

// A session token is any unique per-session string; Google recommends a UUID v4.
// Not security-sensitive, so Math.random is fine.
export function newSessionToken(): string {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
		const r = (Math.random() * 16) | 0;
		return (ch === 'x' ? r : (r & 0x3) | 0x8).toString(16);
	});
}

function predictionToSuggestion(item: any): Suggestion | null {
	const p = item?.placePrediction;
	if (!p?.placeId) return null;
	const mainText = p.structuredFormat?.mainText?.text;
	const secondaryText = p.structuredFormat?.secondaryText?.text;
	const label = p.text?.text || [mainText, secondaryText].filter(Boolean).join(', ');
	if (!label) return null;
	return { placeId: p.placeId, mainText: mainText || label, secondaryText, label };
}

// Throwing core — callers decide whether a failure is fatal.
async function requestAutocomplete(
	input: string,
	sessionToken?: string,
	bias?: Coordinates
): Promise<Suggestion[]> {
	const body: Record<string, any> = { input };
	if (sessionToken) body.sessionToken = sessionToken;
	// Bias predictions toward a known location (device / last pick) so nearby
	// places surface first, exactly like Maps. Radius is a soft bias, not a limit.
	if (bias) {
		body.locationBias = {
			circle: { center: { latitude: bias.lat, longitude: bias.lng }, radius: 50000 },
		};
	}
	// Autocomplete (New) does not take a field mask — its response shape is fixed.
	const response = await axios.post(`${PLACES_V1}/places:autocomplete`, body, {
		headers: googleHeaders(),
	});
	return (response.data?.suggestions ?? [])
		.map(predictionToSuggestion)
		.filter((s: Suggestion | null): s is Suggestion => s !== null);
}

async function requestPlaceDetails(placeId: string, sessionToken?: string): Promise<Coordinates | null> {
	const response = await axios.get(`${PLACES_V1}/places/${placeId}`, {
		headers: googleHeaders('location'),
		params: sessionToken ? { sessionToken } : undefined,
	});
	const loc = response.data?.location;
	return loc ? { lat: loc.latitude, lng: loc.longitude } : null;
}

// Autocomplete — search-as-you-type predictions. Silent on failure: this fires on
// every keystroke, so a blip just yields no suggestions rather than an alert.
export async function fetchAutoComplete(
	input: string,
	sessionToken?: string,
	bias?: Coordinates
): Promise<Suggestion[]> {
	// Autocomplete stays live even in mock mode: the location field is a real UI to
	// exercise, and only the deck is mocked (searchRestaurants ignores the location
	// then anyway). Gate solely on an actual missing key.
	if (!hasApiKey || !input.trim()) return [];
	try {
		return await requestAutocomplete(input, sessionToken, bias);
	} catch (error: any) {
		handleError(error);
		return [];
	}
}

// Resolve a picked prediction to coordinates. Returns null (not throw) so a failed
// lookup just leaves coords unset and the search falls back to the geocode path.
export async function fetchPlaceDetails(placeId: string, sessionToken?: string): Promise<Coordinates | null> {
	try {
		return await requestPlaceDetails(placeId, sessionToken);
	} catch (error: any) {
		handleError(error);
		return null;
	}
}

// Geocoding fallback — resolve a free-typed place (no prediction picked) by taking
// the top autocomplete prediction and fetching its details, mirroring how Maps
// treats an un-selected query. Returns null when nothing matches; rethrows on a
// network/API failure so the caller can tell "bad location" from "no connection".
//
// Pass the caller's live autocomplete `sessionToken` so the keystrokes the user
// already typed and this resolving Autocomplete + Details call bill as ONE session
// (the cheapest, intended pattern). Only mint a fresh token when the caller has none.
export async function fetchCoordinates(address: string, sessionToken?: string): Promise<Coordinates | null> {
	try {
		const token = sessionToken ?? newSessionToken();
		const [top] = await requestAutocomplete(address, token);
		if (!top) return null;
		return await requestPlaceDetails(top.placeId, token);
	} catch (error: any) {
		handleError(error);
		throw error;
	}
}

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
	openNow: boolean,
	dietaryQuery?: string
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
		// A dietary filter narrows the broad "food" query toward that style, e.g.
		// "vegetarian food"; absent, it stays the default broad search.
		textQuery: dietaryQuery ? `${dietaryQuery} ${FOOD_QUERY}` : FOOD_QUERY,
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

	// Pushing price server-side excludes places that have no price data. Any
	// non-empty selection is a deliberate price choice — including all four tiers,
	// which the user reaches by opting in tier by tier — so we constrain whenever
	// at least one tier is selected. Empty means "any price": omit the filter.
	if (priceLevels.length > 0) body.priceLevels = priceLevels;

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
