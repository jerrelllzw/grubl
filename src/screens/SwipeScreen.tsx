import { RouteProp, useRoute } from '@react-navigation/native';
import { Button, Layout, Spinner, Text } from '@ui-kitten/components';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Swiper, type SwiperCardRefType } from 'rn-swiper-list';
import { fetchCoordinates, fetchPlaces, Place } from '../api/googlePlaces';
import { PRICE_MAP } from '../constants/googlePlaces';
import { handleError } from '../utils/errorHandler';

type RouteParams = {
	location: string;
	radius: number;
	placeTypes: string[];
	priceLevels: string[];
	openNow: boolean;
};

const CARD_BORDER_RADIUS = 15;

export default function SwipeScreen() {
	const route = useRoute<RouteProp<{ params: RouteParams }, 'params'>>();
	const { location, radius, placeTypes, priceLevels, openNow } = route.params;

	const [places, setPlaces] = useState<Place[]>([]);
	const [loading, setLoading] = useState(true);

	const swiperRef = useRef<SwiperCardRefType>(null);

	useEffect(() => {
		const load = async () => {
			try {
				const coords = await fetchCoordinates(location);
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
				<Text style={{ fontSize: 100 }}>{'🍴'}</Text>
				<Layout style={styles.tagsContainer}>
					<Button size='tiny' appearance='outline'>
						{place.primaryType
							?.split('_')
							.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
							.join(' ')}
					</Button>
					{place.priceLevel && (
						<Button size='tiny' appearance='outline'>
							{PRICE_MAP[place.priceLevel]}
						</Button>
					)}
				</Layout>
				<Text appearance='hint'>
					{place.rating !== undefined ? `${place.rating} ⭐` : 'No ratings yet'}
					{place.ratingCount !== undefined ? ` (${place.ratingCount})` : ''}
				</Text>
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
			<Layout style={[styles.loadingContainer, { gap: 16 }]}>
				<Spinner size='giant' />
				<Text>Loading places near &quot;{location}&quot;...</Text>
			</Layout>
		);
	}

	if (!places.length) {
		return (
			<Layout style={styles.loadingContainer}>
				<Text category='h6'>No places found.</Text>
			</Layout>
		);
	}

	return (
		<GestureHandlerRootView style={styles.container}>
			<View style={styles.subContainer}>
				<Swiper
					ref={swiperRef}
					data={places}
					cardStyle={styles.cardStyle}
					renderCard={renderCard}
					onSwipeRight={handleAccept}
					OverlayLabelRight={() => <OverlayLabel color='#3fa07a' />}
					OverlayLabelLeft={() => <OverlayLabel color='#c94f4f' />}
					OverlayLabelTop={() => <OverlayLabel color='#7c5ab8' />}
				/>
			</View>
		</GestureHandlerRootView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#222b44',
	},
	subContainer: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
	},
	loadingContainer: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
	},
	cardStyle: {
		width: '90%',
		height: '75%',
		borderRadius: CARD_BORDER_RADIUS,
		padding: 16,
		gap: 12,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#16172b',
	},
	overlayLabelContainer: {
		width: '100%',
		height: '100%',
		borderRadius: CARD_BORDER_RADIUS,
	},
	tagsContainer: {
		flexDirection: 'row',
		gap: 8,
		backgroundColor: '#16172b',
	},
});
