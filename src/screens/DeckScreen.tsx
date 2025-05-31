import { useRoute } from '@react-navigation/native';
import { Button, Layout, Spinner, Text } from '@ui-kitten/components';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { Image, Linking } from 'react-native';


type Place = {
	name: string;
	rating: number;
	price_level?: number;
	photo?: string;
	lat?: number;
	lng?: number;
};

export default function DeckScreen() {
	const route = useRoute();
	const { location } = route.params as { location: string };

	const [places, setPlaces] = useState<Place[]>([]);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchCoordinatesAndPlaces = async () => {
			try {
				const geoRes = await axios.get(
					`https://maps.googleapis.com/maps/api/geocode/json`,
					{
						params: {
							address: location,
							key: GOOGLE_API_KEY,
						},
					}
				);

				if (
					!geoRes.data.results ||
					geoRes.data.results.length === 0 ||
					!geoRes.data.results[0].geometry
				) {
					setPlaces([]);
					setLoading(false);
					return;
				}

				const { lat, lng } = geoRes.data.results[0].geometry.location;

				const placesRes = await axios.post(
					'https://places.googleapis.com/v1/places:searchNearby',
					{
						includedTypes: [
							'restaurant',
							'cafe',
							'bakery',
							'bar',
							'meal_takeaway',
							'meal_delivery',
						],
						maxResultCount: 10,
						locationRestriction: {
							circle: {
								center: {
									latitude: lat,
									longitude: lng,
								},
								radius: 1000,
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
								'places.priceLevel',
								'places.id',
								'places.location',
								'places.photos',
							].join(','),
						},
					}
				);

				if (
					!placesRes.data.places ||
					!Array.isArray(placesRes.data.places) ||
					placesRes.data.places.length === 0
				) {
					setPlaces([]);
					setLoading(false);
					return;
				}

				const allPlaces = placesRes.data.places.map((place: any) => ({
					name: place.displayName?.text,
					rating: place.rating,
					price_level: place.priceLevel,
					photo: place.photos?.[0]?.name,
					lat: place.location?.latitude,
					lng: place.location?.longitude,
				}));

				setPlaces(allPlaces);
				setLoading(false);
			} catch (err) {
				console.error('API error:', err);
				setPlaces([]);
				setLoading(false);
			}
		};

		fetchCoordinatesAndPlaces();
	}, [location]);

	const handleNext = () => {
		if (currentIndex < places.length - 1) {
			setCurrentIndex(currentIndex + 1);
		}
	};

	const handleAccept = () => {
		const place = places[currentIndex];
		const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`;
		Linking.openURL(mapsUrl);
	};

	if (loading) {
		return (
			<Layout
				style={{
					flex: 1,
					justifyContent: 'center',
					alignItems: 'center',
				}}
			>
				<Spinner size='giant' />
				<Text style={{ marginTop: 16 }}>
					Loading places near &quot;{location}&quot;...
				</Text>
			</Layout>
		);
	}

	if (places.length === 0) {
		return (
			<Layout
				style={{
					flex: 1,
					justifyContent: 'center',
					alignItems: 'center',
				}}
			>
				<Text>No places found near &quot;{location}&quot;.</Text>
			</Layout>
		);
	}

	const current = places[currentIndex];
	const photoUrl = current.photo
		? `https://places.googleapis.com/v1/${current.photo}/media?maxWidthPx=400&key=${GOOGLE_API_KEY}`
		: undefined;

	return (
		<Layout
			style={{
				flex: 1,
				padding: 20,
				justifyContent: 'center',
			}}
		>
			<Text category='h5' style={{ textAlign: 'center', marginBottom: 12 }}>
				{current.name}
			</Text>
			{current.photo && (
				<Image
					style={{
						height: 200,
						borderRadius: 12,
						marginBottom: 12,
						width: '100%',
					}}
					source={{ uri: photoUrl }}
				/>
			)}
			<Text style={{ fontSize: 16, marginBottom: 6, textAlign: 'center' }}>
				Rating: {current.rating ?? 'N/A'}
			</Text>
			<Text style={{ fontSize: 16, marginBottom: 6, textAlign: 'center' }}>
				Price: {'$'.repeat(current.price_level ?? 1)}
			</Text>
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
				>
					❌
				</Button>
				<Button
					status='success'
					style={{ flex: 1, marginLeft: 8 }}
					onPress={handleAccept}
				>
					✅
				</Button>
			</Layout>
		</Layout>
	);
}
