import * as Location from 'expo-location';
import { type Coordinates } from '../api/googlePlaces';
import { handleError } from '../utils/errorHandler';

// A recent-enough cached fix is instant and plenty accurate for a "restaurants
// near me" radius — no need to spin up a fresh GPS lock for a position that's a
// few minutes old.
const RECENT_MAX_AGE_MS = 5 * 60 * 1000;
// Bound the fresh-fix wait so a weak signal can't hang the button forever.
const FRESH_TIMEOUT_MS = 10000;

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

// Resolve a position via a fallback chain rather than one all-or-nothing attempt,
// so we almost always return *something* usable fast:
//   1. a recent cached fix        → instant
//   2. a fresh fix (bounded wait) → a second or two
//   3. any last-known fix, stale  → still finds nearby food
// Only if every step comes up empty do we fail.
async function getPosition(): Promise<Location.LocationObject> {
	const recent = await Location.getLastKnownPositionAsync({ maxAge: RECENT_MAX_AGE_MS });
	if (recent) return recent;

	try {
		// Balanced accuracy (~city block) acquires far faster and more reliably than
		// High, and it's plenty for a radius search.
		return await withTimeout(
			Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
			FRESH_TIMEOUT_MS
		);
	} catch (error) {
		handleError(error);
		// Fresh fix timed out or failed — a slightly old position still works.
		const stale = await Location.getLastKnownPositionAsync();
		if (stale) return stale;
		throw error instanceof Error ? error : new Error('Location unavailable');
	}
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
				return Promise.reject(new Error('Location services disabled'));
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
				return Promise.reject(new Error('Permission denied'));
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
			return Promise.resolve(label);
		} catch (error) {
			handleError(error);
			onError?.('Couldn’t pin down your location. Try again, or type an address.');
			return Promise.reject(error);
		}
	};
}
