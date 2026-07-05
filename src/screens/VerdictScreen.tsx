import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CardFace from '../components/CardFace';
import DetailSheet from '../components/DetailSheet';
import HardButton from '../components/HardButton';
import SlotReel from '../components/SlotReel';
import StripePhoto from '../components/StripePhoto';
import { mapsUrl, metaLine, type Restaurant } from '../data/restaurants';
import { useColors, useThemedStyles } from '../theme/theme';
import { BORDER, FONTS, RADII, type Palette } from '../theme/tokens';

export default function VerdictScreen({
	winner,
	shortlist,
	deck,
	onPick,
	onBack,
	onReshuffle,
	onAgain,
	onNewSearch,
}: {
	winner: Restaurant | null; // null → the user still has to choose from the shortlist
	shortlist: Restaurant[];
	deck: Restaurant[]; // the full swiped deck — lets grubl pick even with an empty shortlist
	onPick: (r: Restaurant) => void;
	onBack: () => void; // resume swiping where they left off (shortlist kept)
	onReshuffle: () => void; // drop the locked-in pick, back to the shortlist / wheel
	onAgain: () => void;
	onNewSearch: () => void;
}) {
	const insets = useSafeAreaInsets();
	const c = useColors();
	const styles = useThemedStyles(makeStyles);
	// Everything on the shortlist that isn't already the pick.
	const others = winner ? shortlist.filter((r) => r.id !== winner.id) : shortlist;

	const [detail, setDetail] = useState<Restaurant | null>(null); // place shown in the detail sheet

	// Spin the wheel — Grubl makes the call. The shortlist rolls past a fixed window
	// like a slot machine (see SlotReel) and decelerates onto the pick.
	const [spinTarget, setSpinTarget] = useState<number | null>(null);
	const spinning = spinTarget !== null;

	const spin = () => {
		if (spinning || shortlist.length < 2) return;
		Haptics.selectionAsync().catch(() => {});
		setSpinTarget(Math.floor(Math.random() * shortlist.length));
	};

	const pick = (r: Restaurant) => {
		if (spinning) return;
		Haptics.selectionAsync().catch(() => {});
		onPick(r);
	};

	// The "decide for me" promise, honoured even when nothing was shortlisted:
	// pick a random place from everything we showed.
	const surprise = () => {
		if (deck.length === 0) return;
		const choice = deck[Math.floor(Math.random() * deck.length)];
		Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
		onPick(choice);
	};

	const renderRows = (list: Restaurant[]) => (
		<View style={styles.shortlist}>
			{list.map((r) => (
				<Pressable
					key={r.id}
					style={styles.row}
					onPress={() => pick(r)}
					disabled={spinning}
					accessibilityRole="button"
					accessibilityLabel={`Pick ${r.name}`}
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
							{metaLine(r)}
						</Text>
					</View>
					<Pressable
						style={styles.rowInfo}
						onPress={() => setDetail(r)}
						disabled={spinning}
						hitSlop={8}
						accessibilityRole="button"
						accessibilityLabel={`More about ${r.name}`}
					>
						<Ionicons name="information" size={18} color={c.ink} />
					</Pressable>
				</Pressable>
			))}
		</View>
	);

	return (
		<View style={styles.wrap}>
		<ScrollView
			style={styles.scroll}
			contentContainerStyle={[
				styles.container,
				{ paddingTop: insets.top + 40, paddingBottom: insets.bottom + 32 },
			]}
			showsVerticalScrollIndicator={false}
		>
			{winner ? (
				// A pick is locked in — spun for, or tapped from the shortlist.
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
							cardRadius={22}
							shadow={{ dx: 7, dy: 7, color: c.tomato }}
							nameSize={20}
							metaSize={14}
							emojiSize={84}
							onInfo={() => setDetail(winner)}
						/>
					</View>

					<HardButton
						dx={6}
						dy={6}
						color={c.shadow}
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
							<Text style={styles.shortlistLabel}>
								OR PICK ANOTHER OF YOUR {others.length}
							</Text>
							{renderRows(others)}
						</>
					)}

					{shortlist.length >= 2 && (
						<Pressable
							onPress={onReshuffle}
							style={styles.reshuffle}
							hitSlop={8}
							accessibilityRole="button"
							accessibilityLabel="Spin again — let Grubl re-pick from your shortlist"
						>
							<Text style={styles.reshuffleText}>↻ Spin again</Text>
						</Pressable>
					)}
				</>
			) : shortlist.length > 0 ? (
				// No pick yet — spin the wheel, or tap one yourself.
				<>
					<View style={styles.headlineWrap}>
						<Text style={styles.headline}>
							YOUR{'\n'}
							<Text style={styles.headlineName}>SHORTLIST</Text>
						</Text>
					</View>

					{shortlist.length >= 2 ? (
						<>
							<Text style={styles.chooseBody}>
								{spinning ? 'Spinning…' : 'Can’t decide? Let Grubl pick.'}
							</Text>
							<HardButton
								dx={6}
								dy={6}
								color={c.shadow}
								radius={RADII.cta}
								onPress={spin}
								disabled={spinning}
								accessibilityLabel="Spin the wheel — let Grubl pick for you"
								containerStyle={styles.spinContainer}
								faceStyle={styles.spinFace}
							>
								<Text style={styles.spinText}>{spinning ? 'SPINNING…' : 'SPIN THE WHEEL'}</Text>
							</HardButton>

							{spinning && spinTarget !== null ? (
								<SlotReel
									items={shortlist}
									targetIndex={spinTarget}
									onSettle={() => {
										const chosen = shortlist[spinTarget];
										setSpinTarget(null);
										onPick(chosen);
									}}
								/>
							) : (
								<>
									<Text style={styles.orTap}>or tap one yourself</Text>
									{renderRows(shortlist)}
								</>
							)}
						</>
					) : (
						<>
							<Text style={styles.chooseBody}>Only one match. Tap to choose.</Text>
							{renderRows(shortlist)}
						</>
					)}
				</>
			) : (
				<>
					<Text style={styles.toughHeadline}>NO{'\n'}PICKS.</Text>
					<Text style={styles.toughBody}>You passed on everything.{'\n'}Pick one anyway?</Text>
					{deck.length > 0 && (
						<HardButton
							dx={6}
							dy={6}
							color={c.shadow}
							radius={RADII.cta}
							onPress={surprise}
							accessibilityLabel="Pick one anyway — let Grubl choose from everything nearby"
							containerStyle={styles.surpriseContainer}
							faceStyle={styles.surpriseFace}
						>
							<Text style={styles.surpriseText}>PICK ONE ANYWAY</Text>
						</HardButton>
					)}
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

			<Pressable
				style={[styles.backButton, { top: insets.top + 12 }]}
				onPress={onBack}
				hitSlop={8}
				accessibilityRole="button"
				accessibilityLabel="Back to swiping"
			>
				<Ionicons name="chevron-back" size={22} color={c.ink} />
			</Pressable>

			<DetailSheet
				restaurant={detail}
				visible={detail !== null}
				onClose={() => setDetail(null)}
			/>
		</View>
	);
}

