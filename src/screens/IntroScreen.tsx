import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HardButton from '../components/HardButton';
import { RADII_OPTIONS } from '../constants/googlePlaces';
import { BORDER, COLORS, FONTS, RADII } from '../theme/tokens';

export default function IntroScreen({
	radius,
	onPickRadius,
	onStart,
}: {
	radius: string;
	onPickRadius: (r: string) => void;
	onStart: () => void;
}) {
	const insets = useSafeAreaInsets();
	return (
		<View style={[styles.container, { paddingTop: insets.top + 44, paddingBottom: insets.bottom + 40 }]}>
			<Text style={styles.wordmark}>
				grubl<Text style={styles.dot}>.</Text>
			</Text>
			<Text style={styles.tagline}>Stop scrolling menus.{'\n'}Swipe. Eat. Done.</Text>

			<View style={styles.bottom}>
				<Text style={styles.label}>HOW FAR WILL YOU GO?</Text>
				<View style={styles.chips}>
					{RADII_OPTIONS.map((r) => {
						const active = radius === r;
						return (
							<Pressable
								key={r}
								style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}
								onPress={() => onPickRadius(r)}
							>
								<Text style={[styles.chipText, active ? styles.chipTextActive : styles.chipTextInactive]}>{r}</Text>
							</Pressable>
						);
					})}
				</View>

				<HardButton
					dx={6}
					dy={6}
					color={COLORS.tomato}
					radius={RADII.cta}
					onPress={onStart}
					containerStyle={styles.ctaContainer}
					faceStyle={styles.ctaFace}
				>
					<Text style={styles.ctaText}>FEED ME →</Text>
				</HardButton>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: COLORS.cream,
		paddingHorizontal: 28,
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
	bottom: {
		marginTop: 'auto',
	},
	label: {
		fontFamily: FONTS.bold,
		fontSize: 13,
		letterSpacing: 1.5,
		textTransform: 'uppercase',
		color: COLORS.ink,
		marginBottom: 12,
	},
	chips: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 10,
	},
	chip: {
		borderRadius: RADII.chip,
		borderWidth: BORDER,
		borderColor: COLORS.ink,
		paddingVertical: 10,
		paddingHorizontal: 16,
	},
	chipActive: {
		backgroundColor: COLORS.ink,
	},
	chipInactive: {
		backgroundColor: COLORS.paper,
	},
	chipText: {
		fontFamily: FONTS.bold,
		fontSize: 15,
	},
	chipTextActive: {
		color: COLORS.cream,
	},
	chipTextInactive: {
		color: COLORS.ink,
	},
	ctaContainer: {
		marginTop: 28,
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
