import * as Location from 'expo-location';
import { reverseGeocode, type Coordinates } from '../api/googlePlaces';
import { handleError } from '../utils/errorHandler';

// Resolves a position without hanging: a recent cached fix returns instantly;
// otherwise we race a fresh Balanced-accuracy request against a timeout so a
// device that can't get a lock fails cleanly instead of spinning forever.
async function getPositionWithTimeout(timeoutMs: number): Promise<Location.LocationObject> {
	const lastKnown = await Location.getLastKnownPositionAsync({ maxAge: 60000 });
	if (lastKnown) return lastKnown;

	let timer: ReturnType<typeof setTimeout>;
	const timeout = new Promise<never>((_, reject) => {
		timer = setTimeout(() => reject(new Error('Location request timed out')), timeoutMs);
	});
	try {
		return await Promise.race([
			Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
			timeout,
		]);
	} finally {
		clearTimeout(timer!);
	}
}

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

			// getCurrentPositionAsync has no built-in timeout: on a real device that
			// can't get a High-accuracy fix (indoors, weak GPS) it hangs forever and
			// the button sticks on "LOCATING". So: take a cached last-known fix if we
			// have a recent one, otherwise request a fresh Balanced fix (much faster to
			// acquire than High) and give up after a bounded wait rather than hanging.
			const loc = await getPositionWithTimeout(12000);
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
