import AntDesign from '@expo/vector-icons/AntDesign';
import { RouteProp, useRoute } from '@react-navigation/native';
import { Layout, Spinner, Text, useTheme } from '@ui-kitten/components';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Swiper, type SwiperCardRefType } from 'rn-swiper-list';
import { fetchCoordinates, fetchPlaces, Place } from '../api/googlePlaces';
import Tag from '../components/Tag';
import { PRICE_MAP } from '../constants/googlePlaces';
import { handleError } from '../utils/errorHandler';

type RouteParams = {
	location: string;
	categories: string[];
	excluded: string[];
	radius: number;
	priceLevels: string[];
	openNow: boolean;
};

const CARD_BORDER_RADIUS = 15;

export default function SwipeScreen() {
	const theme = useTheme();
	const route = useRoute<RouteProp<{ params: RouteParams }, 'params'>>();
	const { location, categories, excluded, radius, priceLevels, openNow } = route.params;

	const [places, setPlaces] = useState<Place[]>([]);
	const [loading, setLoading] = useState(true);
	const [finished, setFinished] = useState(false);

	const swiperRef = useRef<SwiperCardRefType>(null);

	useEffect(() => {
		const load = async () => {
			try {
				const coords = await fetchCoordinates(location);
				if (!coords) {
					setPlaces([]);
					return;
				}
				const placesList = await fetchPlaces(
					coords.lat,
					coords.lng,
					categories,
					excluded,
					radius,
					priceLevels,
					openNow
				);
				setPlaces(placesList);
			} catch (err) {
				handleError(err, 'An error occurred while loading places.');
				setPlaces([]);
			} finally {
				setLoading(false);
			}
		};
		load();
	}, [location, categories, excluded, radius, priceLevels, openNow]);

	const renderCard = useCallback((place: Place) => {
		return (
			<Layout style={styles.cardStyle}>
				<Text
					style={{ textAlign: 'center', paddingHorizontal: 48 }}
					category='h1'
					numberOfLines={5}
					ellipsizeMode='tail'
				>
					{place.name ?? 'Unknown'}
				</Text>
				<Text style={{ fontSize: 100 }}>{'🍴'}</Text>
				<Layout style={[styles.tagsContainer, { backgroundColor: theme['color-basic-500'] }]}>
					<Tag
						label={place.primaryType
							.split('_')
							.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
							.join(' ')}
					></Tag>
					{place.priceLevel !== undefined && PRICE_MAP[place.priceLevel] && (
						<Tag label={PRICE_MAP[place.priceLevel]}></Tag>
					)}
				</Layout>
				<Text>
					{place.rating !== undefined ? (
						<>
							{place.rating} <AntDesign name='star' size={14} />
							{place.ratingCount !== undefined && ` (${place.ratingCount})`}
						</>
					) : (
						'No ratings yet'
					)}
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
			<Layout style={styles.loadingContainer}>
				<Spinner size='giant' />
				<Text category='h1' numberOfLines={3} ellipsizeMode='tail'>
					Looking for places near &quot;{location}&quot;
				</Text>
			</Layout>
		);
	}

	if (!places.length) {
		return (
			<Layout style={styles.basicContainer}>
				<Text category='h1'>No places found :&apos;)</Text>
			</Layout>
		);
	}

	if (finished) {
		return (
			<Layout style={styles.basicContainer}>
				<Text category='h1'>Out of places :/</Text>
			</Layout>
		);
	}

	return (
		<GestureHandlerRootView style={[{ flex: 1 }, { backgroundColor: theme['color-basic-100'] }]}>
			<View style={styles.cardContainer}>
				<Swiper
					ref={swiperRef}
					data={places}
					cardStyle={styles.cardStyle}
					renderCard={renderCard}
					onSwipeRight={handleAccept}
					OverlayLabelRight={() => <OverlayLabel color={theme['color-overlay-yes']} />}
					OverlayLabelLeft={() => <OverlayLabel color={theme['color-overlay-no']} />}
					OverlayLabelTop={() => <OverlayLabel color={theme['color-overlay-save']} />}
					onSwipedAll={() => setFinished(true)}
				/>
			</View>
		</GestureHandlerRootView>
	);
}

const styles = StyleSheet.create({
	basicContainer: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
	},
	cardContainer: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		marginHorizontal: 48,
		marginVertical: 200,
	},
	loadingContainer: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		gap: 16,
		padding: 48,
	},
	cardStyle: {
		width: '100%',
		height: '100%',
		borderRadius: CARD_BORDER_RADIUS,
		gap: 12,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#FEEFDC', // "color-basic-500", doesn't work in rn-swiper-list for some reason
	},
	overlayLabelContainer: {
		width: '100%',
		height: '100%',
		borderRadius: CARD_BORDER_RADIUS,
	},
	tagsContainer: {
		flexDirection: 'row',
		gap: 8,
	},
});
