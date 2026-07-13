import * as Haptics from 'expo-haptics';
import React, { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { isForceMock, toggleForceMock } from '../api/googlePlaces';
import HardButton from '../components/HardButton';
import Wordmark from '../components/Wordmark';
import { useColors, useThemedStyles } from '../theme/theme';
import { BORDER, FONTS, RADII, type Palette } from '../theme/tokens';

// Taps on the wordmark needed to flip the hidden mock switch, and how long the
// run may pause before the counter resets — the classic "tap the version 7×" gesture.
const MOCK_TAPS = 7;
const TAP_WINDOW_MS = 800;

export default function IntroScreen({ onStart }: { onStart: () => void }) {
	const insets = useSafeAreaInsets();
	const c = useColors();
	const styles = useThemedStyles(makeStyles);

	// Hidden dev switch: tap the wordmark MOCK_TAPS× to toggle serving the bundled
	// mock deck instead of live Google Places (see useMockData in googlePlaces).
	const [mockOn, setMockOn] = useState(isForceMock());
	const tapCount = useRef(0);
	const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	const onWordmarkPress = () => {
		if (tapTimer.current) clearTimeout(tapTimer.current);
		tapCount.current += 1;
		if (tapCount.current >= MOCK_TAPS) {
			tapCount.current = 0;
			toggleForceMock().then((on) => {
				setMockOn(on);
				Haptics.notificationAsync(
					on ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning
				).catch(() => {});
			});
			return;
		}
		tapTimer.current = setTimeout(() => {
			tapCount.current = 0;
		}, TAP_WINDOW_MS);
	};

	return (
		<View style={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
			{/* Hero block lands as a quick staggered cascade — wordmark first, then the
			    lines, then the CTA pops in last so the eye ends on the action. */}
			<Animated.View entering={FadeInDown.duration(500)}>
				{/* Wordmark doubles as the hidden mock switch — no visible affordance;
				    tapping it MOCK_TAPS× flips between live Places and the mock deck. */}
				<Pressable onPress={onWordmarkPress} accessibilityRole='image' accessibilityLabel='Grubl'>
					<Wordmark size={58} style={styles.wordmark} />
				</Pressable>
				{mockOn && <Text style={styles.mockBadge}>mock places</Text>}
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
		wordmark: {
			letterSpacing: -1, // tighter tracking for the big hero treatment
			lineHeight: 58 * 0.95,
		},
		// Quiet confirmation that the hidden switch is on — deliberately understated,
		// centred under the wordmark so it reads as a dev-only status, not a feature.
		mockBadge: {
			marginTop: 6,
			fontFamily: FONTS.medium,
			fontSize: 12,
			letterSpacing: 1,
			color: c.muted,
			textAlign: 'center',
			textTransform: 'uppercase',
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
