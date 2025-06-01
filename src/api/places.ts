import axios from 'axios';

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_API_KEY;

export interface Coordinates {
    lat: number;
    lng: number;
}

export interface Place {
    name?: string;
    rating?: number;
    photoUri?: string;
    lat: number;
    lng: number;
    ratingCount?: number;
    priceLevel?: string;
}

export async function fetchCoordinates(address: string): Promise<Coordinates> {
    const res = await axios.get(
        'https://maps.googleapis.com/maps/api/geocode/json',
        {
            params: { address, key: GOOGLE_API_KEY },
        }
    );
    const result = res.data.results?.[0]?.geometry?.location;
    if (!result) throw new Error('No coordinates found');
    return { lat: result.lat, lng: result.lng };
}

export async function fetchPlaces(
    lat: number,
    lng: number,
    types: string[],
    radius: number
): Promise<Place[]> {
    const res = await axios.post(
        'https://places.googleapis.com/v1/places:searchNearby',
        {
            includedTypes: types,
            locationRestriction: {
                circle: {
                    center: { latitude: lat, longitude: lng },
                    radius: radius,
                },
            },
        },
        {
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': GOOGLE_API_KEY,
                'X-Goog-FieldMask': [
                    'places.displayName',
                    'places.rating',
                    'places.id',
                    'places.location',
                    'places.photos',
                    'places.priceLevel',
                    'places.userRatingCount',
                ].join(','),
            },
        }
    );

    return (res.data.places || []).map((place: any) => ({
        name: place.displayName?.text,
        rating: place.rating,
        photoUri: place.photos?.[0]?.name
            ? `https://places.googleapis.com/v1/${place.photos[0].name}/media?maxWidthPx=800&key=${GOOGLE_API_KEY}`
            : undefined,
        lat: place.location.latitude,
        lng: place.location.longitude,
        ratingCount: place.userRatingCount,
        priceLevel: place.priceLevel,
    }));
}