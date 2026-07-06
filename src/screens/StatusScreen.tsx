import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import HardButton from '../components/HardButton';
import { useColors, useThemedStyles } from '../theme/theme';
import { BORDER, FONTS, RADII, type Palette } from '../theme/tokens';

export function EmptyScreen({
	reason = 'no-results',
	loading = false,
	onAdjust,
	onRetry,
}: {
	reason?: 'location' | 'no-results' | 'error';
	/** True while a retry is refetching — shows a spinner on the retry button. */
	loading?: boolean;
	onAdjust: () => void;
	/** Re-runs the last search; used by the connectivity-error variant. */
	onRetry?: () => void;
}) {
	const c = useColors();
	const styles = useThemedStyles(makeStyles);
	const isError = reason === 'error';
	const isLocation = reason === 'location';

	const headline = isError ? 'NO\nCONNECTION.' : isLocation ? 'NOT\nFOUND.' : 'NO\nMATCHES.';
	const body = isError
		? 'Couldn’t connect.\nCheck your connection and\ntry again.'
		: isLocation
			? 'We couldn’t find that location.\nCheck the spelling or tap the\nlocation button to use GPS.'
			: 'Nothing matched your search.\nWiden the radius or drop a filter.';

	return (
		<View style={styles.center}>
			<Text style={styles.headline}>{headline}</Text>
			<Text style={styles.body}>{body}</Text>
			{isError && onRetry ? (
				<HardButton
					dx={5}
					dy={5}
					color={c.shadow}
					radius={RADII.sticker}
					onPress={loading ? undefined : onRetry}
					accessibilityLabel="Try the search again"
					containerStyle={styles.button}
					faceStyle={styles.buttonFace}
				>
					{loading ? (
						<ActivityIndicator size="small" color={c.onAccent} />
					) : (
						<Text style={styles.buttonText}>TRY AGAIN</Text>
					)}
				</HardButton>
			) : (
				<HardButton
					dx={5}
					dy={5}
					color={c.shadow}
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

const makeStyles = (c: Palette) => StyleSheet.create({
	center: {
		flex: 1,
		backgroundColor: c.cream,
		alignItems: 'center',
		justifyContent: 'center',
		padding: 36,
	},
	headline: {
		fontFamily: FONTS.display,
		fontSize: 44,
		lineHeight: 44,
		color: c.ink,
		textAlign: 'center',
	},
	body: {
		marginTop: 16,
		fontFamily: FONTS.medium,
		fontSize: 17,
		color: c.muted,
		textAlign: 'center',
	},
	button: {
		marginTop: 30,
	},
	buttonFace: {
		paddingVertical: 16,
		paddingHorizontal: 28,
		alignItems: 'center',
		backgroundColor: c.brass,
		borderWidth: BORDER,
		borderColor: c.brassDeep,
	},
	buttonText: {
		fontFamily: FONTS.display,
		fontSize: 18,
		color: c.onAccent,
	},
	secondaryLink: {
		marginTop: 18,
		paddingVertical: 6,
	},
	secondaryText: {
		fontFamily: FONTS.semibold,
		fontSize: 15,
		color: c.muted,
		textDecorationLine: 'underline',
	},
});
