import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
	Easing,
	useAnimatedStyle,
	useSharedValue,
	withDelay,
	withRepeat,
	withSequence,
	withTiming,
} from 'react-native-reanimated';

// Three chunky dots that hop in a staggered wave — an on-brand stand-in for the
// stock spinner. Colour is passed in so it can sit on any surface (e.g. onAccent
// over the brass CTA).

const bounce = () =>
	withRepeat(
		withSequence(
			withTiming(1, { duration: 260, easing: Easing.out(Easing.quad) }),
			withTiming(0, { duration: 260, easing: Easing.in(Easing.quad) })
		),
		-1,
		false
	);

export default function LoadingDots({ color, size = 8 }: { color: string; size?: number }) {
	const d0 = useSharedValue(0);
	const d1 = useSharedValue(0);
	const d2 = useSharedValue(0);

	useEffect(() => {
		d0.value = bounce();
		d1.value = withDelay(140, bounce());
		d2.value = withDelay(280, bounce());
	}, [d0, d1, d2]);

	const lift = size * 0.7;
	const s0 = useAnimatedStyle(() => ({ opacity: 0.4 + d0.value * 0.6, transform: [{ translateY: -d0.value * lift }] }));
	const s1 = useAnimatedStyle(() => ({ opacity: 0.4 + d1.value * 0.6, transform: [{ translateY: -d1.value * lift }] }));
	const s2 = useAnimatedStyle(() => ({ opacity: 0.4 + d2.value * 0.6, transform: [{ translateY: -d2.value * lift }] }));

	const dot = { width: size, height: size, borderRadius: size / 2, backgroundColor: color };

	return (
		<View style={[styles.row, { gap: size * 0.75 }]} accessibilityLabel="Loading">
			<Animated.View style={[dot, s0]} />
			<Animated.View style={[dot, s1]} />
			<Animated.View style={[dot, s2]} />
		</View>
	);
}

const styles = StyleSheet.create({
	row: {
		flexDirection: 'row',
		alignItems: 'center',
	},
});
