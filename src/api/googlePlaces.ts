import axios from 'axios';
import { FOOD_AND_DRINK_TYPES } from '../constants/googlePlaces';
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

const calculateDistance = (point1: Coordinates, point2: Coordinates): string => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLon = (point2.lng - point1.lng) * Math.PI / 180;

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(point1.lat * Math.PI / 180) *
        Math.cos(point2.lat * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = R * c;

    if (distanceKm < 1) {
        return `${Math.round(distanceKm * 1000)}m`;
    } else {
        return `${distanceKm.toFixed(1)}km`;
    }
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

// Nearby Search
export async function fetchPlaces(
    latitude: number,
    longitude: number,
    categories: string[],
    excluded: string[],
    radius: number,
    priceLevels: string[],
    openNow: boolean
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
            'places.priceLevel',
            'places.userRatingCount',
            'places.primaryType',
            'places.currentOpeningHours'
        ].join(','),
    };
    const body = {
        includedTypes: categories,
        excludedTypes: excluded,
        locationRestriction: {
            circle: {
                center: { latitude, longitude },
                radius,
            },
        },
    };
    try {
        const response = await axios.post(url, body, { headers });
        return (response.data.places || [])
            .filter((place: any) => FOOD_AND_DRINK_TYPES.includes(place.primaryType))
            .filter((place: any) => place.priceLevel === undefined || place.priceLevel === 'PRICE_LEVEL_FREE' || priceLevels.includes(place.priceLevel))
            .filter((place: any) => !openNow || place?.currentOpeningHours?.openNow)
            .map((place: any) => {
                return {
                    id: place.id,
                    name: place.displayName?.text ?? undefined,
                    rating: place.rating ?? undefined,
                    ratingCount: place.userRatingCount ?? undefined,
                    priceLevel: place.priceLevel ?? undefined,
                    primaryType: place.primaryType ?? undefined,
                    distance: place.location
                        ? calculateDistance(
                              { lat: place.location.latitude, lng: place.location.longitude },
                              { lat: latitude, lng: longitude }
                          )
                        : undefined,
                };
            });
    } catch (error: any) {
        handleError(error, 'Failed to fetch places.');
        return [];
    }
}
