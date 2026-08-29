import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
	Easing,
	FadeIn,
	interpolate,
	runOnJS,
	useAnimatedStyle,
	useSharedValue,
	withTiming,
	type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CardFace from '../components/CardFace';
import HardButton from '../components/HardButton';
import SwipeTutorial from '../components/SwipeTutorial';
import type { Restaurant } from '../data/restaurants';
import { useColors, useThemedStyles } from '../theme/theme';
import { BORDER, FONTS, RADII, type Palette } from '../theme/tokens';
import { hasSeenSwipeTutorial, markSwipeTutorialSeen } from '../utils/onboarding';

const SWIPE_THRESHOLD = 90;
// How many cards are drawn behind the top one. Only the back slot ever reveals a
// card that wasn't already on screen, so only it animates in (see `bgOffsets`).
const BG_SLOTS = [3, 2, 1];
const BACK_SLOT = BG_SLOTS[0];
const FLY_DISTANCE = 640;
const EASE = Easing.in(Easing.ease);

// Every card ends up in one of two piles: skipped ("no"), or shortlisted ("yes").
// Grubl doesn't ask you to pick the winner here — that's the wheel's job later —
// so a right swipe just adds to the shortlist and keeps you on the deck.
type Move = 'no' | 'shortlist';

// A card in the middle of flying off the screen, rendered as a throwaway overlay
// so its exit is fully decoupled from the live top card.
type Flyaway = { id: number; card: Restaurant; move: Move; fromX: number; fromY: number };

