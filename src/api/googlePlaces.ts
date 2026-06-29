import axios from 'axios';
import { CRAVING_BY_KEY } from '../constants/googlePlaces';
import { handleError } from '../utils/errorHandler';

const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_API_KEY;

if (!API_KEY) {
    handleError('Missing Google API Key', 'Google API Key is missing. Please check your configuration.');
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
    primaryType: string;
    distance?: string;
}

// Straight-line distance between two points, in metres.
const distanceInMetres = (point1: Coordinates, point2: Coordinates): number => {
    const R = 6371000; // Earth's radius in metres
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLon = (point2.lng - point1.lng) * Math.PI / 180;

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(point1.lat * Math.PI / 180) *
        Math.cos(point2.lat * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const formatDistance = (metres: number): string =>
    metres < 1000 ? `${Math.round(metres)}m` : `${(metres / 1000).toFixed(1)}km`;

// Turns the chosen cravings into a single natural-language query. Text Search
// matches on cuisine words, so this surfaces more relevant places than the
// exact `primaryType` matching that Nearby Search is limited to.
const buildFoodQuery = (cravings: string[]): string => {
    const terms = cravings
        .map((key) => CRAVING_BY_KEY[key]?.term)
        .filter((term): term is string => Boolean(term));
    return terms.length ? terms.join(', ') : 'restaurants and places to eat';
};

// Geocoding
export async function fetchCoordinates(address: string): Promise<Coordinates | null> {
    try {
        const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
            params: { address, key: API_KEY },
        });
        const location = response.data?.results?.[0]?.geometry?.location;
        if (!location) {
            handleError('No coordinates found', 'Could not find coordinates for the provided address.');
            return null;
        }
        return { lat: location.lat, lng: location.lng };
    } catch (error: any) {
        handleError(error, 'Failed to fetch coordinates.');
        return null;
    }
}

// Autocomplete
export async function fetchAutoComplete(input: string): Promise<string[]> {
    const url = 'https://places.googleapis.com/v1/places:autocomplete';
    const headers = {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': API_KEY,
    };
    const body = {
        input: input,
    };
    try {
        const response = await axios.post(url, body, { headers });
        return (response.data?.suggestions ?? [])
            .map((suggestion: any) => suggestion?.placePrediction?.text?.text)
            .filter((text: unknown): text is string => typeof text === 'string');
    } catch (error: any) {
        handleError(error, 'Failed to fetch autocomplete suggestions.');
        return [];
    }
}

const ALL_PRICE_LEVELS = [
    'PRICE_LEVEL_INEXPENSIVE',
    'PRICE_LEVEL_MODERATE',
    'PRICE_LEVEL_EXPENSIVE',
    'PRICE_LEVEL_VERY_EXPENSIVE',
];

const MAX_PAGES = 3; // Text Search returns up to 20 per page → up to 60 places.

// Text Search. Builds a deeper, more relevant deck than Nearby Search: it ranks
// by relevance to the craving, filters price/open-now server-side, and paginates.
export async function fetchPlaces(
    latitude: number,
    longitude: number,
    cravings: string[],
    radius: number,
    priceLevels: string[],
    openNow: boolean
): Promise<Place[]> {
    const url = 'https://places.googleapis.com/v1/places:searchText';
    const headers = {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': API_KEY,
        'X-Goog-FieldMask': [
            'places.displayName',
            'places.rating',
            'places.id',
            'places.location',
            'places.priceLevel',
            'places.userRatingCount',
            'places.primaryType',
            'nextPageToken',
        ].join(','),
    };

    const body: Record<string, any> = {
        textQuery: buildFoodQuery(cravings),
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
    const narrowedPrice =
        priceLevels.length > 0 && priceLevels.length < ALL_PRICE_LEVELS.length;
    if (narrowedPrice) body.priceLevels = priceLevels;

    const origin: Coordinates = { lat: latitude, lng: longitude };
    const seen = new Set<string>();
    const places: Place[] = [];

    try {
        let pageToken: string | undefined;
        for (let page = 0; page < MAX_PAGES; page++) {
            const response = await axios.post(
                url,
                pageToken ? { ...body, pageToken } : body,
                { headers }
            );

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
                });
            }

            pageToken = response.data.nextPageToken;
            if (!pageToken) break;
        }
        return places;
    } catch (error: any) {
        handleError(error, 'Failed to fetch places.');
        return [];
    }
}