const makeStyles = (c: Palette) => StyleSheet.create({
	wrap: {
		flex: 1,
		backgroundColor: c.cream,
	},
	backButton: {
		position: 'absolute',
		left: 20,
		width: 40,
		height: 40,
		borderRadius: RADII.pill,
		backgroundColor: c.paper,
		borderWidth: BORDER,
		borderColor: c.ink,
		alignItems: 'center',
		justifyContent: 'center',
	},
	scroll: {
		flex: 1,
		backgroundColor: c.cream,
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
		color: c.ink,
		textAlign: 'center',
	},
	headlineName: {
		color: c.tomato,
	},
	winnerCard: {
		marginTop: 24,
		width: '100%',
		maxWidth: 300,
		height: 280,
	},
	mapsContainer: {
		width: '100%',
		marginTop: 24,
	},
	mapsFace: {
		width: '100%',
		paddingVertical: 18,
		alignItems: 'center',
		backgroundColor: c.brass,
		borderWidth: BORDER,
		borderColor: c.brassDeep,
	},
	mapsText: {
		fontFamily: FONTS.display,
		fontSize: 20,
		color: c.onAccent,
	},
	chooseBody: {
		marginTop: 16,
		fontFamily: FONTS.medium,
		fontSize: 16,
		color: c.muted,
		textAlign: 'center',
	},
	spinContainer: {
		width: '100%',
		marginTop: 18,
	},
	spinFace: {
		width: '100%',
		paddingVertical: 18,
		alignItems: 'center',
		backgroundColor: c.brass,
		borderWidth: BORDER,
		borderColor: c.brassDeep,
	},
	spinText: {
		fontFamily: FONTS.display,
		fontSize: 20,
		color: c.onAccent,
	},
	orTap: {
		marginTop: 12,
		fontFamily: FONTS.medium,
		fontSize: 13,
		color: c.muted,
		textAlign: 'center',
	},
	shortlistLabel: {
		alignSelf: 'flex-start',
		marginTop: 30,
		marginBottom: 12,
		fontFamily: FONTS.bold,
		fontSize: 12,
		letterSpacing: 1.2,
		color: c.muted,
	},
	reshuffle: {
		marginTop: 24,
		paddingVertical: 8,
	},
	reshuffleText: {
		fontFamily: FONTS.bold,
		fontSize: 15,
		color: c.ink,
		textDecorationLine: 'underline',
	},
	shortlist: {
		width: '100%',
		gap: 10,
		marginTop: 20,
	},
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		backgroundColor: c.paper,
		borderWidth: BORDER,
		borderColor: c.ink,
		borderRadius: RADII.sticker,
		padding: 10,
	},
	swatch: {
		width: 46,
		height: 46,
		borderRadius: RADII.sticker,
		borderWidth: 2,
		borderColor: c.ink,
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
		color: c.ink,
	},
	rowMeta: {
		marginTop: 3,
		fontFamily: FONTS.semibold,
		fontSize: 12,
		color: c.muted,
	},
	rowInfo: {
		width: 34,
		height: 34,
		borderRadius: RADII.pill,
		borderWidth: 2,
		borderColor: c.ink,
		backgroundColor: c.cream,
		alignItems: 'center',
		justifyContent: 'center',
	},
	toughHeadline: {
		marginTop: 40,
		fontFamily: FONTS.display,
		fontSize: 38,
		lineHeight: 38 * 1.05,
		color: c.ink,
		textAlign: 'center',
	},
	toughBody: {
		marginTop: 14,
		fontFamily: FONTS.medium,
		fontSize: 17,
		color: c.muted,
		textAlign: 'center',
	},
	surpriseContainer: {
		width: '100%',
		marginTop: 28,
	},
	surpriseFace: {
		width: '100%',
		paddingVertical: 18,
		alignItems: 'center',
		backgroundColor: c.brass,
		borderWidth: BORDER,
		borderColor: c.brassDeep,
	},
	surpriseText: {
		fontFamily: FONTS.display,
		fontSize: 20,
		color: c.onAccent,
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
		color: c.muted,
		textDecorationLine: 'underline',
	},
	linkDivider: {
		fontFamily: FONTS.semibold,
		fontSize: 15,
		color: c.muted,
	},
});