export default function SwipeScreen({
	deck,
	initialIndex = 0,
	initialShortlist = [],
	onComplete,
}: {
	deck: Restaurant[];
	/** Card to start on — non-zero when resuming a deck left mid-swipe. */
	initialIndex?: number;
	/** Shortlist carried over when resuming, so earlier "yes" swipes aren't lost. */
	initialShortlist?: Restaurant[];
	/** Deck exhausted or "Shortlist" pressed — hand back the shortlist and stopping index. */
	onComplete: (shortlist: Restaurant[], atIndex: number) => void;
}) {
	const insets = useSafeAreaInsets();
	const c = useColors();
	const styles = useThemedStyles(makeStyles);
	const [index, setIndex] = useState(initialIndex);
	const [shortlistCount, setShortlistCount] = useState(initialShortlist.length);
	// Moves made *this session* — bounds undo so a resumed deck can't rewind past
	// where it picked up (historyRef starts empty even when initialIndex > 0).
	const [moveCount, setMoveCount] = useState(0);
	const shortlistRef = useRef<Restaurant[]>(initialShortlist);
	const historyRef = useRef<Move[]>([]); // each committed move, for undo

	// First-run coach overlay: gate on the persisted flag so it appears exactly once
	// ever, then never again. `undefined` = still checking storage (show nothing yet).
	const [showTutorial, setShowTutorial] = useState<boolean | undefined>(undefined);
	useEffect(() => {
		let alive = true;
		hasSeenSwipeTutorial().then((seen) => {
			if (alive) setShowTutorial(!seen);
		});
		return () => {
			alive = false;
		};
	}, []);
	const dismissTutorial = useCallback(() => {
		setShowTutorial(false);
		markSwipeTutorialSeen();
	}, []);

	// The drag offset lives inside `TopCard`, not here — see that component. This is
	// only the button lock: it stops NO/YES/undo/shortlist double-firing between a
	// commit and the render that acts on it, and clears once `index` has moved.
	const locked = useSharedValue(false);
	useEffect(() => {
		locked.value = false;
	}, [index, locked]);

	// How the incoming top card arrives: 0 = already at rest (a normal advance),
	// ±FLY_DISTANCE = slide in from that side (undo, replaying the card's exit
	// backwards). Read once, when the card mounts.
	const [entryFrom, setEntryFrom] = useState(0);

	// Cards mid-flight off the screen. A committed card doesn't fly off using the
	// top card's own view — that would force us to reset that view's position while
	// it's still visible (the old flash). Instead each departing card is handed to a
	// throwaway overlay with its OWN animation, and the card it was covering simply
	// unmounts, so nothing on screen ever has to be moved back.
	const [flyaways, setFlyaways] = useState<Flyaway[]>([]);
	const flyId = useRef(0);
	const removeFlyaway = useCallback((id: number) => {
		setFlyaways((f) => f.filter((x) => x.id !== id));
	}, []);

	// Commit a move: launch the departing card as an overlay, record it, and advance
	// to the next card. `fromX/fromY` seed the overlay at the card's current on-screen
	// position (finger position for a drag, centre for a button) so it flies on
	// continuously instead of jumping.
	const commit = useCallback(
		(move: Move, fromX: number, fromY: number) => {
			const card = deck[index];
			if (move === 'shortlist' && card) {
				// Guard against ever double-adding the same place (e.g. a stray repeat
				// commit) — the shortlist must stay unique for the verdict list/wheel.
				if (!shortlistRef.current.some((r) => r.id === card.id)) {
					shortlistRef.current = shortlistRef.current.concat(card);
					setShortlistCount(shortlistRef.current.length);
				}
			}
			if (card) {
				const id = flyId.current++;
				setFlyaways((f) => f.concat({ id, card, move, fromX, fromY }));
			}
			historyRef.current.push(move);
			setMoveCount((c) => c + 1);
			Haptics.selectionAsync().catch(() => {});
			// The next card is a brand-new `TopCard`, so it mounts at rest already —
			// there are no offsets left over from this drag to undo.
			setEntryFrom(0);
			// Always advance — even off the end of the deck. Landing on `deck.length`
			// clears the top card so the exhausted deck shows the "all done" state
			// instead of leaving the just-swiped last card sitting there (which you'd
			// otherwise see again on returning from the shortlist).
			const next = index + 1;
			setIndex(next);
			// Deck exhausted: hand off to the shortlist only if there's something in it.
			// With an empty shortlist there's nothing to choose from, so stay put on the
			// "all done" state and let them SWIPE AGAIN rather than pushing an empty list.
			if (next >= deck.length && shortlistRef.current.length > 0) {
				onComplete(shortlistRef.current, next);
			}
		},
		[deck, index, onComplete]
	);

	// Rewind the last committed move: step back a card and drop it from the
	// shortlist if that's where it went.
	const undo = useCallback(() => {
		if (locked.value || moveCount === 0) return;
		const last = historyRef.current.pop();
		setMoveCount((c) => c - 1);
		if (last === 'shortlist') {
			shortlistRef.current = shortlistRef.current.slice(0, -1);
			setShortlistCount(shortlistRef.current.length);
		}
		Haptics.selectionAsync().catch(() => {});
		// Slide the returning card back in from the side it flew off toward.
		setEntryFrom(last === 'shortlist' ? FLY_DISTANCE : -FLY_DISTANCE);
		setIndex(index - 1);
	}, [index, moveCount, locked]);

	// Button-triggered swipe: the card flies off from centre via the overlay.
	const fling = useCallback(
		(dir: Move) => {
			if (locked.value) return;
			locked.value = true;
			commit(dir, 0, 0);
		},
		[commit, locked]
	);

	const handleShortlist = useCallback(() => {
		if (locked.value) return;
		onComplete(shortlistRef.current, index);
	}, [onComplete, index, locked]);

	// Deal the same deck again from the top — the escape hatch from the "all done"
	// state when nothing was shortlisted and you want another pass. Only React state
	// needs wiping: card 0 mounts as a fresh `TopCard` at rest, so there's no stray
	// drag offset to clear.
	const restart = useCallback(() => {
		shortlistRef.current = [];
		historyRef.current = [];
		setShortlistCount(0);
		setMoveCount(0);
		setEntryFrom(0);
		setIndex(0);
	}, []);

	// Every card has been swiped: the index has run off the end of the deck. Shows
	// the "all done" state rather than a stale last card.
	const done = index >= deck.length;

	// Cards behind the top one. The NEXT card (offset 1) is drawn at the top card's
	// exact resting transform, not stepped back with the rest of the stack: dragging
	// the top card aside uncovers it for the whole gesture, so if it sat smaller and
	// lower it would visibly grow and jump up the instant it got promoted. Sitting at
	// rest already, the promotion changes nothing on screen. The visible stack (two
	// edges peeking below) is unchanged — it's just drawn by offsets 2 and 3 now, so
	// there's one more card to render.
	const bgOffsets = BG_SLOTS.filter((o) => index + o < deck.length);

	return (
		<View style={[styles.container, { paddingTop: insets.top + 22, paddingBottom: insets.bottom + 24 }]}>
			<View style={styles.header}>
				<Pressable
					style={[styles.undoButton, moveCount === 0 && styles.undoDisabled]}
					onPress={undo}
					disabled={moveCount === 0}
					hitSlop={8}
					accessibilityRole="button"
					accessibilityState={{ disabled: moveCount === 0 }}
					accessibilityLabel="Undo last swipe"
				>
					<Ionicons name="arrow-undo" size={20} color={c.ink} />
				</Pressable>
				<View style={styles.headerRight}>
					<HardButton
						dx={3}
						dy={3}
						color={c.shadow}
						radius={RADII.pill}
						onPress={handleShortlist}
						accessibilityLabel={
							shortlistCount > 0
								? `View your shortlist — ${shortlistCount} saved`
								: 'View your shortlist'
						}
						faceStyle={styles.chooseFace}
					>
						{/* Leads to the shortlist. A notification-style count badge sits
						    on the button's top-right corner once there's at least one saved
						    place, so the tally of picks pops off the edge instead of being
						    buried in the a11y label. */}
						<View style={styles.chooseInner}>
							<Text style={styles.chooseText}>SHORTLIST</Text>
							<Ionicons name="arrow-forward" size={15} color={c.ink} />
						</View>
						{shortlistCount > 0 && (
							<View style={styles.shortlistBadge}>
								<Text style={styles.shortlistBadgeText}>{shortlistCount}</Text>
							</View>
						)}
					</HardButton>
				</View>
			</View>

			<View style={styles.deck}>
				{/* Cards behind the top one, deepest first. Keyed by their card index so a
				    card sliding forward a slot just updates in place. Offset 1 lands at
				    translateY 0 / scale 1 — squarely under the top card, ready to be
				    promoted without moving (see `bgOffsets`); each deeper card steps back
				    from there.

				    Only the BACK slot fades in, and only because a forward swipe genuinely
				    uncovers a card there that wasn't on screen before. The nearer slots
				    must not: undo steps `index` back, which mounts the card being returned
				    to into slot 1 (the top card it used to be is unmounting in the same
				    commit), and fading that in would blink it out for the whole entry
				    animation — showing the cards behind it through the gap. It has to
				    appear at rest, exactly where it already was. Pinned to a fixed slot
				    number, not the deepest one PRESENT: near the end of the deck the stack
				    shrinks to [1], and "deepest present" would put the fade right back on
				    the slot undo mounts into. */}
				{bgOffsets.map((o) => (
					<Animated.View
						key={index + o}
						entering={o === BACK_SLOT ? FadeIn.duration(260) : undefined}
						style={[
							styles.cardPos,
							{
								transform: [{ translateY: (o - 1) * 11 }, { scale: 1 - (o - 1) * 0.045 }],
								zIndex: 10 - o,
							},
						]}
					>
						<CardFace restaurant={deck[index + o]} />
					</Animated.View>
				))}

				{/* The top (interactive) card, keyed by `index` so each card gets its OWN
				    view and its own drag offsets. Advancing simply unmounts this one and
				    mounts the next — already at rest, full size, in the same React commit
				    that mounts the departing card's overlay. Nothing has to be moved back
				    afterwards, so there's no frame where the deck is caught mid-reset. */}
				{index < deck.length && (
					<TopCard
						key={index}
						restaurant={deck[index]}
						entryFrom={entryFrom}
						locked={locked}
						onSwipe={commit}
						styles={styles}
						colors={c}
					/>
				)}

				{/* Deck exhausted — every card has been sorted. Sits where the cards were
				    (behind any final flyaway still animating off) so it's already showing
				    when you return from the shortlist. */}
				{done && (
					<Animated.View entering={FadeIn.duration(320)} style={styles.doneWrap}>
						<Text style={styles.doneTitle}>THAT’S{'\n'}EVERYONE.</Text>
						<Text style={styles.doneBody}>
							{shortlistCount > 0
								? `${shortlistCount} ${shortlistCount === 1 ? 'spot' : 'spots'} on your shortlist.`
								: 'Nothing shortlisted this time.'}
						</Text>
						<View style={styles.doneButton}>
							{shortlistCount > 0 ? (
								<HardButton
									dx={5}
									dy={5}
									color={c.shadow}
									radius={RADII.sticker}
									onPress={handleShortlist}
									accessibilityLabel={`See your shortlist — ${shortlistCount} saved`}
									faceStyle={styles.doneButtonFace}
								>
									<View style={styles.chooseInner}>
										<Text style={styles.doneButtonText}>SEE SHORTLIST</Text>
										<Ionicons name="arrow-forward" size={17} color={c.onAccent} />
									</View>
								</HardButton>
							) : (
								<HardButton
									dx={5}
									dy={5}
									color={c.shadow}
									radius={RADII.sticker}
									onPress={restart}
									accessibilityLabel="Swipe through the deck again"
									faceStyle={styles.doneButtonFace}
								>
									<View style={styles.chooseInner}>
										<Ionicons name="refresh" size={17} color={c.onAccent} />
										<Text style={styles.doneButtonText}>SWIPE AGAIN</Text>
									</View>
								</HardButton>
							)}
						</View>
					</Animated.View>
				)}

				{/* Committed cards flying off. Each rides above the deck (zIndex 20) on
				    its own animation and removes itself when it lands off-screen. */}
				{flyaways.map((f) => (
					<FlyawayCard key={f.id} fly={f} styles={styles} colors={c} onDone={removeFlyaway} />
				))}
			</View>

			{/* No cards left to act on once the deck's exhausted — hide the swipe row. */}
			{!done && (
				<View style={styles.actions}>
					<HardButton
						dx={4}
						dy={4}
						color={c.shadow}
						radius={RADII.pill}
						onPress={() => fling('no')}
						accessibilityLabel="No — skip this place"
						containerStyle={styles.actionHalf}
						faceStyle={styles.noButton}
					>
						<Text style={styles.noText}>NO</Text>
					</HardButton>
					<HardButton
						dx={4}
						dy={4}
						color={c.shadow}
						radius={RADII.pill}
						onPress={() => fling('shortlist')}
						accessibilityLabel="Yes — add to your shortlist"
						containerStyle={styles.actionHalf}
						faceStyle={styles.yesButton}
					>
						<Text style={styles.yesText}>YES</Text>
					</HardButton>
				</View>
			)}

			{showTutorial && <SwipeTutorial onDismiss={dismissTutorial} />}
		</View>
	);
}

