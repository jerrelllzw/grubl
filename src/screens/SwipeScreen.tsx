import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
	Easing,
	interpolate,
	runOnJS,
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CardFace from '../components/CardFace';
import HardButton from '../components/HardButton';
import type { Restaurant } from '../data/restaurants';
import { useColors, useThemedStyles } from '../theme/theme';
import { BORDER, FONTS, RADII, type Palette } from '../theme/tokens';

const SWIPE_THRESHOLD = 90;
const FLY_DISTANCE = 640;
const EASE = Easing.in(Easing.ease);

// Every card ends up in one of two piles: skipped ("no"), or shortlisted ("yes").
// Grubl doesn't ask you to pick the winner here — that's the wheel's job later —
// so a right swipe just adds to the shortlist and keeps you on the deck.
type Move = 'no' | 'shortlist';

export default function SwipeScreen({
	deck,
	initialIndex = 0,
	initialShortlist = [],
	onComplete,
}: {
	deck: Restaurant[];
	/** Card to start on — non-zero when resuming a deck left mid-swipe. */
	initialIndex?: number;
	/** Shortlist carried over when resuming, so earlier "yums" aren't lost. */
	initialShortlist?: Restaurant[];
	/** Deck exhausted or "Done" pressed — hand back the shortlist and stopping index. */
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

	const tx = useSharedValue(0);
	const ty = useSharedValue(0);
	const locked = useSharedValue(false);

	// Advance once a card has flown off the screen (drag-release or button).
	const commit = useCallback(
		(move: Move) => {
			if (move === 'shortlist') {
				const card = deck[index];
				// Guard against ever double-adding the same place (e.g. a stray repeat
				// commit) — the shortlist must stay unique for the verdict list/wheel.
				if (card && !shortlistRef.current.some((r) => r.id === card.id)) {
					shortlistRef.current = shortlistRef.current.concat(card);
					setShortlistCount(shortlistRef.current.length);
				}
			}
			historyRef.current.push(move);
			setMoveCount((c) => c + 1);
			Haptics.selectionAsync().catch(() => {});
			tx.value = 0;
			ty.value = 0;
			locked.value = false;
			const next = index + 1;
			if (next >= deck.length) onComplete(shortlistRef.current, next);
			else setIndex(next);
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

	// Fling the top card off-screen, then run the matching handler. Used by the
	// action buttons; the pan gesture mirrors this inline on its worklet thread.
	const fling = useCallback(
		(dir: Move) => {
			if (locked.value) return;
			locked.value = true;
			ty.value = withTiming(ty.value - 40, { duration: 300, easing: EASE });
			tx.value = withTiming(dir === 'shortlist' ? FLY_DISTANCE : -FLY_DISTANCE, { duration: 300, easing: EASE }, (f) => {
				if (f) runOnJS(commit)(dir);
			});
		},
		[commit, tx, ty, locked]
	);

	const handleDone = useCallback(() => {
		if (locked.value) return;
		onComplete(shortlistRef.current, index);
	}, [onComplete, index, locked]);

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
				ty.value = withTiming(ty.value - 40, { duration: 300, easing: EASE });
				// Right → yes (shortlist); left → no (skip).
				const dir: Move = dx > 0 ? 'shortlist' : 'no';
				tx.value = withTiming(dx > 0 ? FLY_DISTANCE : -FLY_DISTANCE, { duration: 300, easing: EASE }, (f) => {
					if (f) runOnJS(commit)(dir);
				});
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
	const yumStampStyle = useAnimatedStyle(() => ({
		opacity: interpolate(tx.value, [0, SWIPE_THRESHOLD], [0, 1], 'clamp'),
	}));
	const nopeStampStyle = useAnimatedStyle(() => ({
		opacity: interpolate(tx.value, [-SWIPE_THRESHOLD, 0], [1, 0], 'clamp'),
	}));

	const progress = `${Math.min(index + 1, deck.length)} / ${deck.length}`;

	// Render up to three cards, bottom-most first so the top card sits on top.
	const offsets = [2, 1, 0].filter((o) => index + o < deck.length);

	return (
		<View style={[styles.container, { paddingTop: insets.top + 22, paddingBottom: insets.bottom + 24 }]}>
			<View style={styles.header}>
				<Pressable
					style={[styles.backButton, moveCount === 0 && styles.undoDisabled]}
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
					<Text style={styles.progressText}>{progress}</Text>
					<HardButton
						dx={3}
						dy={3}
						color={c.shadow}
						radius={RADII.pill}
						onPress={handleDone}
						accessibilityLabel={
							shortlistCount > 0
								? `View your shortlist — ${shortlistCount} saved`
								: 'View your shortlist'
						}
						faceStyle={styles.chooseFace}
					>
						{/* One constant button — same label, size and colour throughout;
						    it just leads to the shortlist. */}
						<View style={styles.chooseInner}>
							<Text style={styles.chooseText}>SHORTLIST</Text>
							<Ionicons name="arrow-forward" size={15} color={c.ink} />
						</View>
					</HardButton>
				</View>
			</View>

			<View style={styles.deck}>
				{offsets.map((o) => {
					const r = deck[index + o];
					if (o !== 0) {
						return (
							<View
								key={index + o}
								style={[styles.cardPos, { transform: [{ translateY: o * 11 }, { scale: 1 - o * 0.045 }], zIndex: 10 - o }]}
							>
								<CardFace restaurant={r} />
							</View>
						);
					}
					return (
						<GestureDetector key={index + o} gesture={pan}>
							<Animated.View style={[styles.cardPos, { zIndex: 10 }, topCardStyle]}>
								<CardFace restaurant={r}>
									<Animated.View style={[styles.stamp, styles.stampLeft, yumStampStyle]}>
										<Text style={[styles.stampText, { color: c.green }]}>YES</Text>
									</Animated.View>
									<Animated.View style={[styles.stamp, styles.stampRight, nopeStampStyle]}>
										<Text style={[styles.stampText, { color: c.rose }]}>NO</Text>
									</Animated.View>
								</CardFace>
							</Animated.View>
						</GestureDetector>
					);
				})}
			</View>

			<View style={styles.actions}>
				<HardButton
					dx={4}
					dy={4}
					color={c.shadow}
					radius={RADII.pill}
					onPress={() => fling('no')}
					accessibilityLabel="No — skip this place"
					containerStyle={styles.actionHalf}
					faceStyle={styles.nopeButton}
				>
					<Text style={styles.nopeText}>NO</Text>
				</HardButton>
				<HardButton
					dx={4}
					dy={4}
					color={c.shadow}
					radius={RADII.pill}
					onPress={() => fling('shortlist')}
					accessibilityLabel="Yes — add to your shortlist"
					containerStyle={styles.actionHalf}
					faceStyle={styles.yumButton}
				>
					<Text style={styles.yumText}>YES</Text>
				</HardButton>
			</View>
		</View>
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
	},
	backButton: {
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
	progressText: {
		fontFamily: FONTS.semibold,
		fontSize: 14,
		color: c.muted,
	},
	deck: {
		flex: 1,
		position: 'relative',
		marginTop: 8,
	},
	cardPos: {
		position: 'absolute',
		top: 12,
		left: 20,
		right: 20,
		bottom: 10,
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
	},
	// Yes and No share the row evenly — same size, same weight, opposite intent.
	actionHalf: {
		flex: 1,
	},
	nopeButton: {
		height: 60,
		borderRadius: RADII.pill,
		backgroundColor: c.rose,
		borderWidth: BORDER,
		borderColor: c.ink,
		alignItems: 'center',
		justifyContent: 'center',
	},
	nopeText: {
		fontFamily: FONTS.display,
		fontSize: 20,
		color: c.onAccent,
	},
	yumButton: {
		height: 60,
		borderRadius: RADII.pill,
		backgroundColor: c.jade,
		borderWidth: BORDER,
		borderColor: c.ink,
		alignItems: 'center',
		justifyContent: 'center',
	},
	yumText: {
		fontFamily: FONTS.display,
		fontSize: 20,
		color: c.onAccent,
	},
});
