import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

// A button with the signature hard offset shadow that "presses" by sinking into
// its shadow: the face translates toward the shadow, shrinking the visible gap.
// The sink is animated — quick to press down, springy on release — so every CTA
// feels tactile rather than snapping between two static states.

const PRESSED_GAP = 2;

export default function HardButton({
	dx,
	dy,
	color,
	radius,
	faceStyle,
	containerStyle,
	onPress,
	disabled = false,
	busy = false,
	accessibilityLabel,
	children,
}: {
	dx: number;
	dy: number;
	color: string;
	radius: number;
	faceStyle?: StyleProp<ViewStyle>;
	containerStyle?: StyleProp<ViewStyle>;
	onPress?: () => void;
	disabled?: boolean;
	/** Work in flight (e.g. FINDING / PICKING…): dim like disabled but hold the
	 *  pressed/sunk look, so it reads as "mid-action" rather than "un-poppable". */
	busy?: boolean;
	accessibilityLabel?: string;
	children?: React.ReactNode;
}) {
	// 0 = raised (flush with the page), 1 = sunk into the shadow.
	const press = useSharedValue(0);
	const dimmed = disabled || busy;

	// Snap down fast on press, spring back on release — the "pop" that reads as a
	// physical key returning. `busy` holds it sunk (see below) for the mid-action look.
	const sink = () => {
		press.value = withTiming(1, { duration: 45 });
	};
	const raise = () => {
		press.value = withSpring(0, { mass: 0.5, damping: 13, stiffness: 340 });
	};

	// While disabled or busy, hold the button pressed-in; restore once it's live again.
	useEffect(() => {
		if (dimmed) press.value = withTiming(1, { duration: 110 });
		else press.value = withSpring(0, { mass: 0.5, damping: 13, stiffness: 340 });
	}, [dimmed, press]);

	// The face travels toward the shadow by (offset − PRESSED_GAP), leaving a hair
	// of shadow so it still reads as raised-then-pressed, never fully flat.
	const faceAnim = useAnimatedStyle(() => ({
		transform: [
			{ translateX: press.value * (dx - PRESSED_GAP) },
			{ translateY: press.value * (dy - PRESSED_GAP) },
		],
	}));

	return (
		<Pressable
			onPress={onPress}
			onPressIn={() => !dimmed && sink()}
			onPressOut={() => !busy && raise()}
			disabled={dimmed}
			accessibilityRole="button"
			accessibilityLabel={accessibilityLabel}
			accessibilityState={{ disabled, busy }}
			style={[containerStyle, dimmed && styles.disabled]}
		>
			<View style={styles.wrap}>
				<View
					style={[
						StyleSheet.absoluteFillObject,
						{ backgroundColor: color, borderRadius: radius, transform: [{ translateX: dx }, { translateY: dy }] },
					]}
				/>
				<Animated.View style={[{ borderRadius: radius }, faceStyle, faceAnim]}>{children}</Animated.View>
			</View>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	wrap: {
		position: 'relative',
	},
	disabled: {
		opacity: 0.4,
	},
});
