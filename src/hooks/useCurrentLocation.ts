import * as Location from 'expo-location';
import { type Coordinates } from '../api/googlePlaces';
import { handleError } from '../utils/errorHandler';

// Bound the fresh-fix wait so a weak signal can't hang the button forever.
const FRESH_TIMEOUT_MS = 5000;

// Coords → human label using expo-location's built-in reverse geocoder (the OS
// geocoder — Apple on iOS, Google Play Services on Android). No third-party HTTP
// call, so it's typically faster and more reliable than hitting a public server.
async function reverseGeocodeDevice(coords: Coordinates): Promise<string | null> {
	try {
		const [place] = await Location.reverseGeocodeAsync({
			latitude: coords.lat,
			longitude: coords.lng,
		});
		if (!place) return null;
		const primary = place.name || place.street || place.district || place.city;
		const secondary = place.city && place.city !== primary ? place.city : place.region;
		return [primary, secondary].filter(Boolean).join(', ') || null;
	} catch (error) {
		handleError(error);
		return null;
	}
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
	let timer: ReturnType<typeof setTimeout>;
	const timeout = new Promise<never>((_, reject) => {
		timer = setTimeout(() => reject(new Error('Location request timed out')), ms);
	});
	return Promise.race([promise, timeout]).finally(() => clearTimeout(timer)) as Promise<T>;
}

// One fresh fix, bounded so a weak signal can't hang the button forever. Balanced
// accuracy (~city block) acquires far faster than High and is plenty for a radius
// search.
async function getPosition(): Promise<Location.LocationObject> {
	return withTimeout(
		Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
		FRESH_TIMEOUT_MS
	);
}

// Resolves the device's current position to both a human-readable label and the
// exact coordinates, so callers can search without a second geocoding round-trip.
// Permission, GPS, and the coords→label step all come from the OS (expo-location).
export function useCurrentLocation(
	onResolved: (label: string, coords: Coordinates) => void,
	onError?: (message: string) => void
) {
	return async () => {
		try {
			// Location being switched off at the OS level is a different failure from
			// the app lacking permission — check it first so the message is honest.
			const servicesOn = await Location.hasServicesEnabledAsync();
			if (!servicesOn) {
				onError?.('Location is off on your device. Turn it on, or type an address.');
				throw new Error('Location services disabled');
			}

			const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
			if (status !== 'granted') {
				// `canAskAgain === false` (Android "Don't ask again" / iOS denied) means
				// the OS won't prompt again — point the user at Settings instead.
				onError?.(
					canAskAgain
						? 'Location access is off. Allow it, or type an address instead.'
						: 'Location is blocked in Settings. Enable it there, or type an address.'
				);
				throw new Error('Permission denied');
			}

			const loc = await getPosition();
			const coords: Coordinates = {
				lat: loc.coords.latitude,
				lng: loc.coords.longitude,
			};

			// We have valid coordinates either way; the label is just for display, so
			// fall back to a generic one rather than failing the whole lookup.
			const label = (await reverseGeocodeDevice(coords)) ?? 'Current location';
			onResolved(label, coords);
		} catch (error) {
			handleError(error);
			onError?.('Couldn’t pin down your location. Try again, or type an address.');
			throw error;
		}
	};
}
