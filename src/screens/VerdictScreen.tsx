import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CardFace from '../components/CardFace';
import HardButton from '../components/HardButton';
import StripePhoto from '../components/StripePhoto';
import { mapsUrl, metaLine, type Restaurant } from '../data/restaurants';
import { BORDER, COLORS, FONTS, RADII } from '../theme/tokens';

export default function VerdictScreen({
	winner,
	shortlist,
	showRating,
	onPick,
	onAgain,
	onNewSearch,
}: {
	winner: Restaurant | null; // null → the user still has to choose from the shortlist
	shortlist: Restaurant[];
	showRating: boolean;
	onPick: (r: Restaurant) => void;
	onAgain: () => void;
	onNewSearch: () => void;
}) {
	const insets = useSafeAreaInsets();
	// Everything on the shortlist that isn't already the pick.
	const others = winner ? shortlist.filter((r) => r.id !== winner.id) : shortlist;

	// Spin the wheel — grubl makes the call for you. We flick a highlight down the
	// shortlist, decelerating like a slot machine, then lock in wherever it lands.
	const [spinIndex, setSpinIndex] = useState<number | null>(null);
	const spinning = spinIndex !== null;
	const spinTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		return () => {
			if (spinTimer.current !== null) clearTimeout(spinTimer.current);
		};
	}, []);

	const spin = () => {
		if (spinning || shortlist.length < 2) return;
		const totalTicks = 22 + Math.floor(Math.random() * shortlist.length);
		let count = 0;
		const step = () => {
			const current = count % shortlist.length;
			setSpinIndex(current);
			Haptics.selectionAsync().catch(() => {});
			count += 1;
			if (count < totalTicks) {
				// Ease-out: gaps between ticks stretch as the wheel settles.
				const t = count / totalTicks;
				spinTimer.current = setTimeout(step, 45 + t * t * 300);
			} else {
				const landed = (count - 1) % shortlist.length;
				Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
				spinTimer.current = setTimeout(() => {
					setSpinIndex(null);
					onPick(shortlist[landed]);
				}, 450);
			}
		};
		step();
	};

	const pick = (r: Restaurant) => {
		if (spinning) return;
		Haptics.selectionAsync().catch(() => {});
		onPick(r);
	};

	const renderRows = (list: Restaurant[], highlightIdx: number | null) => (
		<View style={styles.shortlist}>
			{list.map((r, i) => (
				<Pressable
					key={r.id}
					style={[styles.row, highlightIdx === i && styles.rowActive]}
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
							{metaLine(r, showRating)}
						</Text>
					</View>
					<Ionicons name="chevron-forward" size={20} color={COLORS.muted} />
				</Pressable>
			))}
		</View>
	);

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
							showRating={showRating}
							cardRadius={22}
							shadow={{ dx: 7, dy: 7, color: COLORS.tomato }}
							nameSize={20}
							metaSize={14}
							emojiSize={84}
						/>
					</View>

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
							<Text style={styles.shortlistLabel}>
								CHANGED YOUR MIND? TAP ANOTHER OF YOUR {others.length}
							</Text>
							{renderRows(others, null)}
						</>
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
							<Text style={styles.chooseBody}>Can’t decide? Let grubl call it.</Text>
							<HardButton
								dx={6}
								dy={6}
								color={COLORS.ink}
								radius={RADII.cta}
								onPress={spin}
								disabled={spinning}
								accessibilityLabel="Spin the wheel — let grubl pick for you"
								containerStyle={styles.spinContainer}
								faceStyle={styles.spinFace}
							>
								<Text style={styles.spinText}>{spinning ? 'SPINNING…' : 'SPIN THE WHEEL 🎲'}</Text>
							</HardButton>
							<Text style={styles.orTap}>or tap one yourself</Text>
						</>
					) : (
						<Text style={styles.chooseBody}>Only one made the cut. Tap it.</Text>
					)}

					{renderRows(shortlist, spinIndex)}
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
	mapsContainer: {
		width: '100%',
		marginTop: 24,
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
	chooseBody: {
		marginTop: 16,
		fontFamily: FONTS.medium,
		fontSize: 16,
		color: COLORS.muted,
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
		backgroundColor: COLORS.yolk,
		borderWidth: BORDER,
		borderColor: COLORS.ink,
	},
	spinText: {
		fontFamily: FONTS.display,
		fontSize: 20,
		color: COLORS.ink,
	},
	orTap: {
		marginTop: 12,
		fontFamily: FONTS.medium,
		fontSize: 13,
		color: COLORS.muted,
		textAlign: 'center',
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
		marginTop: 20,
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
	rowActive: {
		backgroundColor: COLORS.yolk,
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
