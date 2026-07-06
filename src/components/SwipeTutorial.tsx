import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors, useThemedStyles } from '../theme/theme';
import { BORDER, FONTS, RADII, type Palette } from '../theme/tokens';
import HardButton from './HardButton';

// One-time coach overlay shown the first time the swipe deck opens. It explains the
// four things the deck can't teach on its own — the two swipe directions, undo, and
// where the shortlist lives — then gets out of the way for good (see
// utils/onboarding.ts for the "seen" flag).

type Row = {
	icon: keyof typeof Ionicons.glyphMap;
	tintKey: 'green' | 'rose' | 'ink';
	title: string;
	body: string;
};

const ROWS: Row[] = [
	{ icon: 'arrow-forward', tintKey: 'green', title: 'Swipe right for YES', body: 'Add a place to your shortlist.' },
	{ icon: 'arrow-back', tintKey: 'rose', title: 'Swipe left for NO', body: 'Skip it and see the next one.' },
	{ icon: 'arrow-undo', tintKey: 'ink', title: 'Tap undo', body: 'Slipped? Rewind your last swipe.' },
	{ icon: 'list', tintKey: 'ink', title: 'Hit SHORTLIST', body: 'See your picks — then let Grubl choose one.' },
];

export default function SwipeTutorial({ onDismiss }: { onDismiss: () => void }) {
	const insets = useSafeAreaInsets();
	const c = useColors();
	const styles = useThemedStyles(makeStyles);
	const tint = { green: c.green, rose: c.rose, ink: c.ink };

	return (
		<Animated.View
			entering={FadeIn.duration(220)}
			exiting={FadeOut.duration(160)}
			style={styles.scrim}
			// Trap taps so nothing behind the overlay reacts while it's up.
			pointerEvents="auto"
		>
			<View style={[styles.card, { marginTop: insets.top + 24, marginBottom: insets.bottom + 24 }]}>
				<Text style={styles.kicker}>HOW TO GRUBL</Text>
				<Text style={styles.heading}>Swipe to decide</Text>

				<View style={styles.rows}>
					{ROWS.map((r) => (
						<View key={r.title} style={styles.row}>
							<View style={[styles.iconWrap, { borderColor: tint[r.tintKey] }]}>
								<Ionicons name={r.icon} size={22} color={tint[r.tintKey]} />
							</View>
							<View style={styles.rowText}>
								<Text style={styles.rowTitle}>{r.title}</Text>
								<Text style={styles.rowBody}>{r.body}</Text>
							</View>
						</View>
					))}
				</View>

				<HardButton
					dx={5}
					dy={5}
					color={c.shadow}
					radius={RADII.cta}
					onPress={onDismiss}
					accessibilityLabel="Got it — start swiping"
					containerStyle={styles.ctaContainer}
					faceStyle={styles.ctaFace}
				>
					<Text style={styles.ctaText}>GOT IT →</Text>
				</HardButton>
			</View>
		</Animated.View>
	);
}

const makeStyles = (c: Palette) =>
	StyleSheet.create({
		scrim: {
			...StyleSheet.absoluteFillObject,
			zIndex: 100,
			backgroundColor: 'rgba(24,19,16,0.55)',
			justifyContent: 'center',
			alignItems: 'center',
			paddingHorizontal: 24,
		},
		card: {
			alignSelf: 'stretch',
			backgroundColor: c.paper,
			borderRadius: RADII.card,
			borderWidth: BORDER,
			borderColor: c.ink,
			padding: 24,
		},
		kicker: {
			fontFamily: FONTS.bold,
			fontSize: 12,
			letterSpacing: 1.5,
			color: c.brass,
		},
		heading: {
			marginTop: 6,
			fontFamily: FONTS.display,
			fontSize: 28,
			letterSpacing: -0.5,
			color: c.ink,
		},
		rows: {
			marginTop: 20,
			gap: 16,
		},
		row: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: 14,
		},
		iconWrap: {
			width: 44,
			height: 44,
			borderRadius: RADII.pill,
			borderWidth: BORDER,
			backgroundColor: c.cream,
			alignItems: 'center',
			justifyContent: 'center',
		},
		rowText: {
			flex: 1,
		},
		rowTitle: {
			fontFamily: FONTS.bold,
			fontSize: 16,
			color: c.ink,
		},
		rowBody: {
			marginTop: 2,
			fontFamily: FONTS.medium,
			fontSize: 14,
			lineHeight: 14 * 1.35,
			color: c.muted,
		},
		ctaContainer: {
			marginTop: 26,
			alignSelf: 'stretch',
		},
		ctaFace: {
			width: '100%',
			paddingVertical: 16,
			alignItems: 'center',
			backgroundColor: c.brass,
			borderWidth: BORDER,
			borderColor: c.brassDeep,
		},
		ctaText: {
			fontFamily: FONTS.display,
			fontSize: 20,
			color: c.onAccent,
		},
	});
