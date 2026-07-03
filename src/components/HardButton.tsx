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
	children,
}: {
	dx: number;
	dy: number;
	color: string;
	radius: number;
	faceStyle?: StyleProp<ViewStyle>;
	containerStyle?: StyleProp<ViewStyle>;
	onPress?: () => void;
	children?: React.ReactNode;
}) {
	const [pressed, setPressed] = useState(false);
	const shift = pressed
		? [{ translateX: dx - PRESSED_GAP }, { translateY: dy - PRESSED_GAP }]
		: [{ translateX: 0 }, { translateY: 0 }];
	return (
		<Pressable
			onPress={onPress}
			onPressIn={() => setPressed(true)}
			onPressOut={() => setPressed(false)}
			style={containerStyle}
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
});
