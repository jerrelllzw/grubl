import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Linking, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { mapsUrl, metaLine, type Restaurant } from '../data/restaurants';
import { BORDER, COLORS, FONTS, RADII } from '../theme/tokens';
import HardButton from './HardButton';
import StripePhoto from './StripePhoto';

// Bottom-sheet quick look at a place — the "evaluate before you commit" surface,
// so a user doesn't have to bounce out to Maps just to see where somewhere is.
// Reachable from the swipe deck (ⓘ on the card) and the verdict winner card.

export default function DetailSheet({
	restaurant,
	visible,
	onClose,
}: {
	restaurant: Restaurant | null;
	visible: boolean;
	onClose: () => void;
}) {
	const insets = useSafeAreaInsets();

	return (
		<Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
			<Pressable
				style={styles.backdrop}
				onPress={onClose}
				accessibilityRole="button"
				accessibilityLabel="Close details"
			/>
			<View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
				<View style={styles.grabber} />
				{restaurant && (
					<>
						<View style={styles.headerRow}>
							<View style={styles.swatch}>
								<StripePhoto hue={restaurant.hue} radius={RADII.sticker} />
								<Text style={styles.swatchEmoji}>{restaurant.emoji}</Text>
							</View>
							<View style={styles.headText}>
								<Text style={styles.name} numberOfLines={2}>
									{restaurant.name}
								</Text>
								<Text style={styles.meta} numberOfLines={1}>
									{metaLine(restaurant)}
								</Text>
							</View>
							<Pressable
								onPress={onClose}
								hitSlop={8}
								style={styles.close}
								accessibilityRole="button"
								accessibilityLabel="Close"
							>
								<Ionicons name="close" size={22} color={COLORS.ink} />
							</Pressable>
						</View>

						{restaurant.address ? (
							<View style={styles.infoRow}>
								<Ionicons name="location-outline" size={18} color={COLORS.tomato} />
								<Text style={styles.infoText}>{restaurant.address}</Text>
							</View>
						) : null}

						<HardButton
							dx={6}
							dy={6}
							color={COLORS.tomato}
							radius={RADII.cta}
							onPress={() => Linking.openURL(mapsUrl(restaurant))}
							accessibilityLabel={`Open ${restaurant.name} in Maps`}
							containerStyle={styles.mapsContainer}
							faceStyle={styles.mapsFace}
						>
							<Text style={styles.mapsText}>OPEN IN MAPS →</Text>
						</HardButton>
					</>
				)}
			</View>
		</Modal>
	);
}

const styles = StyleSheet.create({
	backdrop: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: 'rgba(26,26,26,0.45)',
	},
	sheet: {
		position: 'absolute',
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: COLORS.paper,
		borderTopWidth: BORDER,
		borderColor: COLORS.ink,
		borderTopLeftRadius: RADII.card,
		borderTopRightRadius: RADII.card,
		paddingHorizontal: 24,
		paddingTop: 12,
	},
	grabber: {
		alignSelf: 'center',
		width: 44,
		height: 5,
		borderRadius: 999,
		backgroundColor: COLORS.ink,
		opacity: 0.25,
		marginBottom: 18,
	},
	headerRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 14,
	},
	swatch: {
		width: 60,
		height: 60,
		borderRadius: RADII.sticker,
		borderWidth: BORDER,
		borderColor: COLORS.ink,
		overflow: 'hidden',
		alignItems: 'center',
		justifyContent: 'center',
	},
	swatchEmoji: {
		fontSize: 32,
	},
	headText: {
		flex: 1,
	},
	name: {
		fontFamily: FONTS.display,
		fontSize: 22,
		color: COLORS.ink,
	},
	meta: {
		marginTop: 4,
		fontFamily: FONTS.semibold,
		fontSize: 13,
		color: COLORS.muted,
	},
	close: {
		width: 36,
		height: 36,
		borderRadius: 999,
		borderWidth: BORDER,
		borderColor: COLORS.ink,
		backgroundColor: COLORS.cream,
		alignItems: 'center',
		justifyContent: 'center',
	},
	infoRow: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		gap: 10,
		marginTop: 22,
		paddingVertical: 4,
	},
	infoText: {
		flex: 1,
		fontFamily: FONTS.medium,
		fontSize: 15,
		lineHeight: 15 * 1.35,
		color: COLORS.ink,
	},
	mapsContainer: {
		width: '100%',
		marginTop: 24,
	},
	mapsFace: {
		width: '100%',
		paddingVertical: 18,
		alignItems: 'center',
		backgroundColor: COLORS.ink,
		borderWidth: BORDER,
		borderColor: COLORS.ink,
	},
	mapsText: {
		fontFamily: FONTS.display,
		fontSize: 20,
		color: COLORS.cream,
	},
});
