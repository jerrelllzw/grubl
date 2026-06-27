import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { COLORS, SHADOWS } from '../theme/tokens';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

type Props = {
	icon: IoniconName;
	color: string;
	onPress: () => void;
	size?: number;
	disabled?: boolean;
	style?: StyleProp<ViewStyle>;
};

export default function CircleButton({ icon, color, onPress, size = 64, disabled, style }: Props) {
	const handlePress = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
		onPress();
	};

	return (
		<Pressable
			onPress={handlePress}
			disabled={disabled}
			style={({ pressed }) => [
				styles.button,
				SHADOWS.soft,
				{
					width: size,
					height: size,
					borderRadius: size / 2,
					opacity: disabled ? 0.4 : 1,
					transform: [{ scale: pressed ? 0.9 : 1 }],
				},
				style,
			]}
		>
			<View>
				<Ionicons name={icon} size={size * 0.42} color={color} />
			</View>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	button: {
		backgroundColor: COLORS.surface,
		alignItems: 'center',
		justifyContent: 'center',
	},
});
