import * as Location from 'expo-location';
import { reverseGeocode, type Coordinates } from '../api/googlePlaces';
import { handleError } from '../utils/errorHandler';

// Resolves the device's current position to both a human-readable label and the
// exact coordinates, so callers can search without a second geocoding round-trip.
// Permission + GPS come from the OS (expo-location); the coords→label step uses
// Photon/OSM, matching the autocomplete source so labels read consistently.
export function useCurrentLocation(
	onResolved: (label: string, coords: Coordinates) => void,
	onError?: (message: string) => void
) {
	return async () => {
		try {
			const { status } = await Location.requestForegroundPermissionsAsync();
			if (status !== 'granted') {
				onError?.('Location access is off. Turn it on, or type an address instead.');
				return Promise.reject(new Error('Permission denied'));
			}

			const loc = await Location.getCurrentPositionAsync({
				accuracy: Location.Accuracy.High,
			});
			const coords: Coordinates = {
				lat: loc.coords.latitude,
				lng: loc.coords.longitude,
			};

			// We have valid coordinates either way; the label is just for display, so
			// fall back to a generic one rather than failing the whole lookup.
			const label = (await reverseGeocode(coords)) ?? 'Current location';
			onResolved(label, coords);
			return Promise.resolve(label);
		} catch (error) {
			handleError(error);
			onError?.('Couldn’t pin down your location. Try again, or type an address.');
			return Promise.reject(error);
		}
	};
}
