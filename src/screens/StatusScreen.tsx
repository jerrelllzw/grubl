import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import HardButton from '../components/HardButton';
import { BORDER, COLORS, FONTS, RADII } from '../theme/tokens';

export function LoadingScreen({ location }: { location: string }) {
	return (
		<View style={styles.center}>
			<Text style={styles.wordmark}>
				grubl<Text style={styles.dot}>.</Text>
			</Text>
			<ActivityIndicator size="large" color={COLORS.tomato} style={styles.spinner} />
			<Text style={styles.loadingTitle}>SNIFFING OUT SPOTS</Text>
			<Text style={styles.loadingSub} numberOfLines={2}>
				near {location}
			</Text>
		</View>
	);
}

export function EmptyScreen({
	reason = 'no-results',
	onAdjust,
}: {
	reason?: 'location' | 'no-results';
	onAdjust: () => void;
}) {
	const isLocation = reason === 'location';
	return (
		<View style={styles.center}>
			<Text style={styles.headline}>{isLocation ? 'WHERE’S\nTHAT?' : 'TOUGH\nLUCK.'}</Text>
			<Text style={styles.body}>
				{isLocation
					? 'We couldn’t find that place.\nCheck the spelling or tap the\nlocation button to use GPS.'
					: 'Nothing matched your search.\nWiden the radius or drop a filter.'}
			</Text>
			<HardButton
				dx={5}
				dy={5}
				color={COLORS.ink}
				radius={RADII.sticker}
				onPress={onAdjust}
				accessibilityLabel="Adjust search"
				containerStyle={styles.button}
				faceStyle={styles.buttonFace}
			>
				<Text style={styles.buttonText}>ADJUST SEARCH</Text>
			</HardButton>
		</View>
	);
}

const styles = StyleSheet.create({
	center: {
		flex: 1,
		backgroundColor: COLORS.cream,
		alignItems: 'center',
		justifyContent: 'center',
		padding: 36,
	},
	wordmark: {
		fontFamily: FONTS.display,
		fontSize: 52,
		color: COLORS.ink,
		letterSpacing: -1,
	},
	dot: {
		color: COLORS.tomato,
	},
	spinner: {
		marginTop: 26,
		marginBottom: 20,
	},
	loadingTitle: {
		fontFamily: FONTS.bold,
		fontSize: 15,
		letterSpacing: 1.5,
		color: COLORS.ink,
	},
	loadingSub: {
		marginTop: 6,
		fontFamily: FONTS.medium,
		fontSize: 15,
		color: COLORS.muted,
		textAlign: 'center',
	},
	headline: {
		fontFamily: FONTS.display,
		fontSize: 44,
		lineHeight: 44,
		color: COLORS.ink,
		textAlign: 'center',
	},
	body: {
		marginTop: 16,
		fontFamily: FONTS.medium,
		fontSize: 17,
		color: COLORS.muted,
		textAlign: 'center',
	},
	button: {
		marginTop: 30,
	},
	buttonFace: {
		paddingVertical: 16,
		paddingHorizontal: 28,
		alignItems: 'center',
		backgroundColor: COLORS.yolk,
		borderWidth: BORDER,
		borderColor: COLORS.ink,
	},
	buttonText: {
		fontFamily: FONTS.display,
		fontSize: 18,
		color: COLORS.ink,
	},
});
