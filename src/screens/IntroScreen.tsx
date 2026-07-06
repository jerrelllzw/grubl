import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
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

			{/* Hero block lands as a quick staggered cascade — wordmark first, then the
			    lines, then the CTA pops in last so the eye ends on the action. */}
			<Animated.View entering={FadeInDown.duration(500)}>
				<Wordmark size={58} style={styles.wordmark} />
			</Animated.View>
			<Animated.Text entering={FadeInDown.delay(110).duration(500)} style={styles.tagline}>
				No more “I don’t know.”
			</Animated.Text>
			<Animated.Text entering={FadeInDown.delay(190).duration(500)} style={styles.subline}>
				The fastest way to decide where to eat.
			</Animated.Text>

			<Animated.View entering={FadeInDown.delay(320).duration(500)} style={styles.ctaStretch}>
				<HardButton
					dx={6}
					dy={6}
					color={c.shadow}
					radius={RADII.cta}
					onPress={onStart}
					accessibilityLabel='Start — set up a food search'
					containerStyle={styles.ctaContainer}
					faceStyle={styles.ctaFace}
				>
					<Text style={styles.ctaText}>START →</Text>
				</HardButton>
			</Animated.View>
		</View>
	);
}

const makeStyles = (c: Palette) =>
	StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: c.cream,
			paddingHorizontal: 28,
			// Group the wordmark, tagline and CTA as one block centred on both axes.
			justifyContent: 'center',
			alignItems: 'center',
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
			textAlign: 'center',
		},
		subline: {
			marginTop: 8,
			fontFamily: FONTS.medium,
			fontSize: 15,
			lineHeight: 15 * 1.3,
			letterSpacing: -0.2,
			color: c.muted,
			textAlign: 'center',
		},
		ctaStretch: {
			marginTop: 40,
			alignSelf: 'stretch', // the animated wrapper carries the width so the CTA fills it
		},
		ctaContainer: {
			alignSelf: 'stretch', // full-width CTA even though the hero text is centred
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
