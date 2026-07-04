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
import { BORDER, COLORS, FONTS, RADII } from '../theme/tokens';

const SWIPE_THRESHOLD = 90;
const FLY_DISTANCE = 640;
const EASE = Easing.in(Easing.ease);

// A committed swipe that keeps you on the deck: skip it, or shortlist it as a
// "maybe". A right swipe is decisive (leaves the deck), so it isn't recorded here.
type Move = 'no' | 'shortlist';

export default function SwipeScreen({
	deck,
	showRating,
	onDecide,
	onComplete,
}: {
	deck: Restaurant[];
	showRating: boolean;
	/** Right swipe — the user picked this place outright. Carries the shortlist so far. */
	onDecide: (chosen: Restaurant, shortlist: Restaurant[]) => void;
	/** Deck exhausted or "Done" pressed — hand back the shortlist to choose from. */
	onComplete: (shortlist: Restaurant[]) => void;
}) {
	const insets = useSafeAreaInsets();
	const [index, setIndex] = useState(0);
	const [shortlistCount, setShortlistCount] = useState(0);
	const shortlistRef = useRef<Restaurant[]>([]);
	const historyRef = useRef<Move[]>([]); // each committed move, for undo

	const tx = useSharedValue(0);
	const ty = useSharedValue(0);
	const locked = useSharedValue(false);

	// Advance after a non-decisive card leaves the screen (drag-release or button).
	const commit = useCallback(
		(move: Move) => {
			if (move === 'shortlist') {
				shortlistRef.current = shortlistRef.current.concat(deck[index]);
				setShortlistCount(shortlistRef.current.length);
			}
			historyRef.current.push(move);
			Haptics.selectionAsync().catch(() => {});
			tx.value = 0;
			ty.value = 0;
			locked.value = false;
			const next = index + 1;
			if (next >= deck.length) onComplete(shortlistRef.current);
			else setIndex(next);
		},
		[deck, index, onComplete, tx, ty, locked]
	);

	// Right swipe — decisive. Leave the deck with this place as the verdict.
	const decide = useCallback(() => {
		Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
		onDecide(deck[index], shortlistRef.current);
	}, [deck, index, onDecide]);

	// Rewind the last committed move: step back a card and drop it from the
	// shortlist if that's where it went. (Decisive right swipes leave the deck, so
	// there's nothing here to undo them.)
	const undo = useCallback(() => {
		if (locked.value || index === 0) return;
		const last = historyRef.current.pop();
		if (last === 'shortlist') {
			shortlistRef.current = shortlistRef.current.slice(0, -1);
			setShortlistCount(shortlistRef.current.length);
		}
		Haptics.selectionAsync().catch(() => {});
		setIndex(index - 1);
		// Slide the returning card back in from the side it flew off toward.
		if (last === 'shortlist') {
			tx.value = 0;
			ty.value = FLY_DISTANCE;
		} else {
			tx.value = -FLY_DISTANCE;
			ty.value = 0;
		}
		tx.value = withTiming(0, { duration: 300 });
		ty.value = withTiming(0, { duration: 300 });
	}, [index, tx, ty, locked]);

	// Fling the top card off-screen, then run the matching handler. Used by the
	// action buttons; the pan gesture mirrors this inline on its worklet thread.
	const fling = useCallback(
		(dir: 'no' | 'shortlist' | 'yes') => {
			if (locked.value) return;
			locked.value = true;
			if (dir === 'shortlist') {
				ty.value = withTiming(FLY_DISTANCE, { duration: 300, easing: EASE }, (f) => {
					if (f) runOnJS(commit)('shortlist');
				});
			} else if (dir === 'yes') {
				ty.value = withTiming(ty.value - 40, { duration: 300, easing: EASE });
				tx.value = withTiming(FLY_DISTANCE, { duration: 300, easing: EASE }, (f) => {
					if (f) runOnJS(decide)();
				});
			} else {
				ty.value = withTiming(ty.value - 40, { duration: 300, easing: EASE });
				tx.value = withTiming(-FLY_DISTANCE, { duration: 300, easing: EASE }, (f) => {
					if (f) runOnJS(commit)('no');
				});
			}
		},
		[commit, decide, tx, ty, locked]
	);

	const handleDone = useCallback(() => {
		if (locked.value) return;
		onComplete(shortlistRef.current);
	}, [onComplete, locked]);

	const pan = Gesture.Pan()
		.onUpdate((e) => {
			if (locked.value) return;
			tx.value = e.translationX;
			ty.value = e.translationY;
		})
		.onEnd((e) => {
			if (locked.value) return;
			const dx = e.translationX;
			const dy = e.translationY;
			// A downward drag that beats the horizontal one → shortlist ("maybe").
			if (dy > SWIPE_THRESHOLD && dy > Math.abs(dx)) {
				locked.value = true;
				ty.value = withTiming(FLY_DISTANCE, { duration: 300, easing: EASE }, (f) => {
					if (f) runOnJS(commit)('shortlist');
				});
			} else if (Math.abs(dx) > SWIPE_THRESHOLD) {
				locked.value = true;
				ty.value = withTiming(ty.value - 40, { duration: 300, easing: EASE });
				if (dx > 0) {
					// Right → decisive pick.
					tx.value = withTiming(FLY_DISTANCE, { duration: 300, easing: EASE }, (f) => {
						if (f) runOnJS(decide)();
					});
				} else {
					// Left → skip.
					tx.value = withTiming(-FLY_DISTANCE, { duration: 300, easing: EASE }, (f) => {
						if (f) runOnJS(commit)('no');
					});
				}
			} else {
				// Not far enough in any direction — spring back.
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
	// Stamps light up for whichever axis is winning, so a mostly-down drag doesn't
	// also flash YES/NAH and vice versa.
	const yesStampStyle = useAnimatedStyle(() => ({
		opacity: Math.abs(tx.value) >= Math.abs(ty.value) ? interpolate(tx.value, [0, SWIPE_THRESHOLD], [0, 1], 'clamp') : 0,
	}));
	const nopeStampStyle = useAnimatedStyle(() => ({
		opacity: Math.abs(tx.value) >= Math.abs(ty.value) ? interpolate(tx.value, [-SWIPE_THRESHOLD, 0], [1, 0], 'clamp') : 0,
	}));
	const maybeStampStyle = useAnimatedStyle(() => ({
		opacity: ty.value > Math.abs(tx.value) ? interpolate(ty.value, [0, SWIPE_THRESHOLD], [0, 1], 'clamp') : 0,
	}));

	const progress = `${Math.min(index + 1, deck.length)} / ${deck.length}`;

	// Render up to three cards, bottom-most first so the top card sits on top.
	const offsets = [2, 1, 0].filter((o) => index + o < deck.length);

	return (
		<View style={[styles.container, { paddingTop: insets.top + 22, paddingBottom: insets.bottom + 24 }]}>
			<View style={styles.header}>
				<Text style={styles.wordmark}>
					grubl<Text style={styles.dot}>.</Text>
				</Text>
				<View style={styles.headerRight}>
					{shortlistCount > 0 && (
						<Pressable
							style={styles.doneButton}
							onPress={handleDone}
							hitSlop={6}
							accessibilityRole="button"
							accessibilityLabel={`Done — choose from your ${shortlistCount} shortlisted`}
						>
							<Text style={styles.doneText}>DONE · {shortlistCount}</Text>
						</Pressable>
					)}
					<View style={styles.progressPill}>
						<Text style={styles.progressText}>{progress}</Text>
					</View>
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
								<CardFace restaurant={r} showRating={showRating} />
							</View>
						);
					}
					return (
						<GestureDetector key={index + o} gesture={pan}>
							<Animated.View style={[styles.cardPos, { zIndex: 10 }, topCardStyle]}>
								<CardFace restaurant={r} showRating={showRating}>
									<Animated.View style={[styles.stamp, styles.stampLeft, yesStampStyle]}>
										<Text style={[styles.stampText, { color: COLORS.green }]}>YES</Text>
									</Animated.View>
									<Animated.View style={[styles.stamp, styles.stampRight, nopeStampStyle]}>
										<Text style={[styles.stampText, { color: COLORS.tomato }]}>NAH</Text>
									</Animated.View>
									<View style={styles.maybeWrap} pointerEvents="none">
										<Animated.View style={[styles.stamp, styles.stampMaybe, maybeStampStyle]}>
											<Text style={[styles.stampText, { color: COLORS.ink }]}>MAYBE</Text>
										</Animated.View>
									</View>
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
					color={COLORS.ink}
					radius={RADII.pill}
					onPress={undo}
					disabled={index === 0}
					accessibilityLabel="Undo last swipe"
					faceStyle={styles.undoButton}
				>
					<Ionicons name="arrow-undo" size={20} color={COLORS.ink} />
				</HardButton>
				<HardButton
					dx={4}
					dy={4}
					color={COLORS.ink}
					radius={RADII.pill}
					onPress={() => fling('no')}
					accessibilityLabel="No — skip this place"
					faceStyle={styles.nopeButton}
				>
					<Text style={styles.nopeGlyph}>✕</Text>
				</HardButton>
				<HardButton
					dx={4}
					dy={4}
					color={COLORS.ink}
					radius={RADII.pill}
					onPress={() => fling('shortlist')}
					accessibilityLabel="Maybe — add to your shortlist"
					faceStyle={styles.maybeButton}
				>
					<Ionicons name="bookmark-outline" size={22} color={COLORS.ink} />
				</HardButton>
				<HardButton
					dx={4}
					dy={4}
					color={COLORS.ink}
					radius={RADII.pill}
					onPress={() => fling('yes')}
					accessibilityLabel="Yes — eat here, decide now"
					containerStyle={styles.yesContainer}
					faceStyle={styles.yesButton}
				>
					<Text style={styles.yesText}>YES ♥</Text>
				</HardButton>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: COLORS.cream,
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 24,
	},
	wordmark: {
		fontFamily: FONTS.display,
		fontSize: 22,
		color: COLORS.ink,
	},
	dot: {
		color: COLORS.tomato,
	},
	headerRight: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
	doneButton: {
		backgroundColor: COLORS.yolk,
		borderWidth: BORDER,
		borderColor: COLORS.ink,
		paddingVertical: 4,
		paddingHorizontal: 12,
		borderRadius: RADII.pill,
	},
	doneText: {
		fontFamily: FONTS.bold,
		fontSize: 13,
		color: COLORS.ink,
	},
	progressPill: {
		backgroundColor: COLORS.ink,
		paddingVertical: 5,
		paddingHorizontal: 12,
		borderRadius: RADII.pill,
	},
	progressText: {
		fontFamily: FONTS.bold,
		fontSize: 14,
		color: COLORS.cream,
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
		borderWidth: 4,
		borderRadius: 10,
		paddingVertical: 2,
		paddingHorizontal: 12,
		backgroundColor: 'rgba(255,253,246,0.92)',
	},
	stampLeft: {
		top: 52,
		left: 18,
		transform: [{ rotate: '-12deg' }],
		borderColor: COLORS.green,
	},
	stampRight: {
		top: 52,
		right: 18,
		transform: [{ rotate: '12deg' }],
		borderColor: COLORS.tomato,
	},
	maybeWrap: {
		position: 'absolute',
		top: 44,
		left: 0,
		right: 0,
		alignItems: 'center',
	},
	stampMaybe: {
		position: 'relative',
		borderColor: COLORS.ink,
		transform: [{ rotate: '-4deg' }],
	},
	stampText: {
		fontFamily: FONTS.display,
		fontSize: 32,
	},
	actions: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		paddingHorizontal: 24,
		paddingTop: 14,
	},
	undoButton: {
		width: 52,
		height: 52,
		borderRadius: RADII.pill,
		backgroundColor: COLORS.yolk,
		borderWidth: BORDER,
		borderColor: COLORS.ink,
		alignItems: 'center',
		justifyContent: 'center',
	},
	nopeButton: {
		width: 60,
		height: 60,
		borderRadius: RADII.pill,
		backgroundColor: COLORS.paper,
		borderWidth: BORDER,
		borderColor: COLORS.ink,
		alignItems: 'center',
		justifyContent: 'center',
	},
	nopeGlyph: {
		fontSize: 24,
		color: COLORS.ink,
		lineHeight: 28,
	},
	maybeButton: {
		width: 60,
		height: 60,
		borderRadius: RADII.pill,
		backgroundColor: COLORS.yolk,
		borderWidth: BORDER,
		borderColor: COLORS.ink,
		alignItems: 'center',
		justifyContent: 'center',
	},
	yesContainer: {
		flex: 1,
	},
	yesButton: {
		height: 60,
		borderRadius: RADII.pill,
		backgroundColor: COLORS.tomato,
		borderWidth: BORDER,
		borderColor: COLORS.ink,
		alignItems: 'center',
		justifyContent: 'center',
	},
	yesText: {
		fontFamily: FONTS.display,
		fontSize: 20,
		color: COLORS.cream,
	},
});
