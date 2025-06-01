import * as Location from 'expo-location';

export function useCurrentLocation(setLocation: (loc: string) => void) {
    return async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                alert('Permission to access location was denied');
                return;
            }
            const loc = await Location.getCurrentPositionAsync({});
            const geocode = await Location.reverseGeocodeAsync({
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
            });
            if (geocode.length > 0) {
                const { name, street, city, region } = geocode[0];
                const locationString = [name, street, city, region]
                    .filter(Boolean)
                    .join(', ');
                setLocation(locationString);
            } else {
                alert('Could not determine address from location');
            }
        } catch {
            alert('Failed to get current location');
        }
    };
}