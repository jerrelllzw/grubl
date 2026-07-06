import React, { useState } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

// A button with the signature hard offset shadow that "presses" by sinking into
// its shadow: the face translates toward the shadow, shrinking the visible gap.

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
	const [pressed, setPressed] = useState(false);
	// Sink into the shadow while actively pressed, or while busy (held down look).
	// A plain disabled button sits flush — it looks un-poppable.
	const sunk = busy || (pressed && !disabled);
	const shift = sunk
		? [{ translateX: dx - PRESSED_GAP }, { translateY: dy - PRESSED_GAP }]
		: [{ translateX: 0 }, { translateY: 0 }];
	const dimmed = disabled || busy;
	return (
		<Pressable
			onPress={onPress}
			onPressIn={() => setPressed(true)}
			onPressOut={() => setPressed(false)}
			disabled={disabled || busy}
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
				<View style={[{ borderRadius: radius, transform: shift }, faceStyle]}>{children}</View>
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
