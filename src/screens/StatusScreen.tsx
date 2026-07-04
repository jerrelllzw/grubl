import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import HardButton from '../components/HardButton';
import { BORDER, COLORS, FONTS, RADII } from '../theme/tokens';

export function LoadingScreen({ location }: { location: string }) {
	return (
		<View style={styles.center}>
			<Text style={styles.wordmark}>
				Grubl<Text style={styles.dot}>.</Text>
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
	onRetry,
}: {
	reason?: 'location' | 'no-results' | 'error';
	onAdjust: () => void;
	/** Re-runs the last search; used by the connectivity-error variant. */
	onRetry?: () => void;
}) {
	const isError = reason === 'error';
	const isLocation = reason === 'location';

	const headline = isError ? 'NO\nSIGNAL.' : isLocation ? 'WHERE’S\nTHAT?' : 'TOUGH\nLUCK.';
	const body = isError
		? 'Couldn’t reach the kitchen.\nCheck your connection and\ntry again.'
		: isLocation
			? 'We couldn’t find that place.\nCheck the spelling or tap the\nlocation button to use GPS.'
			: 'Nothing matched your search.\nWiden the radius or drop a filter.';

	return (
		<View style={styles.center}>
			<Text style={styles.headline}>{headline}</Text>
			<Text style={styles.body}>{body}</Text>
			{isError && onRetry ? (
				<HardButton
					dx={5}
					dy={5}
					color={COLORS.shadow}
					radius={RADII.sticker}
					onPress={onRetry}
					accessibilityLabel="Try the search again"
					containerStyle={styles.button}
					faceStyle={styles.buttonFace}
				>
					<Text style={styles.buttonText}>TRY AGAIN</Text>
				</HardButton>
			) : (
				<HardButton
					dx={5}
					dy={5}
					color={COLORS.shadow}
					radius={RADII.sticker}
					onPress={onAdjust}
					accessibilityLabel="Adjust search"
					containerStyle={styles.button}
					faceStyle={styles.buttonFace}
				>
					<Text style={styles.buttonText}>ADJUST SEARCH</Text>
				</HardButton>
			)}
			{isError && (
				<Pressable onPress={onAdjust} style={styles.secondaryLink} hitSlop={8} accessibilityRole="button" accessibilityLabel="Adjust search">
					<Text style={styles.secondaryText}>Adjust search</Text>
				</Pressable>
			)}
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
	secondaryLink: {
		marginTop: 18,
		paddingVertical: 6,
	},
	secondaryText: {
		fontFamily: FONTS.semibold,
		fontSize: 15,
		color: COLORS.muted,
		textDecorationLine: 'underline',
	},
});
