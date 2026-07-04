import * as Haptics from 'expo-haptics';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
	Easing,
	interpolate,
	runOnJS,
	useAnimatedStyle,
	useSharedValue,
	withSequence,
	withSpring,
	withTiming,
} from 'react-native-reanimated';
import { metaLine, type Restaurant } from '../data/restaurants';
import { useThemedStyles } from '../theme/theme';
import { BORDER, FONTS, RADII, type Palette } from '../theme/tokens';
import StripePhoto from './StripePhoto';

// A slot-machine reel with a cozy landing: the shortlist rolls past a fixed
// window, overshoots a touch and springs back (a friendly "boing"), then pops a
// little sparkle flourish before handing the pick off. Mounted only while a spin
// is in flight, so its one-shot mount animation == one spin.

const ITEM_H = 64;
const GAP = 10;
const STRIDE = ITEM_H + GAP; // centre-to-centre distance between rows
const VISIBLE = 3; // rows in the window; the middle one is the "pick" slot
const WINDOW_H = VISIBLE * ITEM_H + (VISIBLE - 1) * GAP;
const OVERSHOOT = 24; // roll a touch past the pick, then spring back

export default function SlotReel({
	items,
	targetIndex,
	onSettle,
}: {
	items: Restaurant[];
	targetIndex: number;
	onSettle: () => void;
}) {
	const styles = useThemedStyles(makeStyles);
	const y = useSharedValue(0);
	const pop = useSharedValue(0); // frame pulse on land
	const spark = useSharedValue(0); // sparkle + ring flourish, 0→1
	const tickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const [landed, setLanded] = useState(false);

	// Pre-roll cycles before landing — enough travel to feel like a spin, capped so
	// the strip stays short even for a long shortlist.
	const cycles = Math.max(2, Math.ceil(18 / items.length));
	const landAbs = cycles * items.length + targetIndex; // reel index that lands centre
	const strip = useMemo(
		() => Array.from({ length: landAbs + VISIBLE }, (_, i) => items[i % items.length]),
		[items, landAbs]
	);

	useEffect(() => {
		// Cozy landing flourish, then hand the pick off after a short beat so it's seen.
		const flourish = () => {
			Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
			setLanded(true);
			pop.value = withSequence(
				withTiming(1, { duration: 130 }),
				withTiming(0, { duration: 340, easing: Easing.out(Easing.quad) })
			);
			spark.value = withTiming(1, { duration: 640, easing: Easing.out(Easing.quad) });
			settleTimer.current = setTimeout(onSettle, 780);
		};

		// Land with the winner in the middle slot: rows [landAbs-1, landAbs, landAbs+1].
		const target = -(landAbs - 1) * STRIDE;
		y.value = withSequence(
			withTiming(target - OVERSHOOT, { duration: 2500, easing: Easing.out(Easing.cubic) }),
			withSpring(target, { damping: 11, stiffness: 130, mass: 0.9 }, (finished) => {
				if (finished) runOnJS(flourish)();
			})
		);

		// Decelerating haptic clicks, roughly tracking the roll.
		let gap = 45;
		const tick = () => {
			Haptics.selectionAsync().catch(() => {});
			gap *= 1.12;
			if (gap < 320) tickTimer.current = setTimeout(tick, gap);
		};
		tick();

		return () => {
			if (tickTimer.current) clearTimeout(tickTimer.current);
			if (settleTimer.current) clearTimeout(settleTimer.current);
		};
		// Mount-once: the component remounts for each spin, so this runs per spin.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const reelStyle = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
	const frameStyle = useAnimatedStyle(() => ({ transform: [{ scale: 1 + pop.value * 0.06 }] }));
	const ringStyle = useAnimatedStyle(() => ({
		opacity: interpolate(spark.value, [0, 0.15, 1], [0, 0.55, 0]),
		transform: [{ scale: interpolate(spark.value, [0, 1], [1, 1.5]) }],
	}));
	const sparkLayerStyle = useAnimatedStyle(() => ({
		opacity: interpolate(spark.value, [0, 0.2, 0.8, 1], [0, 1, 1, 0]),
		transform: [{ translateY: interpolate(spark.value, [0, 1], [6, -18]) }],
	}));

	return (
		<View style={styles.window} accessibilityLabel="Spinning the wheel">
			<Animated.View style={reelStyle}>
				{strip.map((r, i) => (
					<View key={i} style={styles.item}>
						<View style={styles.swatch}>
							<StripePhoto hue={r.hue} radius={RADII.sticker} />
							<Text style={styles.swatchEmoji}>{r.emoji}</Text>
						</View>
						<View style={styles.txt}>
							<Text style={styles.name} numberOfLines={1}>
								{r.name}
							</Text>
							<Text style={styles.meta} numberOfLines={1}>
								{metaLine(r)}
							</Text>
						</View>
					</View>
				))}
			</Animated.View>

			{/* expanding "pop" ring on land */}
			<Animated.View pointerEvents="none" style={[styles.ring, ringStyle]} />

			{/* fixed persimmon frame around the middle slot (pulses on land) */}
			<Animated.View pointerEvents="none" style={[styles.frame, frameStyle]} />

			{/* sparkle flourish */}
			{landed && (
				<Animated.View pointerEvents="none" style={[styles.sparkLayer, sparkLayerStyle]}>
					<Text style={[styles.spark, styles.sparkSm]}>✨</Text>
					<Text style={[styles.spark, styles.sparkLg]}>✨</Text>
					<Text style={[styles.spark, styles.sparkSm]}>✨</Text>
				</Animated.View>
			)}
		</View>
	);
}

const makeStyles = (c: Palette) => StyleSheet.create({
	window: {
		width: '100%',
		height: WINDOW_H,
		marginTop: 20,
		borderRadius: RADII.sticker,
		backgroundColor: c.ground,
		borderWidth: BORDER,
		borderColor: c.line,
		overflow: 'hidden',
	},
	item: {
		height: ITEM_H,
		marginBottom: GAP,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		paddingHorizontal: 10,
		backgroundColor: c.paper,
		borderRadius: RADII.sticker,
	},
	swatch: {
		width: 42,
		height: 42,
		borderRadius: RADII.sticker,
		borderWidth: 2,
		borderColor: c.ink,
		overflow: 'hidden',
		alignItems: 'center',
		justifyContent: 'center',
	},
	swatchEmoji: {
		fontSize: 22,
	},
	txt: {
		flex: 1,
	},
	name: {
		fontFamily: FONTS.display,
		fontSize: 16,
		color: c.ink,
	},
	meta: {
		marginTop: 3,
		fontFamily: FONTS.semibold,
		fontSize: 12,
		color: c.muted,
	},
	frame: {
		position: 'absolute',
		left: 0,
		right: 0,
		top: STRIDE, // one row + gap down → wraps the middle slot
		height: ITEM_H,
		borderRadius: RADII.sticker,
		borderWidth: 2.5,
		borderColor: c.brass,
	},
	ring: {
		position: 'absolute',
		left: 0,
		right: 0,
		top: STRIDE,
		height: ITEM_H,
		borderRadius: RADII.sticker,
		borderWidth: 2.5,
		borderColor: c.brass,
	},
	sparkLayer: {
		position: 'absolute',
		left: 0,
		right: 0,
		top: STRIDE - 10,
		height: 26,
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'flex-start',
		gap: 26,
	},
	spark: {
		color: c.brass,
	},
	sparkSm: {
		fontSize: 13,
	},
	sparkLg: {
		fontSize: 18,
	},
});
