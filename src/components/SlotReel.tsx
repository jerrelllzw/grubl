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

// A slot-machine reel with a cozy landing: the shortlist rolls past a window,
// overshoots a touch and springs back (a friendly "boing"), then pops a little
// sparkle flourish before handing the pick off. Mounted only while a spin is in
// flight, so its one-shot mount animation == one spin.
//
// The reel is a *skin over the shortlist*: its rows are sized identically to the
// static list rows (ITEM_H/GAP below match VerdictScreen), and it fills the same
// box the list occupied (`windowHeight`). So the swap from list → reel reads as
// the list itself starting to roll, not a separate widget appearing.

const ITEM_H = 69; // == shortlist row: swatch 46 + padding 10·2 + border 1.5·2
const GAP = 10;
const STRIDE = ITEM_H + GAP; // centre-to-centre distance between rows
const OVERSHOOT = 24; // roll a touch past the pick, then spring back

export default function SlotReel({
	items,
	targetIndex,
	onSettle,
	windowHeight,
}: {
	items: Restaurant[];
	targetIndex: number;
	onSettle: () => void;
	/** Height of the list box the reel replaces — the reel fills it exactly. */
	windowHeight: number;
}) {
	const styles = useThemedStyles(makeStyles);
	const y = useSharedValue(0);
	const pop = useSharedValue(0); // frame pulse on land
	const spark = useSharedValue(0); // sparkle + ring flourish, 0→1
	const tickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const [landed, setLanded] = useState(false);

	// How many rows fill the box, forced odd so there's one clean centre "pick" slot.
	const fits = Math.max(1, Math.floor((windowHeight + GAP) / STRIDE));
	const VISIBLE = fits % 2 === 0 ? fits - 1 : fits;
	const centerSlot = Math.floor(VISIBLE / 2); // rows above the pick slot
	const frameTop = centerSlot * STRIDE;

	// Pre-roll cycles before landing — enough travel to feel like a spin, capped so
	// the strip stays short even for a long shortlist.
	const cycles = Math.max(2, Math.ceil(18 / items.length));
	const landAbs = cycles * items.length + targetIndex; // reel index that lands centre
	const strip = useMemo(
		() => Array.from({ length: landAbs + VISIBLE }, (_, i) => items[i % items.length]),
		[items, landAbs, VISIBLE]
	);

	useEffect(() => {
		// Cozy landing flourish, then hand the pick off after a short beat so it's seen.
		const flourish = () => {
			Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
			setLanded(true);
			pop.value = withSequence(
				withTiming(1, { duration: 110 }),
				withTiming(0, { duration: 280, easing: Easing.out(Easing.quad) })
			);
			spark.value = withTiming(1, { duration: 460, easing: Easing.out(Easing.quad) });
			settleTimer.current = setTimeout(onSettle, 720);
		};

		// Land with the winner in the centre slot. Start at y=0 (rows [0…VISIBLE-1]
		// from the top) so the first frame matches the resting list — a seamless skin.
		const target = -(landAbs - centerSlot) * STRIDE;
		y.value = withSequence(
			withTiming(target - OVERSHOOT, { duration: 1450, easing: Easing.out(Easing.cubic) }),
			withSpring(target, { damping: 13, stiffness: 190, mass: 0.85 }, (finished) => {
				if (finished) runOnJS(flourish)();
			})
		);

		// Decelerating haptic clicks, roughly tracking the roll.
		let gap = 40;
		const tick = () => {
			Haptics.selectionAsync().catch(() => {});
			gap *= 1.15;
			if (gap < 280) tickTimer.current = setTimeout(tick, gap);
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
	const frameStyle = useAnimatedStyle(() => ({ transform: [{ scale: 1 + pop.value * 0.05 }] }));
	const ringStyle = useAnimatedStyle(() => ({
		opacity: interpolate(spark.value, [0, 0.15, 1], [0, 0.55, 0]),
		transform: [{ scale: interpolate(spark.value, [0, 1], [1, 1.5]) }],
	}));
	const sparkLayerStyle = useAnimatedStyle(() => ({
		opacity: interpolate(spark.value, [0, 0.2, 0.8, 1], [0, 1, 1, 0]),
		transform: [{ translateY: interpolate(spark.value, [0, 1], [6, -18]) }],
	}));

	return (
		<View style={[styles.window, { height: windowHeight }]} accessibilityLabel="Spinning the wheel">
			{/* Only the rolling strip is masked (so rows disappear top/bottom). The
			    frame/ring/sparkle live outside this clip so their land-pulse can grow
			    past the edges without getting sliced at the sides. */}
			<View style={styles.clip}>
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
			</View>

			{/* expanding "pop" ring on land */}
			<Animated.View pointerEvents="none" style={[styles.ring, { top: frameTop }, ringStyle]} />

			{/* persimmon frame around the centre slot (pulses on land) */}
			<Animated.View pointerEvents="none" style={[styles.frame, { top: frameTop }, frameStyle]} />

			{/* sparkle flourish */}
			{landed && (
				<Animated.View pointerEvents="none" style={[styles.sparkLayer, { top: frameTop - 10 }, sparkLayerStyle]}>
					<Text style={[styles.spark, styles.sparkSm]}>✨</Text>
					<Text style={[styles.spark, styles.sparkLg]}>✨</Text>
					<Text style={[styles.spark, styles.sparkSm]}>✨</Text>
				</Animated.View>
			)}
		</View>
	);
}

const makeStyles = (c: Palette) => StyleSheet.create({
	// Transparent, borderless box so the reel reads as the list's own area, not a
	// separate widget dropped on top. Height is passed in to match the list box.
	// Not clipped itself — only the strip (styles.clip) is — so the land-pulse frame
	// can breathe past the sides.
	window: {
		width: '100%',
	},
	// Masks the rolling strip to the window bounds so rows vanish at top/bottom.
	clip: {
		...StyleSheet.absoluteFillObject,
		overflow: 'hidden',
	},
	// Sized identically to the shortlist row in VerdictScreen so the swap is seamless.
	item: {
		height: ITEM_H,
		marginBottom: GAP,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		paddingHorizontal: 10,
		backgroundColor: c.paper,
		borderRadius: RADII.sticker,
		borderWidth: BORDER,
		borderColor: c.ink,
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
		height: ITEM_H,
		borderRadius: RADII.sticker,
		borderWidth: 2.5,
		borderColor: c.brass,
	},
	ring: {
		position: 'absolute',
		left: 0,
		right: 0,
		height: ITEM_H,
		borderRadius: RADII.sticker,
		borderWidth: 2.5,
		borderColor: c.brass,
	},
	sparkLayer: {
		position: 'absolute',
		left: 0,
		right: 0,
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
