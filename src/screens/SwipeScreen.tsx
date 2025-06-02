import { RouteProp, useRoute } from '@react-navigation/native';
import { Button, Layout, Spinner, Text } from '@ui-kitten/components';
import React, { useEffect, useState } from 'react';
import { Linking, StyleSheet } from 'react-native';
import { fetchCoordinates, fetchPlaces, Place } from '../api/googlePlaces';
import PlaceCard from '../components/PlaceCard';
import { handleError } from '../utils/errorHandler';

type RouteParams = {
	location: string;
	radius: number;
	placeTypes: string[];
};

export default function SwipeScreen() {
	const route = useRoute<RouteProp<{ params: RouteParams }, 'params'>>();
	const { location, radius, placeTypes } = route.params;

	const [places, setPlaces] = useState<Place[]>([]);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const load = async () => {
			try {
				const coords = await fetchCoordinates(`${location}, Singapore`);
				if (!coords) {
					setPlaces([]);
					return;
				}
				const placesList = await fetchPlaces(coords.lat, coords.lng, radius, placeTypes);
				setPlaces(placesList);
			} catch (err) {
				handleError(err, 'An error occurred while loading places.');
				setPlaces([]);
			} finally {
				setLoading(false);
			}
		};
		load();
	}, [location, radius, placeTypes]);

	const handleNext = () => {
		setCurrentIndex((idx) => Math.min(idx + 1, places.length - 1));
	};

	const handleAccept = () => {
		const place = places[currentIndex];
		if (place) {
			const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`;
			Linking.openURL(mapsUrl);
		}
	};

	if (loading) {
		return (
			<Layout style={styles.loadingContainer}>
				<Spinner size='giant' />
				<Text style={styles.loadingText}>Loading places near &quot;{location}&quot;...</Text>
			</Layout>
		);
	}

	const current = places[currentIndex];

	return (
		<Layout style={styles.container}>
			{current ? (
				<PlaceCard {...current} />
			) : (
				<Text category='h6' style={styles.noPlacesText}>
					No places found.
				</Text>
			)}
			<Layout style={styles.buttonRow}>
				<Button
					appearance='outline'
					status='danger'
					style={styles.rejectButton}
					onPress={handleNext}
					disabled={currentIndex >= places.length - 1}
				>
					❌
				</Button>
				<Button status='success' style={styles.acceptButton} onPress={handleAccept} disabled={!current}>
					✔️
				</Button>
			</Layout>
		</Layout>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 20,
		justifyContent: 'center',
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	loadingText: {
		marginTop: 16,
	},
	noPlacesText: {
		textAlign: 'center',
	},
	buttonRow: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		marginTop: 24,
		backgroundColor: 'transparent',
	},
	rejectButton: {
		flex: 1,
		marginRight: 8,
	},
	acceptButton: {
		flex: 1,
		marginLeft: 8,
	},
});
