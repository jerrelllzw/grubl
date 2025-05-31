import { RouteProp, useRoute } from '@react-navigation/native';
import { Button, Layout, Spinner, Text } from '@ui-kitten/components';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { Linking } from 'react-native';
import PlaceCard from '../components/PlaceCard';

interface Coordinates {
	lat: number;
	lng: number;
}

interface Place {
	name?: string;
	rating?: number;
	photoUri?: string;
	lat: number;
	lng: number;
	ratingCount?: number;
	priceLevel?: string;
}

type RouteParams = {
	location: string;
};

async function fetchCoordinates(address: string): Promise<Coordinates> {
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

async function fetchPlaces(lat: number, lng: number): Promise<Place[]> {
	const res = await axios.post(
		'https://places.googleapis.com/v1/places:searchNearby',
		{
			includedTypes: [
				'restaurant',
				'cafe',
				'bar',
				'bakery',
				'fast_food_restaurant',
				'food_court',
				'meal_takeaway',
			],
			maxResultCount: 20,
			locationRestriction: {
				circle: {
					center: { latitude: lat, longitude: lng },
					radius: 100,
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

export default function DeckScreen() {
	const route = useRoute<RouteProp<{ params: RouteParams }, 'params'>>();
	const location = route.params.location;

	const [places, setPlaces] = useState<Place[]>([]);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const load = async () => {
			try {
				const { lat, lng } = await fetchCoordinates(`${location}, Singapore`);
				const placesList = await fetchPlaces(lat, lng);
				setPlaces(placesList);
			} catch (err) {
				console.error('API error:', err);
				setPlaces([]);
			} finally {
				setLoading(false);
			}
		};
		load();
	}, [location]);

	const handleNext = () => {
		if (currentIndex < places.length - 1) setCurrentIndex(currentIndex + 1);
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
				<PlaceCard
					name={current.name}
					rating={current.rating}
					photoUri={current.photoUri}
					ratingCount={current.ratingCount}
					priceLevel={current.priceLevel}
				/>
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
