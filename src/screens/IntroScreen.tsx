import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HardButton from '../components/HardButton';
import ThemeToggle from '../components/ThemeToggle';
import { useColors, useThemedStyles } from '../theme/theme';
import { BORDER, FONTS, RADII, type Palette } from '../theme/tokens';

export default function IntroScreen({ onStart }: { onStart: () => void }) {
	const insets = useSafeAreaInsets();
	const c = useColors();
	const styles = useThemedStyles(makeStyles);
	return (
		<View style={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
			<ThemeToggle style={[styles.toggle, { top: insets.top + 16 }]} />

			<Text style={styles.wordmark}>
				Grubl<Text style={styles.dot}>.</Text>
			</Text>
			<Text style={styles.tagline}>Stop scrolling menus.{'\n'}Swipe. Eat. Done.</Text>

			<HardButton
				dx={6}
				dy={6}
				color={c.shadow}
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

const makeStyles = (c: Palette) => StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: c.cream,
		paddingHorizontal: 28,
		// Group the wordmark, tagline and CTA as one block in the vertical centre
		// instead of splitting them top-and-bottom with a dead band between.
		justifyContent: 'center',
	},
	toggle: {
		position: 'absolute',
		right: 24,
	},
	wordmark: {
		fontFamily: FONTS.display,
		fontSize: 58,
		color: c.ink,
		letterSpacing: -1,
		lineHeight: 58 * 0.95,
	},
	dot: {
		color: c.tomato,
	},
	tagline: {
		marginTop: 14,
		fontFamily: FONTS.medium,
		fontSize: 19,
		lineHeight: 19 * 1.35,
		color: c.ink,
	},
	ctaContainer: {
		marginTop: 40,
	},
	ctaFace: {
		width: '100%',
		paddingVertical: 20,
		alignItems: 'center',
		backgroundColor: c.brass,
		borderWidth: BORDER,
		borderColor: c.brassDeep,
	},
	ctaText: {
		fontFamily: FONTS.display,
		fontSize: 22,
		color: c.onAccent,
	},
});
