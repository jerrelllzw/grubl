import { useRoute } from '@react-navigation/native';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import {
	ActivityIndicator,
	Image,
	Linking,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';

const GOOGLE_API_KEY = ''; // Or just use GOOGLE_API_KEY directly in URLs

type Place = {
	name: string;
	rating: number;
	price_level?: number;
	place_id: string;
	photo_reference?: string;
	lat: number;
	lng: number;
};

export default function PlaceScreen() {
	const route = useRoute();
	const { location } = route.params as { location: string };

	const [places, setPlaces] = useState<Place[]>([]);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchCoordinatesAndPlaces = async () => {
			try {
				// Step 1: Geocode address to lat/lng
				const geoRes = await axios.get(
					`https://maps.googleapis.com/maps/api/geocode/json`,
					{
						params: {
							address: location,
							key: GOOGLE_API_KEY,
						},
					}
				);
				console.log('Geocode response:', geoRes.data);

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

				// Step 2: Get nearby restaurants
				const placesRes = await axios.get(
					`https://maps.googleapis.com/maps/api/place/nearbysearch/json`,
					{
						params: {
							location: `${lat},${lng}`,
							radius: 3000,
							type: 'restaurant',
							key: GOOGLE_API_KEY,
						},
					}
				);
				console.log('Places response:', placesRes.data);

				if (
					!placesRes.data.results ||
					!Array.isArray(placesRes.data.results) ||
					placesRes.data.results.length === 0
				) {
					setPlaces([]);
					setLoading(false);
					return;
				}

				const allPlaces = placesRes.data.results.map((place: any) => ({
					name: place.name,
					rating: place.rating,
					price_level: place.price_level,
					place_id: place.place_id,
					lat: place.geometry.location.lat,
					lng: place.geometry.location.lng,
					photo_reference: place.photos?.[0]?.photo_reference,
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
			<View style={styles.center}>
				<ActivityIndicator size='large' />
				<Text>Loading places near &quot;{location}&quot;...</Text>
			</View>
		);
	}

	if (places.length === 0) {
		return (
			<View style={styles.center}>
				<Text>No places found near &quot;{location}&quot;.</Text>
			</View>
		);
	}

	const current = places[currentIndex];

	return (
		<View style={styles.container}>
			<Text style={styles.name}>{current.name}</Text>
			{current.photo_reference && (
				<Image
					style={styles.image}
					source={{
						uri: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${current.photo_reference}&key=${GOOGLE_API_KEY}`,
					}}
				/>
			)}
			<Text style={styles.text}>Rating: {current.rating ?? 'N/A'}</Text>
			<Text style={styles.text}>
				Price: {'$'.repeat(current.price_level ?? 1)}
			</Text>

			<View style={styles.buttonRow}>
				<TouchableOpacity style={styles.button} onPress={handleNext}>
					<Text style={styles.buttonText}>❌</Text>
				</TouchableOpacity>
				<TouchableOpacity
					style={[styles.button, styles.accept]}
					onPress={handleAccept}
				>
					<Text style={styles.buttonText}>✅</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	center: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	container: {
		flex: 1,
		padding: 20,
		justifyContent: 'center',
	},
	name: {
		fontSize: 24,
		fontWeight: '600',
		marginBottom: 12,
		textAlign: 'center',
	},
	image: {
		height: 200,
		borderRadius: 12,
		marginBottom: 12,
	},
	text: {
		fontSize: 16,
		marginBottom: 6,
		textAlign: 'center',
	},
	buttonRow: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		marginTop: 24,
	},
	button: {
		backgroundColor: '#ddd',
		padding: 20,
		borderRadius: 50,
		width: 80,
		alignItems: 'center',
	},
	accept: {
		backgroundColor: '#4CAF50',
	},
	buttonText: {
		fontSize: 24,
	},
});
