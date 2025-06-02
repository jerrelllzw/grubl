import axios from 'axios';
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
    name?: string;
    rating?: number;
    photoUri?: string;
    latitude: number;
    longitude: number;
    ratingCount?: number;
    priceLevel?: string;
}

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

// Nearby Search
export async function fetchPlaces(
    latitude: number,
    longitude: number,
    radius: number,
    types: string[],
): Promise<Place[]> {
    const url = 'https://places.googleapis.com/v1/places:searchNearby';
    const headers = {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': API_KEY,
        'X-Goog-FieldMask': [
            'places.displayName',
            'places.rating',
            'places.id',
            'places.location',
            'places.photos',
            'places.priceLevel',
            'places.userRatingCount',
        ].join(','),
    };
    const body = {
        includedTypes: types,
        locationRestriction: {
            circle: {
                center: { latitude, longitude },
                radius,
            },
        },
    };
    try {
        const response = await axios.post(url, body, { headers });
        return (response.data.places || []).map((place: any) => {
            const photoName = place.photos?.[0]?.name;
            const photoUri = photoName
                ? `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=800&key=${API_KEY}`
                : undefined;
            return {
                name: place.displayName?.text || '',
                rating: place.rating ?? undefined,
                photoUri,
                latitude: place.location?.latitude,
                longitude: place.location?.longitude,
                ratingCount: place.userRatingCount ?? undefined,
                priceLevel: place.priceLevel ?? undefined,
            };
        });
    } catch (error: any) {
        handleError(error, 'Failed to fetch places.');
        return [];
    }
}
