import { RouteProp, useRoute } from '@react-navigation/native';
import { Layout, Spinner, Text } from '@ui-kitten/components';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, Image, Linking, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Swiper, type SwiperCardRefType } from 'rn-swiper-list';
import { fetchCoordinates, fetchPlaces, Place } from '../api/googlePlaces';
import { handleError } from '../utils/errorHandler';

const CARD_BORDER_RADIUS = 15;

type RouteParams = {
	location: string;
	radius: number;
	placeTypes: string[];
};

function priceLevelToDollarSigns(level?: string) {
	switch (level) {
		case 'PRICE_LEVEL_FREE':
			return 'Free';
		case 'PRICE_LEVEL_INEXPENSIVE':
			return '$';
		case 'PRICE_LEVEL_MODERATE':
			return '$$';
		case 'PRICE_LEVEL_EXPENSIVE':
			return '$$$';
		case 'PRICE_LEVEL_VERY_EXPENSIVE':
			return '$$$$';
		default:
			return '';
	}
}

const { width, height } = Dimensions.get('window');

export default function SwipeScreen() {
	const route = useRoute<RouteProp<{ params: RouteParams }, 'params'>>();
	const { location, radius, placeTypes } = route.params;

	const [places, setPlaces] = useState<Place[]>([]);
	const [loading, setLoading] = useState(true);

	const swiperRef = useRef<SwiperCardRefType>(null);

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

	const renderCard = useCallback(
		(place: Place) => (
			<Layout style={styles.cardStyle}>
				<Image source={place.photoUri ? { uri: place.photoUri } : undefined} style={styles.image} />
				<Text category='h6'>{place.name || 'No name provided'}</Text>
				<Text appearance='hint'>
					{place.rating !== undefined ? `${place.rating} ⭐` : 'No ratings yet'}
					{place.ratingCount !== undefined ? ` (${place.ratingCount})` : ''}
				</Text>
				<Text appearance='hint'>{priceLevelToDollarSigns(place.priceLevel)}</Text>
			</Layout>
		),
		[]
	);

	const OverlayLabel = ({ color }: { color: string }) => (
		<View style={[styles.overlayLabelContainer, { backgroundColor: color }]} />
	);

	const handleAccept = useCallback(
		(cardIndex: number) => {
			const place = places[cardIndex];
			if (place) {
				const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`;
				Linking.openURL(mapsUrl);
			}
		},
		[places]
	);

	if (loading) {
		return (
			<Layout style={[styles.container, { gap: 16 }]}>
				<Spinner size='giant' />
				<Text>Loading places near &quot;{location}&quot;...</Text>
			</Layout>
		);
	}

	if (!places.length) {
		return (
			<Layout style={styles.container}>
				<Text category='h6'>No places found.</Text>
			</Layout>
		);
	}

	return (
		<GestureHandlerRootView style={styles.container}>
			<Layout style={styles.container}>
				<Swiper
					ref={swiperRef}
					data={places}
					renderCard={renderCard}
					onSwipeRight={handleAccept}
					OverlayLabelRight={() => <OverlayLabel color='green' />}
					OverlayLabelLeft={() => <OverlayLabel color='red' />}
					OverlayLabelTop={() => <OverlayLabel color='blue' />}
				/>
			</Layout>
		</GestureHandlerRootView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
	},
	overlayLabelContainer: {
		width: '100%',
		height: '100%',
		borderRadius: CARD_BORDER_RADIUS,
	},
	cardStyle: {
		width: width * 0.9,
		height: height * 0.8,
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: CARD_BORDER_RADIUS,
		padding: 16,
		elevation: 2,
		gap: 8,
	},
	image: {
		width: '100%',
		height: '70%',
		borderRadius: CARD_BORDER_RADIUS,
	},
});
