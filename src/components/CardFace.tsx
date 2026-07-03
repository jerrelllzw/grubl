import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { metaLine, type Restaurant } from '../data/restaurants';
import { BORDER, COLORS, FONTS, RADII } from '../theme/tokens';
import StripePhoto from './StripePhoto';

// Placeholder food card: a hue-tinted field with the cuisine's emoji standing in
// for a (separately-billed) photo, plus a floating, tilted "sticker" info panel.
// Shared by the swipe deck and the verdict winner card. Pass stamp overlays as
// children.

export default function CardFace({
	restaurant,
	showRating = true,
	cardRadius = RADII.card,
	shadow = { dx: 7, dy: 7, color: COLORS.ink },
	nameSize = 23,
	metaSize = 15,
	emojiSize = 96,
	children,
}: {
	restaurant: Restaurant;
	showRating?: boolean;
	cardRadius?: number;
	shadow?: { dx: number; dy: number; color: string };
	nameSize?: number;
	metaSize?: number;
	emojiSize?: number;
	children?: React.ReactNode;
}) {
	return (
		<View
			style={styles.root}
			accessible
			accessibilityLabel={`${restaurant.name}. ${metaLine(restaurant, showRating)}`}
		>
			{/* hard offset shadow */}
			<View
				style={[
					StyleSheet.absoluteFillObject,
					{ backgroundColor: shadow.color, borderRadius: cardRadius, transform: [{ translateX: shadow.dx }, { translateY: shadow.dy }] },
				]}
			/>
			{/* bordered card */}
			<View style={[StyleSheet.absoluteFillObject, { borderRadius: cardRadius, borderWidth: BORDER, borderColor: COLORS.ink, backgroundColor: COLORS.paper, overflow: 'hidden' }]}>
				<StripePhoto hue={restaurant.hue} radius={cardRadius} />

				{/* emoji stand-in for a photo */}
				<View style={styles.emojiWrap} pointerEvents="none">
					<Text style={[styles.emoji, { fontSize: emojiSize }]}>{restaurant.emoji}</Text>
				</View>

				{/* info sticker panel */}
				<View style={styles.stickerWrap}>
					<View style={[StyleSheet.absoluteFillObject, styles.stickerShadow]} />
					<View style={styles.sticker}>
						<Text style={[styles.name, { fontSize: nameSize }]} numberOfLines={1}>
							{restaurant.name}
						</Text>
						<Text style={[styles.meta, { fontSize: metaSize }]} numberOfLines={1}>
							{metaLine(restaurant, showRating)}
						</Text>
					</View>
				</View>

				{children}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	root: {
		flex: 1,
	},
	emojiWrap: {
		...StyleSheet.absoluteFillObject,
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
		backgroundColor: COLORS.ink,
		borderRadius: RADII.sticker,
		transform: [{ translateX: 5 }, { translateY: 5 }],
	},
	sticker: {
		backgroundColor: COLORS.paper,
		borderWidth: BORDER,
		borderColor: COLORS.ink,
		borderRadius: RADII.sticker,
		paddingVertical: 14,
		paddingHorizontal: 16,
	},
	name: {
		fontFamily: FONTS.display,
		color: COLORS.ink,
	},
	meta: {
		marginTop: 5,
		fontFamily: FONTS.semibold,
		color: COLORS.muted,
	},
});
