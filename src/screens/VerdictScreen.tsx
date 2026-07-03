import React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CardFace from '../components/CardFace';
import HardButton from '../components/HardButton';
import { mapsUrl, type Restaurant } from '../data/restaurants';
import { BORDER, COLORS, FONTS, RADII } from '../theme/tokens';

export default function VerdictScreen({
	winner,
	likesCount,
	showRating,
	onAgain,
	onNewSearch,
}: {
	winner: Restaurant | null;
	likesCount: number;
	showRating: boolean;
	onAgain: () => void;
	onNewSearch: () => void;
}) {
	const insets = useSafeAreaInsets();
	return (
		<View style={[styles.container, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 40 }]}>
			{winner ? (
				<>
					<View style={styles.headlineWrap}>
						<Text style={styles.headline}>
							GO EAT AT{'\n'}
							<Text style={styles.headlineName}>{winner.name.toUpperCase()}</Text>
						</Text>
					</View>

					<View style={styles.winnerCard}>
						<CardFace
							restaurant={winner}
							showRating={showRating}
							cardRadius={22}
							shadow={{ dx: 7, dy: 7, color: COLORS.tomato }}
							nameSize={20}
							metaSize={14}
						/>
					</View>

					<Text style={styles.caption}>Picked from your {likesCount} yums. No take-backs.</Text>
				</>
			) : (
				<>
					<Text style={styles.toughHeadline}>TOUGH{'\n'}CROWD.</Text>
					<Text style={styles.toughBody}>You said nah to everything.{'\n'}Hunger will change your mind.</Text>
				</>
			)}

			<View style={styles.footer}>
				{winner && (
					<HardButton
						dx={6}
						dy={6}
						color={COLORS.tomato}
						radius={RADII.cta}
						onPress={() => Linking.openURL(mapsUrl(winner))}
						containerStyle={styles.mapsContainer}
						faceStyle={styles.mapsFace}
					>
						<Text style={styles.mapsText}>OPEN IN MAPS →</Text>
					</HardButton>
				)}

				<HardButton
					dx={5}
					dy={5}
					color={COLORS.ink}
					radius={RADII.sticker}
					onPress={onAgain}
					containerStyle={styles.againContainer}
					faceStyle={styles.againFace}
				>
					<Text style={styles.againText}>SWIPE AGAIN</Text>
				</HardButton>

				<Pressable onPress={onNewSearch} style={styles.newSearch} hitSlop={8}>
					<Text style={styles.newSearchText}>New search</Text>
				</Pressable>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: COLORS.cream,
		paddingHorizontal: 28,
		alignItems: 'center',
	},
	headlineWrap: {
		transform: [{ rotate: '-2deg' }],
	},
	headline: {
		fontFamily: FONTS.display,
		fontSize: 38,
		lineHeight: 38,
		color: COLORS.ink,
		textAlign: 'center',
	},
	headlineName: {
		color: COLORS.tomato,
	},
	winnerCard: {
		marginTop: 26,
		width: '100%',
		maxWidth: 300,
		height: 300,
	},
	caption: {
		marginTop: 18,
		fontFamily: FONTS.semibold,
		fontSize: 15,
		color: COLORS.muted,
		textAlign: 'center',
	},
	toughHeadline: {
		marginTop: 40,
		fontFamily: FONTS.display,
		fontSize: 38,
		lineHeight: 38 * 1.05,
		color: COLORS.ink,
		textAlign: 'center',
	},
	toughBody: {
		marginTop: 14,
		fontFamily: FONTS.medium,
		fontSize: 17,
		color: COLORS.muted,
		textAlign: 'center',
	},
	footer: {
		marginTop: 'auto',
		width: '100%',
	},
	mapsContainer: {
		width: '100%',
		marginBottom: 14,
	},
	mapsFace: {
		width: '100%',
		paddingVertical: 18,
		alignItems: 'center',
		backgroundColor: COLORS.ink,
		borderWidth: BORDER,
		borderColor: COLORS.ink,
	},
	mapsText: {
		fontFamily: FONTS.display,
		fontSize: 20,
		color: COLORS.cream,
	},
	againContainer: {
		width: '100%',
	},
	againFace: {
		width: '100%',
		paddingVertical: 18,
		alignItems: 'center',
		backgroundColor: COLORS.yolk,
		borderWidth: BORDER,
		borderColor: COLORS.ink,
	},
	againText: {
		fontFamily: FONTS.display,
		fontSize: 19,
		color: COLORS.ink,
	},
	newSearch: {
		alignSelf: 'center',
		paddingVertical: 14,
		marginTop: 4,
	},
	newSearchText: {
		fontFamily: FONTS.semibold,
		fontSize: 15,
		color: COLORS.muted,
		textDecorationLine: 'underline',
	},
});
