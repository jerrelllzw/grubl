import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HardButton from '../components/HardButton';
import { BORDER, COLORS, FONTS, RADII } from '../theme/tokens';

export default function IntroScreen({ onStart }: { onStart: () => void }) {
	const insets = useSafeAreaInsets();
	return (
		<View style={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
			<Text style={styles.wordmark}>
				grubl<Text style={styles.dot}>.</Text>
			</Text>
			<Text style={styles.tagline}>Stop scrolling menus.{'\n'}Swipe. Eat. Done.</Text>

			<HardButton
				dx={6}
				dy={6}
				color={COLORS.tomato}
				radius={RADII.cta}
				onPress={onStart}
				accessibilityLabel="Start — set up a food search"
				containerStyle={styles.ctaContainer}
				faceStyle={styles.ctaFace}
			>
				<Text style={styles.ctaText}>FEED ME →</Text>
			</HardButton>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: COLORS.cream,
		paddingHorizontal: 28,
		// Group the wordmark, tagline and CTA as one block in the vertical centre
		// instead of splitting them top-and-bottom with a dead band between.
		justifyContent: 'center',
	},
	wordmark: {
		fontFamily: FONTS.display,
		fontSize: 58,
		color: COLORS.ink,
		letterSpacing: -1,
		lineHeight: 58 * 0.95,
	},
	dot: {
		color: COLORS.tomato,
	},
	tagline: {
		marginTop: 14,
		fontFamily: FONTS.medium,
		fontSize: 19,
		lineHeight: 19 * 1.35,
		color: COLORS.ink,
	},
	ctaContainer: {
		marginTop: 40,
	},
	ctaFace: {
		width: '100%',
		paddingVertical: 20,
		alignItems: 'center',
		backgroundColor: COLORS.ink,
		borderWidth: BORDER,
		borderColor: COLORS.ink,
	},
	ctaText: {
		fontFamily: FONTS.display,
		fontSize: 22,
		color: COLORS.cream,
	},
});
