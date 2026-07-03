import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CardFace from '../components/CardFace';
import HardButton from '../components/HardButton';
import StripePhoto from '../components/StripePhoto';
import { mapsUrl, metaLine, type Restaurant } from '../data/restaurants';
import { BORDER, COLORS, FONTS, RADII } from '../theme/tokens';

export default function VerdictScreen({
	winner,
	likes,
	showRating,
	onReroll,
	onPick,
	onAgain,
	onNewSearch,
}: {
	winner: Restaurant | null;
	likes: Restaurant[];
	showRating: boolean;
	onReroll: () => void;
	onPick: (r: Restaurant) => void;
	onAgain: () => void;
	onNewSearch: () => void;
}) {
	const insets = useSafeAreaInsets();
	const others = winner ? likes.filter((r) => r.id !== winner.id) : [];

	const reroll = () => {
		Haptics.selectionAsync().catch(() => {});
		onReroll();
	};

	const pick = (r: Restaurant) => {
		Haptics.selectionAsync().catch(() => {});
		onPick(r);
	};

	return (
		<ScrollView
			style={styles.scroll}
			contentContainerStyle={[
				styles.container,
				{ paddingTop: insets.top + 40, paddingBottom: insets.bottom + 32 },
			]}
			showsVerticalScrollIndicator={false}
		>
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
							emojiSize={84}
						/>
					</View>

					<Text style={styles.caption}>
						Picked from your {likes.length} {likes.length === 1 ? 'yum' : 'yums'}.
					</Text>

					<HardButton
						dx={6}
						dy={6}
						color={COLORS.tomato}
						radius={RADII.cta}
						onPress={() => Linking.openURL(mapsUrl(winner))}
						accessibilityLabel={`Open ${winner.name} in Maps`}
						containerStyle={styles.mapsContainer}
						faceStyle={styles.mapsFace}
					>
						<Text style={styles.mapsText}>OPEN IN MAPS →</Text>
					</HardButton>

					{others.length > 0 && (
						<>
							<HardButton
								dx={5}
								dy={5}
								color={COLORS.ink}
								radius={RADII.sticker}
								onPress={reroll}
								accessibilityLabel="Pick another from your shortlist"
								containerStyle={styles.rerollContainer}
								faceStyle={styles.rerollFace}
							>
								<Text style={styles.rerollText}>🎲 PICK ANOTHER</Text>
							</HardButton>

							<Text style={styles.shortlistLabel}>OR TAP ONE OF YOUR {others.length} OTHER YUMS</Text>
							<View style={styles.shortlist}>
								{others.map((r) => (
									<Pressable
										key={r.id}
										style={styles.row}
										onPress={() => pick(r)}
										accessibilityRole="button"
										accessibilityLabel={`Make ${r.name} the pick`}
									>
										<View style={styles.swatch}>
											<StripePhoto hue={r.hue} radius={RADII.sticker} />
											<Text style={styles.swatchEmoji}>{r.emoji}</Text>
										</View>
										<View style={styles.rowText}>
											<Text style={styles.rowName} numberOfLines={1}>
												{r.name}
											</Text>
											<Text style={styles.rowMeta} numberOfLines={1}>
												{metaLine(r, showRating)}
											</Text>
										</View>
										<Ionicons name="chevron-forward" size={20} color={COLORS.muted} />
									</Pressable>
								))}
							</View>
						</>
					)}
				</>
			) : (
				<>
					<Text style={styles.toughHeadline}>TOUGH{'\n'}CROWD.</Text>
					<Text style={styles.toughBody}>You said nah to everything.{'\n'}Hunger will change your mind.</Text>
				</>
			)}

			<View style={styles.footer}>
				<Pressable onPress={onAgain} style={styles.link} hitSlop={8} accessibilityRole="button" accessibilityLabel="Swipe the same places again">
					<Text style={styles.linkText}>Swipe again</Text>
				</Pressable>
				<Text style={styles.linkDivider}>·</Text>
				<Pressable onPress={onNewSearch} style={styles.link} hitSlop={8} accessibilityRole="button" accessibilityLabel="Start a new search">
					<Text style={styles.linkText}>New search</Text>
				</Pressable>
			</View>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	scroll: {
		flex: 1,
		backgroundColor: COLORS.cream,
	},
	container: {
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
		marginTop: 24,
		width: '100%',
		maxWidth: 300,
		height: 280,
	},
	caption: {
		marginTop: 16,
		fontFamily: FONTS.semibold,
		fontSize: 15,
		color: COLORS.muted,
		textAlign: 'center',
	},
	mapsContainer: {
		width: '100%',
		marginTop: 22,
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
	rerollContainer: {
		width: '100%',
		marginTop: 14,
	},
	rerollFace: {
		width: '100%',
		paddingVertical: 16,
		alignItems: 'center',
		backgroundColor: COLORS.yolk,
		borderWidth: BORDER,
		borderColor: COLORS.ink,
	},
	rerollText: {
		fontFamily: FONTS.display,
		fontSize: 18,
		color: COLORS.ink,
	},
	shortlistLabel: {
		alignSelf: 'flex-start',
		marginTop: 30,
		marginBottom: 12,
		fontFamily: FONTS.bold,
		fontSize: 12,
		letterSpacing: 1.2,
		color: COLORS.muted,
	},
	shortlist: {
		width: '100%',
		gap: 10,
	},
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		backgroundColor: COLORS.paper,
		borderWidth: BORDER,
		borderColor: COLORS.ink,
		borderRadius: RADII.sticker,
		padding: 10,
	},
	swatch: {
		width: 46,
		height: 46,
		borderRadius: RADII.sticker,
		borderWidth: 2,
		borderColor: COLORS.ink,
		overflow: 'hidden',
		alignItems: 'center',
		justifyContent: 'center',
	},
	swatchEmoji: {
		fontSize: 24,
	},
	rowText: {
		flex: 1,
	},
	rowName: {
		fontFamily: FONTS.display,
		fontSize: 16,
		color: COLORS.ink,
	},
	rowMeta: {
		marginTop: 3,
		fontFamily: FONTS.semibold,
		fontSize: 12,
		color: COLORS.muted,
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
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
		marginTop: 28,
	},
	link: {
		paddingVertical: 10,
	},
	linkText: {
		fontFamily: FONTS.semibold,
		fontSize: 15,
		color: COLORS.muted,
		textDecorationLine: 'underline',
	},
	linkDivider: {
		fontFamily: FONTS.semibold,
		fontSize: 15,
		color: COLORS.muted,
	},
});
