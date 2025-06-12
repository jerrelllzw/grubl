import { RouteProp, useRoute } from '@react-navigation/native';
import { Button, Layout, Spinner, Text } from '@ui-kitten/components';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, Linking, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Swiper, type SwiperCardRefType } from 'rn-swiper-list';
import { fetchCoordinates, fetchPlaces, Place } from '../api/googlePlaces';
import { EMOJI_MAP, IGNORED_PLACE_TYPES, PRICE_MAP } from '../constants/googlePlaces';
import { handleError } from '../utils/errorHandler';

const CARD_BORDER_RADIUS = 15;

type RouteParams = {
	location: string;
	radius: number;
	placeTypes: string[];
	priceLevels: string[];
	openNow: boolean;
};

const { width, height } = Dimensions.get('window');

export default function SwipeScreen() {
	const route = useRoute<RouteProp<{ params: RouteParams }, 'params'>>();
	const { location, radius, placeTypes, priceLevels, openNow } = route.params;

	const [places, setPlaces] = useState<Place[]>([]);
	const [loading, setLoading] = useState(true);

	const swiperRef = useRef<SwiperCardRefType>(null);

	useEffect(() => {
		const load = async () => {
			try {
				const coords = await fetchCoordinates(`${location}`);
				if (!coords) {
					setPlaces([]);
					return;
				}
				const placesList = await fetchPlaces(coords.lat, coords.lng, radius, placeTypes, priceLevels, openNow);
				setPlaces(placesList);
			} catch (err) {
				handleError(err, 'An error occurred while loading places.');
				setPlaces([]);
			} finally {
				setLoading(false);
			}
		};
		load();
	}, [location, radius, placeTypes, priceLevels, openNow]);

	const renderCard = useCallback((place: Place) => {
		return (
			<Layout style={styles.cardStyle}>
				<Text style={{ textAlign: 'center' }} category='h1'>
					{place.name ?? 'Unknown'}
				</Text>
				<Text style={{ fontSize: 100 }}>{EMOJI_MAP[place.primaryType ?? ''] ?? '🍴'}</Text>
				<Layout style={styles.typesContainer}>
					{place.types
						?.filter((type) => EMOJI_MAP[type] !== undefined && !IGNORED_PLACE_TYPES.includes(type))
						.map((type) => (
							<Button key={type} size='tiny' appearance='outline'>
								{type
									.split('_')
									.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
									.join(' ')}
							</Button>
						))}
				</Layout>
				<Text appearance='hint'>
					{place.rating !== undefined ? `${place.rating} ⭐` : 'No ratings yet'}
					{place.ratingCount !== undefined ? ` (${place.ratingCount})` : ''}
				</Text>
				<Text appearance='hint'>{PRICE_MAP[place.priceLevel ?? ''] ?? 'No price data'}</Text>
			</Layout>
		);
	}, []);

	const OverlayLabel = ({ color }: { color: string }) => (
		<View style={[styles.overlayLabelContainer, { backgroundColor: color }]} />
	);

	const handleAccept = useCallback(
		(cardIndex: number) => {
			const place = places[cardIndex];
			if (place && place.id) {
				const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
					place.name || ''
				)}&query_place_id=${place.id}`;
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
		width: width,
		height: height,
		alignItems: 'center',
		justifyContent: 'center',
		gap: 16,
	},
	typesContainer: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
	},
});
