import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { descriptorLine, formatCount, metaLine, type Restaurant } from '../data/restaurants';
import { useColors, useThemedStyles } from '../theme/theme';
import { BORDER, FONTS, RADII, type Palette } from '../theme/tokens';
import StripePhoto from './StripePhoto';

// Food card, sized to its content: a fixed 4:3 photo panel on top and an info
// section below. The card is as tall as those two stacked — it does NOT stretch
// to fill its parent — so callers centre it in the available space. A fixed-ratio
// panel keeps the (mostly landscape) photos un-zoomed and identical on every
// device, and the grounded info section leaves no dead space. When there's no
// photo (real Places results), the panel falls back to the hue stripe + emoji.
// Shared by the swipe deck and the verdict winner card. Pass stamp overlays as
// children — they're absolutely positioned over the card face.

export default function CardFace({
	restaurant,
	cardRadius = RADII.card,
	shadow,
	nameSize = 23,
	metaSize = 15,
	emojiSize = 96,
	children,
}: {
	restaurant: Restaurant;
	cardRadius?: number;
	shadow?: { dx: number; dy: number; color: string };
	nameSize?: number;
	metaSize?: number;
	emojiSize?: number;
	children?: React.ReactNode;
}) {
	const c = useColors();
	const styles = useThemedStyles(makeStyles);
	const cardShadow = shadow ?? { dx: 7, dy: 7, color: c.shadow };
	return (
		<View
			style={styles.root}
			accessible
			accessibilityLabel={`${restaurant.name}. ${metaLine(restaurant)}`}
		>
			{/* hard offset shadow */}
			<View
				style={[
					StyleSheet.absoluteFill,
					{ backgroundColor: cardShadow.color, borderRadius: cardRadius, transform: [{ translateX: cardShadow.dx }, { translateY: cardShadow.dy }] },
				]}
			/>
			{/* bordered card — in normal flow, so its height is the panel + info */}
			<View style={[styles.face, { borderRadius: cardRadius }]}>
				{/* 4:3 photo panel */}
				<View style={styles.band}>
					{restaurant.photo ? (
						<Image source={restaurant.photo} style={styles.photo} resizeMode="cover" fadeDuration={0} />
					) : (
						<>
							<StripePhoto hue={restaurant.hue} radius={0} />
							{/* emoji stand-in for a photo */}
							<View style={styles.emojiWrap} pointerEvents="none">
								<Text style={[styles.emoji, { fontSize: emojiSize }]}>{restaurant.emoji}</Text>
							</View>
						</>
					)}
				</View>

				{/* info section — fills the lower area, no floating gap */}
				<View style={styles.info}>
					<Text style={[styles.name, { fontSize: nameSize }]} numberOfLines={1}>
						{restaurant.name}
					</Text>
					<Text style={[styles.meta, { fontSize: metaSize }]} numberOfLines={1}>
						{descriptorLine(restaurant)}
					</Text>
					<View style={styles.ratingRow}>
						{typeof restaurant.rating === 'number' ? (
							<>
								<Text style={[styles.ratingStar, { fontSize: metaSize }]}>★</Text>
								<Text style={[styles.ratingValue, { fontSize: metaSize }]}>
									{restaurant.rating.toFixed(1)}
								</Text>
								{restaurant.ratingCount ? (
									<Text style={[styles.ratingCount, { fontSize: metaSize - 1 }]}>
										{formatCount(restaurant.ratingCount)} reviews
									</Text>
								) : null}
							</>
						) : (
							<Text style={[styles.ratingEmpty, { fontSize: metaSize - 1 }]}>
								No reviews yet
							</Text>
						)}
					</View>
				</View>

				{children}
			</View>
		</View>
	);
}

const makeStyles = (c: Palette) => StyleSheet.create({
	root: {
		alignSelf: 'stretch',
	},
	face: {
		borderWidth: BORDER,
		borderColor: c.ink,
		backgroundColor: c.paper,
		overflow: 'hidden',
	},
	band: {
		width: '100%',
		aspectRatio: 4 / 3, // fixed panel shape, independent of the card's height
		borderBottomWidth: BORDER,
		borderBottomColor: c.ink,
		overflow: 'hidden',
	},
	photo: {
		width: '100%',
		height: '100%',
	},
	emojiWrap: {
		...StyleSheet.absoluteFill,
		alignItems: 'center',
		justifyContent: 'center',
	},
	emoji: {
		textAlign: 'center',
	},
	info: {
		paddingHorizontal: 18,
		paddingTop: 15,
		paddingBottom: 17,
	},
	name: {
		fontFamily: FONTS.display,
		color: c.ink,
	},
	meta: {
		marginTop: 9,
		fontFamily: FONTS.semibold,
		color: c.muted,
	},
	ratingRow: {
		marginTop: 10,
		flexDirection: 'row',
		alignItems: 'center',
	},
	ratingStar: {
		fontFamily: FONTS.semibold,
		color: c.brass,
	},
	ratingValue: {
		marginLeft: 4,
		fontFamily: FONTS.bold,
		color: c.ink,
	},
	ratingCount: {
		marginLeft: 8,
		fontFamily: FONTS.medium,
		color: c.muted,
	},
	ratingEmpty: {
		fontFamily: FONTS.medium,
		fontStyle: 'italic',
		color: c.muted,
	},
});
