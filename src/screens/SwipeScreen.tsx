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

	// Drag offset of the *current* top card. Only ever holds a live finger drag — a
	// committed card doesn't fly off using this (see `commit`/flyaways below), so it
	// resets straight to 0 with no visible snap.
	const tx = useSharedValue(0);
	const ty = useSharedValue(0);
	const locked = useSharedValue(false);

	// Cards mid-flight off the screen. A committed card doesn't fly off using the
	// top card's own view — that would force us to reset that view's position while
	// it's still visible (the old flash). Instead each departing card is handed to a
	// throwaway overlay with its OWN animation, so the top card just swaps its
	// content to the next card at rest (tx already 0) — no reset, no fade, no flash.
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
			// The next card becomes the top card at rest — clear any drag so it sits
			// dead centre, opaque, from the first frame.
			tx.value = 0;
			ty.value = 0;
			locked.value = false;
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
		[deck, index, onComplete, tx, ty, locked]
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
		setIndex(index - 1);
		// Slide the returning card back in from the side it flew off toward.
		tx.value = last === 'shortlist' ? FLY_DISTANCE : -FLY_DISTANCE;
		ty.value = 0;
		tx.value = withTiming(0, { duration: 300 });
		ty.value = withTiming(0, { duration: 300 });
	}, [index, moveCount, tx, ty, locked]);

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
	// needs wiping: reaching "done" goes through `commit`, which already left the
	// drag offsets and lock at rest, so the deck reopens clean at card 0.
	const restart = useCallback(() => {
		shortlistRef.current = [];
		historyRef.current = [];
		setShortlistCount(0);
		setMoveCount(0);
		setIndex(0);
	}, []);

	const pan = Gesture.Pan()
		.onUpdate((e) => {
			if (locked.value) return;
			tx.value = e.translationX;
			ty.value = e.translationY;
		})
		.onEnd((e) => {
			if (locked.value) return;
			const dx = e.translationX;
			if (Math.abs(dx) > SWIPE_THRESHOLD) {
				locked.value = true;
				// Right → yes (shortlist); left → no (skip). Hand the card off to the
				// overlay from its current dragged position so it flies on seamlessly.
				const dir: Move = dx > 0 ? 'shortlist' : 'no';
				runOnJS(commit)(dir, tx.value, ty.value);
			} else {
				// Not far enough either way — spring back.
				tx.value = withTiming(0, { duration: 300 });
				ty.value = withTiming(0, { duration: 300 });
			}
		});

	const topCardStyle = useAnimatedStyle(() => ({
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

	// Every card has been swiped: the index has run off the end of the deck. Shows
	// the "all done" state rather than a stale last card.
	const done = index >= deck.length;

	// Up to two cards sit *behind* the top card; the top card is rendered
	// separately with a stable key (see below) so it never remounts on advance.
	const bgOffsets = [2, 1].filter((o) => index + o < deck.length);

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
						{/* Leads to the shortlist. A count badge appears once there's at
						    least one saved place, so the tally of picks is visible instead
						    of buried in the a11y label. */}
						<View style={styles.chooseInner}>
							{shortlistCount > 0 && (
								<View style={styles.shortlistBadge}>
									<Text style={styles.shortlistBadgeText}>{shortlistCount}</Text>
								</View>
							)}
							<Text style={styles.chooseText}>SHORTLIST</Text>
							<Ionicons name="arrow-forward" size={15} color={c.ink} />
						</View>
					</HardButton>
				</View>
			</View>

			<View style={styles.deck}>
				{/* Cards behind the top one, deepest first. Keyed by their card index so a
				    newly revealed deeper card fades in, while a card sliding forward one
				    slot just updates in place. */}
				{bgOffsets.map((o) => (
					<Animated.View
						key={index + o}
						entering={FadeIn.duration(260)}
						style={[styles.cardPos, { transform: [{ translateY: o * 11 }, { scale: 1 - o * 0.045 }], zIndex: 10 - o }]}
					>
						<CardFace restaurant={deck[index + o]} />
					</Animated.View>
				))}

				{/* The top (interactive) card. A CONSTANT key keeps it as one persistent
				    view across the whole deck: advancing `index` just swaps its content
				    at rest (tx already 0), so it's opaque and centred from the first
				    frame — the departing card leaves via the overlay below, so this view
				    never has to reset its own position while visible. */}
				{index < deck.length && (
					<GestureDetector key="top" gesture={pan}>
						<Animated.View style={[styles.cardPos, { zIndex: 10 }, topCardStyle]}>
							<CardFace restaurant={deck[index]}>
								<Animated.View style={[styles.stamp, styles.stampLeft, yesStampStyle]}>
									<Text style={[styles.stampText, { color: c.green }]}>YES</Text>
								</Animated.View>
								<Animated.View style={[styles.stamp, styles.stampRight, noStampStyle]}>
									<Text style={[styles.stampText, { color: c.rose }]}>NO</Text>
								</Animated.View>
							</CardFace>
						</Animated.View>
					</GestureDetector>
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
		minWidth: 18,
		height: 18,
		borderRadius: RADII.pill,
		paddingHorizontal: 5,
		backgroundColor: c.brass,
		alignItems: 'center',
		justifyContent: 'center',
	},
	shortlistBadgeText: {
		fontFamily: FONTS.bold,
		fontSize: 11,
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
