import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HardButton from '../components/HardButton';
import ThemeToggle from '../components/ThemeToggle';
import Wordmark from '../components/Wordmark';
import { useColors, useThemedStyles } from '../theme/theme';
import { BORDER, FONTS, RADII, type Palette } from '../theme/tokens';

export default function IntroScreen({ onStart }: { onStart: () => void }) {
	const insets = useSafeAreaInsets();
	const c = useColors();
	const styles = useThemedStyles(makeStyles);
	return (
		<View style={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
			<ThemeToggle style={[styles.toggle, { top: insets.top + 16 }]} />

			<Wordmark size={58} style={styles.wordmark} />
			<Text style={styles.tagline}>No more “I don’t know.”</Text>
			<Text style={styles.subline}>The fastest way to decide where to eat.</Text>

			<HardButton
				dx={6}
				dy={6}
				color={c.shadow}
				radius={RADII.cta}
				onPress={onStart}
				accessibilityLabel="Get started — set up a food search"
				containerStyle={styles.ctaContainer}
				faceStyle={styles.ctaFace}
			>
				<Text style={styles.ctaText}>GET STARTED →</Text>
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
		letterSpacing: -1, // tighter tracking for the big hero treatment
		lineHeight: 58 * 0.95,
	},
	tagline: {
		marginTop: 18,
		fontFamily: FONTS.semibold,
		fontSize: 20,
		lineHeight: 20 * 1.25,
		letterSpacing: -0.4, // echoes the wordmark's tight tracking so they read as one voice
		color: c.ink,
	},
	subline: {
		marginTop: 8,
		fontFamily: FONTS.medium,
		fontSize: 15,
		lineHeight: 15 * 1.3,
		letterSpacing: -0.2,
		color: c.muted,
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