// The live top card. Its drag offsets are created HERE rather than on the screen,
// so they belong to this card and die with it: advancing the deck unmounts this
// component and mounts the next one already at rest, in the same React commit that
// mounts the departing card's overlay. That's the whole point — a screen-level
// offset would have to be zeroed through Reanimated, on a different schedule from
// the React render that swaps the content, so the reset always landed either a frame
// early (the swiped card snapping back to centre before its overlay covered it) or a
// frame late (the smaller card behind showing through, then popping to full size).
function TopCard({
	restaurant,
	entryFrom,
	locked,
	onSwipe,
	styles,
	colors,
}: {
	restaurant: Restaurant;
	/** X to slide in from on mount: 0 for a normal advance, ±FLY_DISTANCE for undo. */
	entryFrom: number;
	/** The screen's button lock — a NO/YES press mustn't also land as a drag. */
	locked: SharedValue<boolean>;
	onSwipe: (move: Move, fromX: number, fromY: number) => void;
	styles: ReturnType<typeof makeStyles>;
	colors: Palette;
}) {
	const tx = useSharedValue(entryFrom);
	const ty = useSharedValue(0);
	// This card has been committed — it's the overlay's problem now, so stop taking
	// drags. Per-card, so the next card is live the instant it mounts.
	const gone = useSharedValue(false);

	useEffect(() => {
		// Undo only: glide in from the side this card originally flew off toward. A
		// normal advance mounts at 0 and needs no entry animation at all.
		if (entryFrom !== 0) tx.value = withTiming(0, { duration: 300 });
		// Mount-only — `entryFrom` is this card's starting position, not a live input.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const pan = Gesture.Pan()
		.onUpdate((e) => {
			if (gone.value || locked.value) return;
			tx.value = e.translationX;
			ty.value = e.translationY;
		})
		.onEnd((e) => {
			// `locked` covers the case where a NO/YES press already committed this card
			// out from under the gesture — without it this would commit the same index
			// twice, once from the button and once from the drag ending on a card that
			// is already on its way out.
			if (gone.value || locked.value) return;
			const dx = e.translationX;
			if (Math.abs(dx) > SWIPE_THRESHOLD) {
				gone.value = true;
				locked.value = true;
				// Right → yes (shortlist); left → no (skip). Hand the card off to the
				// overlay at its current dragged position so it flies on seamlessly.
				const dir: Move = dx > 0 ? 'shortlist' : 'no';
				runOnJS(onSwipe)(dir, tx.value, ty.value);
			} else {
				// Not far enough either way — spring back.
				tx.value = withTiming(0, { duration: 300 });
				ty.value = withTiming(0, { duration: 300 });
			}
		});

	const cardStyle = useAnimatedStyle(() => ({
		transform: [
			{ translateX: tx.value },
			{ translateY: ty.value },
			{ rotate: `${tx.value * 0.06}deg` },
		],
	}));
	const yesStampStyle = useAnimatedStyle(() => ({
		opacity: interpolate(tx.value, [0, SWIPE_THRESHOLD], [0, 1], 'clamp'),
	}));
	const noStampStyle = useAnimatedStyle(() => ({
		opacity: interpolate(tx.value, [-SWIPE_THRESHOLD, 0], [1, 0], 'clamp'),
	}));

	return (
		<GestureDetector gesture={pan}>
			<Animated.View style={[styles.cardPos, { zIndex: 10 }, cardStyle]}>
				<CardFace restaurant={restaurant}>
					<Animated.View style={[styles.stamp, styles.stampLeft, yesStampStyle]}>
						<Text style={[styles.stampText, { color: colors.green }]}>YES</Text>
					</Animated.View>
					<Animated.View style={[styles.stamp, styles.stampRight, noStampStyle]}>
						<Text style={[styles.stampText, { color: colors.rose }]}>NO</Text>
					</Animated.View>
				</CardFace>
			</Animated.View>
		</GestureDetector>
	);
}

// A committed card flying off. Owns its own animation values (created fresh per
// card) so resetting the live top card can never disturb it. Starts wherever the
// card was (dragged position or centre) and glides off-screen, then unmounts.
function FlyawayCard({
	fly,
	styles,
	colors,
	onDone,
}: {
	fly: Flyaway;
	styles: ReturnType<typeof makeStyles>;
	colors: Palette;
	onDone: (id: number) => void;
}) {
	const x = useSharedValue(fly.fromX);
	const y = useSharedValue(fly.fromY);
	const shortlisted = fly.move === 'shortlist';

	useEffect(() => {
		y.value = withTiming(fly.fromY - 40, { duration: 300, easing: EASE });
		x.value = withTiming(shortlisted ? FLY_DISTANCE : -FLY_DISTANCE, { duration: 300, easing: EASE }, (f) => {
			if (f) runOnJS(onDone)(fly.id);
		});
		// Values are created for this card only; run the exit exactly once on mount.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const style = useAnimatedStyle(() => ({
		transform: [{ translateX: x.value }, { translateY: y.value }, { rotate: `${x.value * 0.06}deg` }],
	}));

	return (
		<Animated.View pointerEvents="none" style={[styles.cardPos, { zIndex: 20 }, style]}>
			<CardFace restaurant={fly.card}>
				<View
					style={[
						styles.stamp,
						shortlisted ? styles.stampLeft : styles.stampRight,
						{ borderColor: shortlisted ? colors.green : colors.rose },
					]}
				>
					<Text style={[styles.stampText, { color: shortlisted ? colors.green : colors.rose }]}>
						{shortlisted ? 'YES' : 'NO'}
					</Text>
				</View>
			</CardFace>
		</Animated.View>
	);
}

const makeStyles = (c: Palette) => StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: c.cream,
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 24,
		// Above the deck: on Fabric, zIndex follows web stacking-context rules, so
		// the controls need an explicit zIndex to stay over the deck's cards.
		zIndex: 2,
	},
	undoButton: {
		width: 40,
		height: 40,
		borderRadius: RADII.pill,
		backgroundColor: c.paper,
		borderWidth: BORDER,
		borderColor: c.ink,
		alignItems: 'center',
		justifyContent: 'center',
	},
	undoDisabled: {
		opacity: 0.35,
	},
	headerRight: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
	},
	chooseFace: {
		borderWidth: BORDER,
		borderColor: c.ink,
		paddingVertical: 8,
		paddingHorizontal: 14,
		borderRadius: RADII.pill,
		backgroundColor: c.paper,
	},
	chooseInner: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 6,
	},
	chooseText: {
		fontFamily: FONTS.bold,
		fontSize: 13,
		color: c.ink,
	},
	shortlistBadge: {
		position: 'absolute',
		top: -8,
		right: -8,
		minWidth: 20,
		height: 20,
		borderRadius: RADII.pill,
		paddingHorizontal: 5,
		backgroundColor: c.brass,
		alignItems: 'center',
		justifyContent: 'center',
		// A paper-colored ring lifts the badge off the button edge so it reads as
		// a notification pip rather than part of the pill.
		borderWidth: 2,
		borderColor: c.paper,
		zIndex: 2,
	},
	shortlistBadgeText: {
		fontFamily: FONTS.bold,
		fontSize: 11,
		lineHeight: 14,
		color: c.onAccent,
	},
	deck: {
		flex: 1,
		position: 'relative',
		marginTop: 8,
		// Establish a stacking context so the cards' zIndex (10–20) stays contained
		// here rather than escaping to the root and painting over the actions row.
		zIndex: 1,
	},
	cardPos: {
		position: 'absolute',
		top: 12,
		left: 20,
		right: 20,
		bottom: 10,
		// The card is sized to its content (photo panel + info), not stretched —
		// centre it in the deck region so the peek above/below reads as breathing
		// room and the stacked cards behind show there.
		justifyContent: 'center',
	},
	doneWrap: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 32,
	},
	doneTitle: {
		fontFamily: FONTS.display,
		fontSize: 40,
		lineHeight: 42,
		color: c.ink,
		textAlign: 'center',
	},
	doneBody: {
		marginTop: 14,
		fontFamily: FONTS.medium,
		fontSize: 16,
		color: c.muted,
		textAlign: 'center',
	},
	doneButton: {
		marginTop: 28,
	},
	doneButtonFace: {
		paddingVertical: 14,
		paddingHorizontal: 24,
		alignItems: 'center',
		backgroundColor: c.brass,
		borderWidth: BORDER,
		borderColor: c.brassDeep,
	},
	doneButtonText: {
		fontFamily: FONTS.display,
		fontSize: 17,
		color: c.onAccent,
	},
	stamp: {
		position: 'absolute',
		top: 52,
		borderWidth: 4,
		borderRadius: 10,
		paddingVertical: 2,
		paddingHorizontal: 12,
		backgroundColor: 'rgba(255,253,246,0.92)',
	},
	stampLeft: {
		left: 18,
		transform: [{ rotate: '-12deg' }],
		borderColor: c.green,
	},
	stampRight: {
		right: 18,
		transform: [{ rotate: '12deg' }],
		borderColor: c.rose,
	},
	stampText: {
		fontFamily: FONTS.display,
		fontSize: 32,
	},
	actions: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 14,
		paddingHorizontal: 24,
		paddingTop: 14,
		// Keep the NO/YES controls above the deck (see `deck`/`header` zIndex).
		zIndex: 2,
	},
	// Yes and No share the row evenly — same size, same weight, opposite intent.
	actionHalf: {
		flex: 1,
	},
	noButton: {
		height: 60,
		borderRadius: RADII.pill,
		backgroundColor: c.rose,
		borderWidth: BORDER,
		borderColor: c.ink,
		alignItems: 'center',
		justifyContent: 'center',
	},
	noText: {
		fontFamily: FONTS.display,
		fontSize: 20,
		color: c.onAccent,
	},
	yesButton: {
		height: 60,
		borderRadius: RADII.pill,
		backgroundColor: c.jade,
		borderWidth: BORDER,
		borderColor: c.ink,
		alignItems: 'center',
		justifyContent: 'center',
	},
	yesText: {
		fontFamily: FONTS.display,
		fontSize: 20,
		color: c.onAccent,
	},
});
