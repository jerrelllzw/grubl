import React, { useCallback, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
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

export default function SwipeScreen({
	deck,
	showRating,
	onComplete,
}: {
	deck: Restaurant[];
	showRating: boolean;
	onComplete: (likes: Restaurant[]) => void;
}) {
	const insets = useSafeAreaInsets();
	const [index, setIndex] = useState(0);
	const likesRef = useRef<Restaurant[]>([]);

	const tx = useSharedValue(0);
	const ty = useSharedValue(0);
	const locked = useSharedValue(false);

	// Advance after a card leaves the screen (from a drag-release or a button).
	const advance = useCallback(
		(dir: number) => {
			if (dir > 0) likesRef.current = likesRef.current.concat(deck[index]);
			tx.value = 0;
			ty.value = 0;
			locked.value = false;
			const next = index + 1;
			if (next >= deck.length) {
				onComplete(likesRef.current);
			} else {
				setIndex(next);
			}
		},
		[deck, index, onComplete, tx, ty, locked]
	);

	const fling = useCallback(
		(dir: number) => {
			if (locked.value) return;
			locked.value = true;
			ty.value = withTiming(ty.value - 40, { duration: 300, easing: Easing.in(Easing.ease) });
			tx.value = withTiming(dir * FLY_DISTANCE, { duration: 300, easing: Easing.in(Easing.ease) }, (finished) => {
				if (finished) runOnJS(advance)(dir);
			});
		},
		[advance, tx, ty, locked]
	);

	const pan = Gesture.Pan()
		.onUpdate((e) => {
			if (locked.value) return;
			tx.value = e.translationX;
			ty.value = e.translationY;
		})
		.onEnd((e) => {
			if (locked.value) return;
			if (Math.abs(e.translationX) > SWIPE_THRESHOLD) {
				const dir = e.translationX > 0 ? 1 : -1;
				locked.value = true;
				ty.value = withTiming(ty.value - 40, { duration: 300, easing: Easing.in(Easing.ease) });
				tx.value = withTiming(dir * FLY_DISTANCE, { duration: 300, easing: Easing.in(Easing.ease) }, (finished) => {
					if (finished) runOnJS(advance)(dir);
				});
			} else {
				tx.value = withTiming(0, { duration: 300 });
				ty.value = withTiming(0, { duration: 300 });
			}
		});

	const topCardStyle = useAnimatedStyle(() => ({
		transform: [
			{ translateX: tx.value },
			{ translateY: ty.value * 0.25 },
			{ rotate: `${tx.value * 0.06}deg` },
		],
	}));
	const likeStampStyle = useAnimatedStyle(() => ({
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
				<Text style={styles.wordmark}>
					grubl<Text style={styles.dot}>.</Text>
				</Text>
				<View style={styles.progressPill}>
					<Text style={styles.progressText}>{progress}</Text>
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
									<Animated.View style={[styles.stamp, styles.stampLeft, likeStampStyle]}>
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
					onPress={() => fling(-1)}
					faceStyle={styles.nopeButton}
				>
					<Text style={styles.nopeGlyph}>✕</Text>
				</HardButton>
				<HardButton
					dx={4}
					dy={4}
					color={COLORS.ink}
					radius={RADII.pill}
					onPress={() => fling(1)}
					containerStyle={styles.yumContainer}
					faceStyle={styles.yumButton}
				>
					<Text style={styles.yumText}>YUM ♥</Text>
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
		gap: 16,
		paddingHorizontal: 24,
		paddingTop: 14,
	},
	nopeButton: {
		width: 64,
		height: 64,
		borderRadius: RADII.pill,
		backgroundColor: COLORS.paper,
		borderWidth: BORDER,
		borderColor: COLORS.ink,
		alignItems: 'center',
		justifyContent: 'center',
	},
	nopeGlyph: {
		fontSize: 26,
		color: COLORS.ink,
		lineHeight: 30,
	},
	yumContainer: {
		flex: 1,
	},
	yumButton: {
		height: 64,
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
