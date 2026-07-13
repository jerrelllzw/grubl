import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { metaLine, type Restaurant } from '../data/restaurants';
import { useColors, useThemedStyles } from '../theme/theme';
import { BORDER, FONTS, RADII, type Palette } from '../theme/tokens';
import StripePhoto from './StripePhoto';

// Placeholder food card: a hue-tinted field with the cuisine's emoji standing in
// for a (separately-billed) photo, plus a floating, tilted "sticker" info panel.
// Shared by the swipe deck and the verdict winner card. Pass stamp overlays as
// children.

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
			{/* bordered card */}
			<View style={[StyleSheet.absoluteFill, { borderRadius: cardRadius, borderWidth: BORDER, borderColor: c.ink, backgroundColor: c.paper, overflow: 'hidden' }]}>
				<StripePhoto hue={restaurant.hue} radius={cardRadius} />

				{/* emoji stand-in for a photo */}
				<View style={styles.emojiWrap} pointerEvents="none">
					<Text style={[styles.emoji, { fontSize: emojiSize }]}>{restaurant.emoji}</Text>
				</View>

				{/* info sticker panel */}
				<View style={styles.stickerWrap}>
					<View style={[StyleSheet.absoluteFill, styles.stickerShadow]} />
					<View style={styles.sticker}>
						<Text style={[styles.name, { fontSize: nameSize }]} numberOfLines={1}>
							{restaurant.name}
						</Text>
						<Text style={[styles.meta, { fontSize: metaSize }]} numberOfLines={1}>
							{metaLine(restaurant)}
						</Text>
					</View>
				</View>

				{children}
			</View>
		</View>
	);
}

const makeStyles = (c: Palette) => StyleSheet.create({
	root: {
		flex: 1,
	},
	emojiWrap: {
		...StyleSheet.absoluteFill,
		alignItems: 'center',
		justifyContent: 'center',
		// bias upward so the emoji sits above the bottom info sticker
		paddingBottom: 64,
	},
	emoji: {
		textAlign: 'center',
	},
	stickerWrap: {
		position: 'absolute',
		left: 16,
		right: 16,
		bottom: 16,
		transform: [{ rotate: '-1deg' }],
	},
	stickerShadow: {
		backgroundColor: c.shadow,
		borderRadius: RADII.sticker,
		transform: [{ translateX: 5 }, { translateY: 5 }],
	},
	sticker: {
		backgroundColor: c.paper,
		borderWidth: BORDER,
		borderColor: c.ink,
		borderRadius: RADII.sticker,
		paddingVertical: 14,
		paddingHorizontal: 16,
	},
	name: {
		fontFamily: FONTS.display,
		color: c.ink,
	},
	meta: {
		marginTop: 5,
		fontFamily: FONTS.semibold,
		color: c.muted,
	},
});
