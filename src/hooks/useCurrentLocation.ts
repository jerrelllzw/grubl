import * as Location from 'expo-location';
import type { Coordinates } from '../api/googlePlaces';
import { handleError } from '../utils/errorHandler';

// Resolves the device's current position to both a human-readable label and the
// exact coordinates, so callers can search without a second geocoding round-trip.
export function useCurrentLocation(
    onResolved: (label: string, coords: Coordinates) => void
) {
    return async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                handleError('Permission denied', 'Permission to access location was denied');
                return Promise.reject(new Error('Permission denied'));
            }

            const loc = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });
            const coords: Coordinates = {
                lat: loc.coords.latitude,
                lng: loc.coords.longitude,
            };

            const geocode = await Location.reverseGeocodeAsync({
                latitude: coords.lat,
                longitude: coords.lng,
            });

            if (geocode.length > 0) {
                const { name, street, city, region } = geocode[0];
                const label = [name, street, city, region].filter(Boolean).join(', ');
                onResolved(label, coords);
                return Promise.resolve(label);
            } else {
                handleError('No geocode result', 'Could not determine address from location');
                return Promise.reject(new Error('No geocode result'));
            }
        } catch (error) {
            handleError(error, 'Failed to get current location');
            return Promise.reject(error);
        }
    };
}
