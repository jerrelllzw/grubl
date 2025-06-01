import { RouteProp, useRoute } from '@react-navigation/native';
import { Button, Layout, Spinner, Text } from '@ui-kitten/components';
import React, { useEffect, useState } from 'react';
import { Linking } from 'react-native';
import { fetchCoordinates, fetchPlaces, Place } from '../api/places';
import PlaceCard from '../components/PlaceCard';

type RouteParams = {
	location: string;
	types: string[];
	radius: number;
};

export default function DeckScreen() {
	const route = useRoute<RouteProp<{ params: RouteParams }, 'params'>>();
	const { location, types, radius } = route.params;

	const [places, setPlaces] = useState<Place[]>([]);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const load = async () => {
			try {
				const { lat, lng } = await fetchCoordinates(`${location}, Singapore`);
				const placesList = await fetchPlaces(lat, lng, types, radius);
				setPlaces(placesList);
			} catch (err) {
				console.error('API error:', err);
				setPlaces([]);
			} finally {
				setLoading(false);
			}
		};
		load();
	}, [location, radius, types]);

	const handleNext = () => {
		setCurrentIndex((idx) => Math.min(idx + 1, places.length - 1));
	};

	const handleAccept = () => {
		const place = places[currentIndex];
		if (place) {
			const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`;
			Linking.openURL(mapsUrl);
		}
	};

	if (loading) {
		return (
			<Layout
				style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
			>
				<Spinner size='giant' />
				<Text style={{ marginTop: 16 }}>
					Loading places near &quot;{location}&quot;...
				</Text>
			</Layout>
		);
	}

	const current = places[currentIndex];

	return (
		<Layout style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
			{current ? (
				<PlaceCard {...current} />
			) : (
				<Text category='h6' style={{ textAlign: 'center' }}>
					No places found.
				</Text>
			)}
			<Layout
				style={{
					flexDirection: 'row',
					justifyContent: 'space-around',
					marginTop: 24,
					backgroundColor: 'transparent',
				}}
			>
				<Button
					appearance='outline'
					status='danger'
					style={{ flex: 1, marginRight: 8 }}
					onPress={handleNext}
					disabled={currentIndex >= places.length - 1}
				>
					❌
				</Button>
				<Button
					status='success'
					style={{ flex: 1, marginLeft: 8 }}
					onPress={handleAccept}
					disabled={!current}
				>
					✔️
				</Button>
			</Layout>
		</Layout>
	);
}
