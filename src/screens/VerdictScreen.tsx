import * as Haptics from 'expo-haptics';
import { useNavigation } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { AppState, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CardFace from '../components/CardFace';
import HardButton from '../components/HardButton';
import SlotReel from '../components/SlotReel';
import StripePhoto from '../components/StripePhoto';
import { mapsUrl, metaLine, uniqueById, type Restaurant } from '../data/restaurants';
import { useColors, useThemedStyles } from '../theme/theme';
import { BORDER, FONTS, RADII, type Palette } from '../theme/tokens';

export default function VerdictScreen({
	winner,
	shortlist,
	deck,
	swipeIndex,
	onPick,
	onReshuffle,
	onNewSearch,
}: {
	winner: Restaurant | null; // null → the user still has to choose from the shortlist
	shortlist: Restaurant[];
	deck: Restaurant[]; // the full swiped deck — lets grubl pick even with an empty shortlist
	swipeIndex: number; // where swiping stopped; === deck.length only if the deck was finished
	onPick: (r: Restaurant) => void;
	onReshuffle: () => void; // drop the locked-in pick, back to the shortlist / wheel
	onNewSearch: () => void;
}) {
	const insets = useSafeAreaInsets();
	const c = useColors();
	const styles = useThemedStyles(makeStyles);
	const hasShortlist = shortlist.length > 0;
	// Did they swipe all the way through? Only then does an empty shortlist fall
	// back to the whole deck ("liked nothing — pick anyway"). If they opened the
	// shortlist early with nothing saved, it's just empty — no list, no wheel.
	const sawWholeDeck = swipeIndex >= deck.length;
	const showList = hasShortlist || sawWholeDeck;
	// What Grubl picks from / the list renders: the shortlist, or the whole deck
	// once it's been fully swiped with nothing kept. Dedupe by id so the list keys
	// and the wheel never repeat an entry.
	const candidates = uniqueById(hasShortlist ? shortlist : deck);
	const canSpin = showList && candidates.length >= 2;

	// Spin the wheel — Grubl makes the call. The candidates roll past a fixed window
	// like a slot machine (see SlotReel) and decelerate onto the pick.
	const [spinTarget, setSpinTarget] = useState<number | null>(null);
	const spinning = spinTarget !== null;

	// Height of the scrollable list box, measured so the spinning reel can fill the
	// exact same area — the reel is a skin over this list, not a separate widget.
	const [listH, setListH] = useState(0);

	// Handing off to the Maps app. Once tapped, disable the button and show
	// "OPENING…" so a double-tap can't fire two openURLs. The tap only flips the
	// flag; the actual openURL runs in the effect below so React paints the
	// "OPENING…" frame *before* Maps backgrounds us — otherwise the launch fires
	// in the same tick and the frame never shows.
	const [opening, setOpening] = useState(false);
	useEffect(() => {
		if (!opening || !winner) return;
		let cancelled = false;
		// Clear the flag when we return to the foreground (Maps backgrounded us),
		// so the button goes live again for a second trip.
		const sub = AppState.addEventListener('change', (state) => {
			if (state === 'active') setOpening(false);
		});
		Linking.openURL(mapsUrl(winner)).catch(() => {
			// Couldn't hand off — drop back to a live button so they can retry.
			if (!cancelled) setOpening(false);
		});
		return () => {
			cancelled = true;
			sub.remove();
		};
	}, [opening, winner]);

	const openInMaps = () => {
		if (!opening && winner) setOpening(true);
	};

	// The shortlist and winner views share this one route, so a device back from a
	// locked-in pick would pop straight to the swipe deck. Intercept it: while a
	// winner is showing, back just drops the pick and returns to the shortlist. Only
	// a genuine back (GO_BACK) is caught — "New search" (dismissTo) still passes.
	const navigation = useNavigation();
	useEffect(() => {
		const unsub = navigation.addListener('beforeRemove', (e) => {
			if (winner && e.data.action.type === 'GO_BACK') {
				e.preventDefault();
				onReshuffle();
			}
		});
		return unsub;
	}, [navigation, winner, onReshuffle]);

	const spin = () => {
		if (spinning || !canSpin) return;
		Haptics.selectionAsync().catch(() => {});
		setSpinTarget(Math.floor(Math.random() * candidates.length));
	};

	const pick = (r: Restaurant) => {
		if (spinning) return;
		Haptics.selectionAsync().catch(() => {});
		onPick(r);
	};

	// Rows drop in one after another (capped stagger) so the shortlist assembles
	// itself rather than appearing all at once.
	const renderRow = (r: Restaurant, i: number) => (
		<Animated.View key={r.id} entering={FadeInDown.delay(Math.min(i, 8) * 55).duration(360)}>
			<Pressable
				style={styles.row}
				onPress={() => pick(r)}
				disabled={spinning}
				accessibilityRole='button'
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
			</Pressable>
		</Animated.View>
	);

	if (winner) {
		// A pick is locked in — spun for, or tapped from the shortlist.
		return (
			<View style={styles.wrap}>
				<ScrollView
					style={styles.scroll}
					contentContainerStyle={[styles.container, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 32 }]}
					showsVerticalScrollIndicator={false}
				>
					{/* The card below is the place — headline stays generic so the name
					    isn't shown twice. The verdict lands as a beat: title drops in,
					    then the card pops (spring zoom), then the actions follow. */}
					<Animated.View entering={FadeInDown.duration(420)}>
						<View style={styles.headlineWrap}>
							<Text style={styles.headline}>
								EAT <Text style={styles.headlineName}>HERE.</Text>
							</Text>
						</View>
					</Animated.View>

					<Animated.View
						entering={ZoomIn.delay(160).duration(520).springify().damping(13).stiffness(150)}
						style={styles.winnerCard}
					>
						<CardFace
							restaurant={winner}
							cardRadius={22}
							shadow={{ dx: 7, dy: 7, color: c.shadow }}
							nameSize={20}
							metaSize={14}
							emojiSize={84}
						/>
					</Animated.View>

					<Animated.View entering={FadeInDown.delay(360).duration(420)} style={styles.mapsContainer}>
						<HardButton
							dx={6}
							dy={6}
							color={c.shadow}
							radius={RADII.cta}
							onPress={openInMaps}
							busy={opening}
							accessibilityLabel={`Open ${winner.name} in Maps`}
							faceStyle={styles.mapsFace}
						>
							<Text style={styles.mapsText}>{opening ? 'OPENING…' : 'OPEN IN MAPS →'}</Text>
						</HardButton>
					</Animated.View>

					{/* Only way back off the winner: re-open the list, or start fresh.
					    No "swipe again" — the flow stays linear. */}
					<Animated.View entering={FadeInDown.delay(460).duration(420)} style={styles.footer}>
						{canSpin && (
							<>
								<Pressable
									onPress={onReshuffle}
									style={styles.link}
									hitSlop={8}
									accessibilityRole='button'
									accessibilityLabel='View your shortlist again'
								>
									<Text style={styles.linkText}>View shortlist again</Text>
								</Pressable>
								<Text style={styles.linkDivider}>·</Text>
							</>
						)}
						<Pressable
							onPress={onNewSearch}
							style={styles.link}
							hitSlop={8}
							accessibilityRole='button'
							accessibilityLabel='Start a new search'
						>
							<Text style={styles.linkText}>New search</Text>
						</Pressable>
					</Animated.View>
				</ScrollView>
			</View>
		);
	}

	// No pick yet — the "deciding" view. Three fixed zones: header, a scrollable
	// list of candidates, and a pinned SPIN CTA that's always onscreen. Spinning
	// swaps the list box for the reel in place, so the list appears to start rolling.
	return (
		<View style={styles.wrap}>
			<View style={[styles.deciding, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}>
				<Animated.View entering={FadeInDown.duration(420)} style={styles.header}>
					<View style={styles.headlineWrap}>
						<Text style={styles.headline}>
							{hasShortlist ? 'YOUR\n' : 'NOTHING\n'}
							<Text style={styles.headlineName}>{hasShortlist ? 'SHORTLIST' : 'SHORTLISTED'}</Text>
						</Text>
					</View>
					{/* Kept constant while spinning so the header height (and thus the
					    list box the reel fills) doesn't shift mid-spin. */}
					<Text style={styles.chooseBody}>
						{showList
							? canSpin
								? 'Pick a place, or let Grubl decide.'
								: 'Only one match — tap to choose.'
							: 'Swipe right on places you like —\nthey’ll gather here.'}
					</Text>
				</Animated.View>

				{showList ? (
					<View style={styles.listZone}>
						{/* Card frame around the list. The reel renders inside the same
						    frame (measured via listInner) so the skin stays aligned. */}
						<View style={styles.listCard}>
							<View style={styles.listInner} onLayout={(e) => setListH(e.nativeEvent.layout.height)}>
								{spinning && spinTarget !== null && listH > 0 ? (
									<SlotReel
										items={candidates}
										targetIndex={spinTarget}
										windowHeight={listH}
										onSettle={() => {
											const chosen = candidates[spinTarget];
											setSpinTarget(null);
											onPick(chosen);
										}}
									/>
								) : (
									<ScrollView
										style={styles.listScroll}
										contentContainerStyle={styles.listContent}
										showsVerticalScrollIndicator={false}
									>
										{candidates.map((r, i) => renderRow(r, i))}
									</ScrollView>
								)}
							</View>
						</View>
					</View>
				) : (
					// Opened the shortlist with nothing saved yet — no list, no wheel.
					<View style={styles.emptyZone}>
						<Text style={styles.emptyMark}>🔖</Text>
					</View>
				)}

				{showList ? (
					canSpin && (
						<HardButton
							dx={6}
							dy={6}
							color={c.shadow}
							radius={RADII.cta}
							onPress={spin}
							busy={spinning}
							accessibilityLabel='Pick for me — let Grubl decide'
							containerStyle={styles.spinContainer}
							faceStyle={styles.spinFace}
						>
							<Text style={styles.spinText}>{spinning ? 'PICKING…' : 'PICK FOR ME'}</Text>
						</HardButton>
					)
				) : (
					<HardButton
						dx={6}
						dy={6}
						color={c.shadow}
						radius={RADII.cta}
						onPress={() => navigation.goBack()}
						accessibilityLabel='Keep swiping'
						containerStyle={styles.spinContainer}
						faceStyle={styles.keepFace}
					>
						<Text style={styles.keepText}>← KEEP SWIPING</Text>
					</HardButton>
				)}
			</View>
		</View>
	);
}

const makeStyles = (c: Palette) =>
	StyleSheet.create({
		wrap: {
			flex: 1,
			backgroundColor: c.cream,
		},
		scroll: {
			flex: 1,
			backgroundColor: c.cream,
		},
		container: {
			paddingHorizontal: 28,
			alignItems: 'center',
			// Float the winner block in the vertical centre; padding acts as the min gap.
			flexGrow: 1,
			justifyContent: 'center',
		},
		// Deciding phase: three fixed vertical zones (header · scrollable list · CTA).
		deciding: {
			flex: 1,
			paddingHorizontal: 28,
		},
		header: {
			alignItems: 'center',
		},
		// Grows to fill the space between the header and the pinned CTA.
		listZone: {
			flex: 1,
			alignSelf: 'stretch',
			marginTop: 20,
		},
		// Card frame around the whole list of places.
		listCard: {
			flex: 1,
			borderWidth: BORDER,
			borderColor: c.ink,
			borderRadius: RADII.card,
			padding: 10,
			overflow: 'hidden',
		},
		// The padded interior — both the list and the reel fill exactly this box.
		listInner: {
			flex: 1,
		},
		listScroll: {
			flex: 1,
		},
		listContent: {
			gap: 10,
		},
		// Empty shortlist (opened early): fills the list space with a quiet mark.
		emptyZone: {
			flex: 1,
			alignSelf: 'stretch',
			alignItems: 'center',
			justifyContent: 'center',
		},
		emptyMark: {
			fontSize: 72,
			opacity: 0.5,
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
			// CardFace is sized to its content now, so no fixed height — let it hug.
		},
		mapsContainer: {
			width: '100%',
			maxWidth: 300, // align edges with the winner card it acts on
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
			marginTop: 16,
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
		// Secondary CTA for the empty state — quiet paper, not the brass accent.
		keepFace: {
			width: '100%',
			paddingVertical: 18,
			alignItems: 'center',
			backgroundColor: c.paper,
			borderWidth: BORDER,
			borderColor: c.ink,
		},
		keepText: {
			fontFamily: FONTS.display,
			fontSize: 20,
			color: c.ink,
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
