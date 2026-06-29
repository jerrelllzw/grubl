import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
	FlatList,
	Linking,
	Modal,
	Pressable,
	StyleSheet,
	Text,
	View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import LoadingDots from 'react-native-loading-dots';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Swiper, type SwiperCardRefType } from 'rn-swiper-list';
import { fetchCoordinates, fetchPlaces, Place } from '../api/googlePlaces';
import CircleButton from '../components/CircleButton';
import GradientButton from '../components/GradientButton';
import Tag from '../components/Tag';
import { getPlaceEmoji, PRICE_MAP } from '../constants/googlePlaces';
import { COLORS, FONTS, GRADIENTS, RADIUS, SHADOWS } from '../theme/tokens';
import { handleError } from '../utils/errorHandler';

type RouteParams = {
	location: string;
	categories: string[];
	excluded: string[];
	radius: number;
	priceLevels: string[];
	openNow: boolean;
};

type RootStackParamList = {
	Search: undefined;
};

const formatPlaceType = (type?: string): string =>
	(type ?? '')
		.split('_')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');

const openInMaps = (place?: Place) => {
	if (!place?.id) return;
	const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
		place.name || ''
	)}&query_place_id=${place.id}`;
	Linking.openURL(mapsUrl);
};

/* -------------------------------------------------------------------------- */
/*                                 Place card                                 */
/* -------------------------------------------------------------------------- */

function PlaceCard({ place }: { place: Place }) {
	const priceLabel = place.priceLevel ? PRICE_MAP[place.priceLevel] : undefined;

	return (
		<View style={styles.card}>
			<LinearGradient
				colors={GRADIENTS.brand}
				start={{ x: 0, y: 0 }}
				end={{ x: 1, y: 1 }}
				style={styles.cardHero}
			>
				{place.rating !== undefined && (
					<View style={styles.ratingBadge}>
						<Ionicons name='star' size={14} color={COLORS.star} />
						<Text style={styles.ratingText}>{place.rating.toFixed(1)}</Text>
					</View>
				)}
				<Text style={styles.cardEmoji}>{getPlaceEmoji(place.primaryType)}</Text>
			</LinearGradient>

			<View style={styles.cardBody}>
				<Text style={styles.cardName} numberOfLines={2}>
					{place.name ?? 'Unknown spot'}
				</Text>

				<View style={styles.pillRow}>
					{place.primaryType ? <Tag label={formatPlaceType(place.primaryType)} /> : null}
					{priceLabel ? <Tag label={priceLabel} tone='neutral' /> : null}
				</View>

				<View style={styles.metaRow}>
					{place.distance !== undefined && (
						<View style={styles.metaItem}>
							<Ionicons name='location-outline' size={16} color={COLORS.brand} />
							<Text style={styles.metaText}>{place.distance} away</Text>
						</View>
					)}
					{place.ratingCount !== undefined && (
						<View style={styles.metaItem}>
							<Ionicons name='people-outline' size={16} color={COLORS.brand} />
							<Text style={styles.metaText}>
								{place.ratingCount.toLocaleString()} review{place.ratingCount === 1 ? '' : 's'}
							</Text>
						</View>
					)}
				</View>
			</View>
		</View>
	);
}

/* -------------------------------------------------------------------------- */
/*                               Overlay labels                               */
/* -------------------------------------------------------------------------- */

const SwipeBadge = ({ label, color, rotate }: { label: string; color: string; rotate: string }) => (
	<View style={[styles.swipeBadge, { borderColor: color, transform: [{ rotate }] }]}>
		<Text style={[styles.swipeBadgeText, { color }]}>{label}</Text>
	</View>
);

/* -------------------------------------------------------------------------- */
/*                                Swipe screen                                */
/* -------------------------------------------------------------------------- */

export default function SwipeScreen() {
	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
	const route = useRoute<RouteProp<{ params: RouteParams }, 'params'>>();
	const { location, categories, excluded, radius, priceLevels, openNow } = route.params;

	const [places, setPlaces] = useState<Place[]>([]);
	const [shortListedPlaces, setShortListedPlaces] = useState<Place[]>([]);
	const [showShortlist, setShowShortlist] = useState(false);
	const [loading, setLoading] = useState(true);
	const [finished, setFinished] = useState(false);
	const [index, setIndex] = useState(0);

	const swiperRef = useRef<SwiperCardRefType>(null);

	useEffect(() => {
		const load = async () => {
			const startedAt = Date.now();
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
				// Show the loader for a minimum beat so it doesn't flicker on fast loads.
				const elapsed = Date.now() - startedAt;
				const minDisplay = 1100;
				if (elapsed < minDisplay) {
					await new Promise((resolve) => setTimeout(resolve, minDisplay - elapsed));
				}
				setLoading(false);
			}
		};
		load();
	}, [location, categories, excluded, radius, priceLevels, openNow]);

	const addToShortlist = useCallback((place?: Place) => {
		if (!place?.id) return;
		setShortListedPlaces((prev) => (prev.some((p) => p.id === place.id) ? prev : [...prev, place]));
		Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
	}, []);

	const removeFromShortlist = useCallback((id: string) => {
		setShortListedPlaces((prev) => prev.filter((p) => p.id !== id));
	}, []);

	const handleMaps = useCallback(
		(cardIndex: number) => {
			Haptics.selectionAsync().catch(() => {});
			openInMaps(places[cardIndex]);
		},
		[places]
	);

	const handleShortlist = useCallback(
		(cardIndex: number) => {
			addToShortlist(places[cardIndex]);
		},
		[places, addToShortlist]
	);

	const renderShortlistSheet = () => (
		<Modal
			visible={showShortlist}
			transparent
			animationType='slide'
			onRequestClose={() => setShowShortlist(false)}
			statusBarTranslucent
		>
			<Pressable style={styles.sheetBackdrop} onPress={() => setShowShortlist(false)} />
			<SafeAreaView style={styles.sheetWrap} edges={['bottom']}>
				<View style={styles.sheet}>
					<View style={styles.sheetHandle} />
					<View style={styles.sheetHeader}>
						<Text style={styles.sheetTitle}>Your shortlist</Text>
						<View style={styles.sheetCount}>
							<Text style={styles.sheetCountText}>{shortListedPlaces.length}</Text>
						</View>
					</View>

					{shortListedPlaces.length === 0 ? (
						<View style={styles.sheetEmpty}>
							<Text style={styles.sheetEmptyEmoji}>🔖</Text>
							<Text style={styles.sheetEmptyText}>
								Swipe a place down to save it here for later.
							</Text>
						</View>
					) : (
						<FlatList
							data={shortListedPlaces}
							keyExtractor={(item) => item.id}
							showsVerticalScrollIndicator={false}
							contentContainerStyle={styles.sheetListContent}
							renderItem={({ item }) => (
								<View style={styles.sheetItem}>
									<View style={styles.sheetItemEmoji}>
										<Text style={styles.sheetItemEmojiText}>{getPlaceEmoji(item.primaryType)}</Text>
									</View>
									<View style={styles.sheetItemInfo}>
										<Text style={styles.sheetItemName} numberOfLines={1}>
											{item.name ?? 'Unknown spot'}
										</Text>
										<Text style={styles.sheetItemMeta} numberOfLines={1}>
											{formatPlaceType(item.primaryType)}
											{item.distance ? ` · ${item.distance}` : ''}
										</Text>
									</View>
									<Pressable style={styles.sheetRemove} onPress={() => removeFromShortlist(item.id)}>
										<Ionicons name='close' size={18} color={COLORS.muted} />
									</Pressable>
									<Pressable style={styles.sheetGo} onPress={() => openInMaps(item)}>
										<Ionicons name='navigate' size={18} color={COLORS.onBrand} />
									</Pressable>
								</View>
							)}
						/>
					)}

					<Pressable style={styles.sheetClose} onPress={() => setShowShortlist(false)}>
						<Text style={styles.sheetCloseText}>Close</Text>
					</Pressable>
				</View>
			</SafeAreaView>
		</Modal>
	);

	/* ----------------------------- Loading state ---------------------------- */
	if (loading) {
		return (
			<SafeAreaView style={styles.centerScreen}>
				<LinearGradient colors={GRADIENTS.brand} style={[styles.loadingOrb, SHADOWS.card]}>
					<Text style={styles.loadingEmoji}>🍽️</Text>
				</LinearGradient>
				<View style={styles.loadingDots}>
					<LoadingDots
						colors={[COLORS.brand, COLORS.save, COLORS.go, COLORS.success]}
						gap={6}
						size={11}
					/>
				</View>
				<Text style={styles.loadingTitle}>Finding tasty spots</Text>
				<Text style={styles.loadingLocation} numberOfLines={2}>
					near “{location}”
				</Text>
			</SafeAreaView>
		);
	}

	/* ------------------------------ Empty state ----------------------------- */
	if (!places.length) {
		return (
			<SafeAreaView style={styles.centerScreen}>
				<Text style={styles.stateEmoji}>😕</Text>
				<Text style={styles.stateTitle}>No spots found</Text>
				<Text style={styles.stateBody}>
					Try widening your radius or removing a filter or two.
				</Text>
				<GradientButton
					title='Adjust search'
					icon='options'
					onPress={() => navigation.goBack()}
					style={styles.stateButton}
				/>
			</SafeAreaView>
		);
	}

	/* ---------------------------- Finished state ---------------------------- */
	if (finished) {
		return (
			<SafeAreaView style={styles.centerScreen}>
				<Text style={styles.stateEmoji}>🎉</Text>
				<Text style={styles.stateTitle}>That&apos;s everyone!</Text>
				<Text style={styles.stateBody}>You&apos;ve seen all the spots nearby.</Text>
				{shortListedPlaces.length > 0 && (
					<GradientButton
						title={`View shortlist (${shortListedPlaces.length})`}
						icon='bookmark'
						colors={GRADIENTS.save}
						onPress={() => setShowShortlist(true)}
						style={styles.stateButton}
					/>
				)}
				<Pressable style={styles.stateSecondary} onPress={() => navigation.goBack()}>
					<Ionicons name='search' size={18} color={COLORS.brand} />
					<Text style={styles.stateSecondaryText}>New search</Text>
				</Pressable>
				{renderShortlistSheet()}
			</SafeAreaView>
		);
	}

	/* ---------------------- Single result (no swiper) ----------------------- */
	if (places.length === 1) {
		const only = places[0];
		return (
			<GestureHandlerRootView style={styles.screen}>
				<SafeAreaView style={styles.screen} edges={['top']}>
					<Header
						location={location}
						progress='1 spot'
						shortlistCount={shortListedPlaces.length}
						onBack={() => navigation.goBack()}
						onShortlist={() => setShowShortlist(true)}
					/>
					<View style={styles.cardArea}>
						<PlaceCard place={only} />
					</View>
					<ActionRow
						onSkip={() => setFinished(true)}
						onSave={() => {
							addToShortlist(only);
							setFinished(true);
						}}
						onMaps={() => {
							openInMaps(only);
							setFinished(true);
						}}
					/>
				</SafeAreaView>
				{renderShortlistSheet()}
			</GestureHandlerRootView>
		);
	}

	/* ------------------------------ Swipe deck ------------------------------ */
	const remaining = Math.max(places.length - index, 0);

	return (
		<GestureHandlerRootView style={styles.screen}>
			<SafeAreaView style={styles.screen} edges={['top']}>
				<Header
					location={location}
					progress={`${remaining} of ${places.length} left`}
					shortlistCount={shortListedPlaces.length}
					onBack={() => navigation.goBack()}
					onShortlist={() => setShowShortlist(true)}
				/>

				<View style={styles.cardArea}>
					<Swiper
						ref={swiperRef}
						data={places}
						cardStyle={styles.swiperCard}
						renderCard={(place) => <PlaceCard place={place} />}
						onIndexChange={setIndex}
						onSwipeRight={handleMaps}
						onSwipeBottom={handleShortlist}
						onSwipedAll={() => setFinished(true)}
						disableTopSwipe
						overlayLabelContainerStyle={styles.overlayContainer}
						OverlayLabelRight={() => (
							<View style={[styles.overlay, styles.overlayLeftAlign]}>
								<SwipeBadge label='EAT' color={COLORS.go} rotate='-14deg' />
							</View>
						)}
						OverlayLabelLeft={() => (
							<View style={[styles.overlay, styles.overlayRightAlign]}>
								<SwipeBadge label='NOPE' color={COLORS.skip} rotate='14deg' />
							</View>
						)}
						OverlayLabelBottom={() => (
							<View style={[styles.overlay, styles.overlayBottomAlign]}>
								<SwipeBadge label='SAVE' color={COLORS.save} rotate='-6deg' />
							</View>
						)}
					/>
				</View>

				<ActionRow
					onSkip={() => swiperRef.current?.swipeLeft()}
					onSave={() => swiperRef.current?.swipeBottom()}
					onMaps={() => swiperRef.current?.swipeRight()}
				/>
			</SafeAreaView>
			{renderShortlistSheet()}
		</GestureHandlerRootView>
	);
}

/* -------------------------------------------------------------------------- */
/*                              Shared sub-views                              */
/* -------------------------------------------------------------------------- */

function Header({
	location,
	progress,
	shortlistCount,
	onBack,
	onShortlist,
}: {
	location: string;
	progress: string;
	shortlistCount: number;
	onBack: () => void;
	onShortlist: () => void;
}) {
	return (
		<View style={styles.header}>
			<Pressable style={styles.headerButton} onPress={onBack}>
				<Ionicons name='chevron-back' size={24} color={COLORS.ink} />
			</Pressable>
			<View style={styles.headerCenter}>
				<View style={styles.headerLocationRow}>
					<Ionicons name='location' size={14} color={COLORS.brand} />
					<Text style={styles.headerLocation} numberOfLines={1}>
						{location}
					</Text>
				</View>
				<Text style={styles.headerProgress}>{progress}</Text>
			</View>
			<Pressable style={styles.headerButton} onPress={onShortlist}>
				<Ionicons name='bookmark' size={20} color={COLORS.save} />
				{shortlistCount > 0 && (
					<View style={styles.headerBadge}>
						<Text style={styles.headerBadgeText}>{shortlistCount}</Text>
					</View>
				)}
			</Pressable>
		</View>
	);
}

function ActionRow({
	onSkip,
	onSave,
	onMaps,
}: {
	onSkip: () => void;
	onSave: () => void;
	onMaps: () => void;
}) {
	return (
		<View style={styles.actions}>
			<CircleButton icon='close' color={COLORS.skip} size={64} onPress={onSkip} />
			<CircleButton icon='bookmark' color={COLORS.save} size={54} onPress={onSave} />
			<CircleButton icon='navigate' color={COLORS.go} size={64} onPress={onMaps} />
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {
		flex: 1,
		backgroundColor: COLORS.bg,
	},
	centerScreen: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		padding: 36,
		backgroundColor: COLORS.bg,
	},

	/* Header */
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		paddingHorizontal: 18,
		paddingVertical: 8,
	},
	headerButton: {
		width: 46,
		height: 46,
		borderRadius: 15,
		backgroundColor: COLORS.surface,
		alignItems: 'center',
		justifyContent: 'center',
		...SHADOWS.soft,
	},
	headerCenter: {
		flex: 1,
		alignItems: 'center',
	},
	headerLocationRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
		maxWidth: '100%',
	},
	headerLocation: {
		fontFamily: FONTS.semibold,
		fontSize: 14,
		color: COLORS.ink,
		flexShrink: 1,
	},
	headerProgress: {
		fontFamily: FONTS.medium,
		fontSize: 12,
		color: COLORS.muted,
		marginTop: 1,
	},
	headerBadge: {
		position: 'absolute',
		top: -4,
		right: -4,
		minWidth: 20,
		height: 20,
		borderRadius: 10,
		paddingHorizontal: 5,
		backgroundColor: COLORS.save,
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: 2,
		borderColor: COLORS.bg,
	},
	headerBadgeText: {
		fontFamily: FONTS.bold,
		fontSize: 10,
		color: COLORS.onBrand,
	},

	/* Card */
	cardArea: {
		flex: 1,
		marginHorizontal: 18,
		marginTop: 4,
		marginBottom: 10,
	},
	swiperCard: {
		width: '100%',
		height: '100%',
		borderRadius: RADIUS.xl,
		backgroundColor: COLORS.surface,
		...SHADOWS.card,
	},
	card: {
		flex: 1,
		borderRadius: RADIUS.xl,
		backgroundColor: COLORS.surface,
		overflow: 'hidden',
	},
	cardHero: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
	},
	cardEmoji: {
		fontSize: 132,
	},
	ratingBadge: {
		position: 'absolute',
		top: 16,
		right: 16,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
		backgroundColor: 'rgba(255,255,255,0.95)',
		paddingHorizontal: 10,
		paddingVertical: 5,
		borderRadius: RADIUS.pill,
	},
	ratingText: {
		fontFamily: FONTS.bold,
		fontSize: 13,
		color: COLORS.ink,
	},
	cardBody: {
		paddingHorizontal: 22,
		paddingVertical: 20,
		gap: 12,
		minHeight: 168,
		justifyContent: 'center',
	},
	cardName: {
		fontFamily: FONTS.extrabold,
		fontSize: 26,
		lineHeight: 31,
		color: COLORS.ink,
		textAlign: 'center',
	},
	pillRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
		justifyContent: 'center',
	},
	metaRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 16,
		justifyContent: 'center',
	},
	metaItem: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 5,
	},
	metaText: {
		fontFamily: FONTS.medium,
		fontSize: 13,
		color: COLORS.body,
	},

	/* Overlay labels */
	overlayContainer: {
		borderRadius: RADIUS.xl,
	},
	overlay: {
		flex: 1,
		padding: 30,
	},
	overlayLeftAlign: {
		alignItems: 'flex-start',
		justifyContent: 'flex-start',
	},
	overlayRightAlign: {
		alignItems: 'flex-end',
		justifyContent: 'flex-start',
	},
	overlayBottomAlign: {
		alignItems: 'center',
		justifyContent: 'flex-end',
	},
	swipeBadge: {
		borderWidth: 4,
		borderRadius: 14,
		paddingHorizontal: 16,
		paddingVertical: 8,
		backgroundColor: 'rgba(255,255,255,0.85)',
	},
	swipeBadgeText: {
		fontFamily: FONTS.extrabold,
		fontSize: 30,
		letterSpacing: 1,
	},

	/* Action row */
	actions: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 26,
		paddingBottom: 16,
		paddingTop: 4,
	},

	/* Loading state */
	loadingOrb: {
		width: 120,
		height: 120,
		borderRadius: 60,
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 28,
	},
	loadingEmoji: {
		fontSize: 60,
	},
	loadingDots: {
		width: 70,
		marginBottom: 24,
	},
	loadingTitle: {
		fontFamily: FONTS.bold,
		fontSize: 20,
		color: COLORS.ink,
	},
	loadingLocation: {
		fontFamily: FONTS.regular,
		fontSize: 15,
		color: COLORS.muted,
		textAlign: 'center',
		marginTop: 2,
	},

	/* Empty / finished states */
	stateEmoji: {
		fontSize: 72,
		marginBottom: 12,
	},
	stateTitle: {
		fontFamily: FONTS.extrabold,
		fontSize: 26,
		color: COLORS.ink,
		textAlign: 'center',
	},
	stateBody: {
		fontFamily: FONTS.regular,
		fontSize: 15,
		color: COLORS.muted,
		textAlign: 'center',
		marginTop: 8,
		marginBottom: 28,
		paddingHorizontal: 12,
	},
	stateButton: {
		alignSelf: 'stretch',
	},
	stateSecondary: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		paddingVertical: 14,
		marginTop: 6,
	},
	stateSecondaryText: {
		fontFamily: FONTS.semibold,
		fontSize: 15,
		color: COLORS.brand,
	},

	/* Shortlist sheet */
	sheetBackdrop: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: 'rgba(20, 12, 8, 0.5)',
	},
	sheetWrap: {
		flex: 1,
		justifyContent: 'flex-end',
	},
	sheet: {
		backgroundColor: COLORS.bg,
		borderTopLeftRadius: 28,
		borderTopRightRadius: 28,
		paddingHorizontal: 20,
		paddingTop: 10,
		paddingBottom: 14,
		maxHeight: '78%',
	},
	sheetHandle: {
		alignSelf: 'center',
		width: 44,
		height: 5,
		borderRadius: 3,
		backgroundColor: COLORS.hairline,
		marginBottom: 14,
	},
	sheetHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
		marginBottom: 12,
	},
	sheetTitle: {
		fontFamily: FONTS.extrabold,
		fontSize: 22,
		color: COLORS.ink,
	},
	sheetCount: {
		minWidth: 26,
		height: 26,
		borderRadius: 13,
		paddingHorizontal: 8,
		backgroundColor: COLORS.brandSoft,
		alignItems: 'center',
		justifyContent: 'center',
	},
	sheetCountText: {
		fontFamily: FONTS.bold,
		fontSize: 13,
		color: COLORS.brandDark,
	},
	sheetEmpty: {
		alignItems: 'center',
		paddingVertical: 48,
		gap: 12,
	},
	sheetEmptyEmoji: {
		fontSize: 44,
	},
	sheetEmptyText: {
		fontFamily: FONTS.regular,
		fontSize: 15,
		color: COLORS.muted,
		textAlign: 'center',
		paddingHorizontal: 24,
	},
	sheetListContent: {
		gap: 10,
		paddingBottom: 8,
	},
	sheetItem: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		backgroundColor: COLORS.surface,
		borderRadius: RADIUS.md,
		padding: 12,
		...SHADOWS.soft,
	},
	sheetItemEmoji: {
		width: 46,
		height: 46,
		borderRadius: 14,
		backgroundColor: COLORS.brandSoft,
		alignItems: 'center',
		justifyContent: 'center',
	},
	sheetItemEmojiText: {
		fontSize: 24,
	},
	sheetItemInfo: {
		flex: 1,
	},
	sheetItemName: {
		fontFamily: FONTS.semibold,
		fontSize: 15,
		color: COLORS.ink,
	},
	sheetItemMeta: {
		fontFamily: FONTS.regular,
		fontSize: 12,
		color: COLORS.muted,
		marginTop: 1,
	},
	sheetRemove: {
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: COLORS.surfaceAlt,
		alignItems: 'center',
		justifyContent: 'center',
	},
	sheetGo: {
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: COLORS.go,
		alignItems: 'center',
		justifyContent: 'center',
	},
	sheetClose: {
		marginTop: 12,
		paddingVertical: 14,
		alignItems: 'center',
	},
	sheetCloseText: {
		fontFamily: FONTS.semibold,
		fontSize: 15,
		color: COLORS.body,
	},
});
