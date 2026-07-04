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
import DetailSheet from '../components/DetailSheet';
import HardButton from '../components/HardButton';
import type { Restaurant } from '../data/restaurants';
import { BORDER, COLORS, FONTS, RADII } from '../theme/tokens';

const SWIPE_THRESHOLD = 90;
const FLY_DISTANCE = 640;
const EASE = Easing.in(Easing.ease);

// Every card ends up in one of two piles: skipped, or shortlisted as a "yum".
// Grubl doesn't ask you to pick the winner here — that's the wheel's job later —
// so a right swipe just adds to the shortlist and keeps you on the deck.
type Move = 'no' | 'shortlist';

export default function SwipeScreen({
	deck,
	onBack,
	onComplete,
}: {
	deck: Restaurant[];
	/** Back to the search screen to change filters. */
	onBack: () => void;
	/** Deck exhausted or "Done" pressed — hand back the shortlist to choose from. */
	onComplete: (shortlist: Restaurant[]) => void;
}) {
	const insets = useSafeAreaInsets();
	const [index, setIndex] = useState(0);
	const [shortlistCount, setShortlistCount] = useState(0);
	const [detail, setDetail] = useState<Restaurant | null>(null); // place shown in the detail sheet
	const shortlistRef = useRef<Restaurant[]>([]);
	const historyRef = useRef<Move[]>([]); // each committed move, for undo

	const tx = useSharedValue(0);
	const ty = useSharedValue(0);
	const locked = useSharedValue(false);

	// Advance once a card has flown off the screen (drag-release or button).
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

	// Rewind the last committed move: step back a card and drop it from the
	// shortlist if that's where it went.
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
		tx.value = last === 'shortlist' ? FLY_DISTANCE : -FLY_DISTANCE;
		ty.value = 0;
		tx.value = withTiming(0, { duration: 300 });
		ty.value = withTiming(0, { duration: 300 });
	}, [index, tx, ty, locked]);

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
			if (Math.abs(dx) > SWIPE_THRESHOLD) {
				locked.value = true;
				ty.value = withTiming(ty.value - 40, { duration: 300, easing: EASE });
				// Right → yum (shortlist); left → nah (skip).
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
				<View style={styles.headerLeft}>
					<Pressable
						style={styles.backButton}
						onPress={onBack}
						hitSlop={8}
						accessibilityRole="button"
						accessibilityLabel="Back to search"
					>
						<Ionicons name="chevron-back" size={22} color={COLORS.ink} />
					</Pressable>
					<Text style={styles.wordmark}>
						grubl<Text style={styles.dot}>.</Text>
					</Text>
				</View>
				<View style={styles.headerRight}>
					<Text style={styles.progressText}>{progress}</Text>
					<HardButton
						dx={3}
						dy={3}
						color={COLORS.ink}
						radius={RADII.pill}
						onPress={handleDone}
						accessibilityLabel={
							shortlistCount > 0
								? `Choose from your ${shortlistCount} shortlisted`
								: 'Done — stop swiping'
						}
						faceStyle={[styles.chooseFace, shortlistCount > 0 ? styles.chooseFaceReady : styles.chooseFaceIdle]}
					>
						<View style={styles.chooseInner}>
							<Text style={styles.chooseText}>{shortlistCount > 0 ? `CHOOSE · ${shortlistCount}` : 'DONE'}</Text>
							{shortlistCount > 0 && <Ionicons name="arrow-forward" size={15} color={COLORS.ink} />}
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
								<CardFace restaurant={r} onInfo={() => setDetail(r)}>
									<Animated.View style={[styles.stamp, styles.stampLeft, yumStampStyle]}>
										<Text style={[styles.stampText, { color: COLORS.green }]}>YUM</Text>
									</Animated.View>
									<Animated.View style={[styles.stamp, styles.stampRight, nopeStampStyle]}>
										<Text style={[styles.stampText, { color: COLORS.tomato }]}>NAH</Text>
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
					accessibilityLabel="Nah — skip this place"
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
					accessibilityLabel="Yum — add to your shortlist"
					containerStyle={styles.yumContainer}
					faceStyle={styles.yumButton}
				>
					<Text style={styles.yumText}>YUM ♥</Text>
				</HardButton>
			</View>

			<DetailSheet
				restaurant={detail}
				visible={detail !== null}
				onClose={() => setDetail(null)}
			/>
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
	headerLeft: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
	},
	backButton: {
		width: 40,
		height: 40,
		borderRadius: RADII.pill,
		backgroundColor: COLORS.paper,
		borderWidth: BORDER,
		borderColor: COLORS.ink,
		alignItems: 'center',
		justifyContent: 'center',
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
		gap: 10,
	},
	chooseFace: {
		borderWidth: BORDER,
		borderColor: COLORS.ink,
		paddingVertical: 8,
		paddingHorizontal: 14,
		borderRadius: RADII.pill,
	},
	// Idle (nothing shortlisted yet) reads as a quiet "done"; once there are picks
	// it flips to the yolk accent + arrow so the way to the payoff is obvious.
	chooseFaceIdle: {
		backgroundColor: COLORS.paper,
	},
	chooseFaceReady: {
		backgroundColor: COLORS.yolk,
	},
	chooseInner: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
	},
	chooseText: {
		fontFamily: FONTS.bold,
		fontSize: 13,
		color: COLORS.ink,
	},
	progressText: {
		fontFamily: FONTS.semibold,
		fontSize: 14,
		color: COLORS.muted,
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
		borderColor: COLORS.green,
	},
	stampRight: {
		right: 18,
		transform: [{ rotate: '12deg' }],
		borderColor: COLORS.tomato,
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
	yumContainer: {
		flex: 1,
	},
	yumButton: {
		height: 60,
		borderRadius: RADII.pill,
		backgroundColor: COLORS.tomato,
		borderWidth: BORDER,
		borderColor: COLORS.ink,
		alignItems: 'center',
		justifyContent: 'center',
	},
	yumText: {
		fontFamily: FONTS.display,
		fontSize: 20,
		color: COLORS.cream,
	},
});
