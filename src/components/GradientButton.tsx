import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
	ActivityIndicator,
	Pressable,
	StyleProp,
	StyleSheet,
	Text,
	View,
	ViewStyle,
} from 'react-native';
import { COLORS, FONTS, GRADIENTS, RADIUS, SHADOWS } from '../theme/tokens';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

type Props = {
	title: string;
	onPress: () => void;
	icon?: IoniconName;
	colors?: readonly [string, string, ...string[]];
	disabled?: boolean;
	loading?: boolean;
	style?: StyleProp<ViewStyle>;
};

export default function GradientButton({
	title,
	onPress,
	icon,
	colors = GRADIENTS.brand,
	disabled,
	loading,
	style,
}: Props) {
	const handlePress = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
		onPress();
	};

	return (
		<Pressable
			onPress={handlePress}
			disabled={disabled || loading}
			style={({ pressed }) => [
				styles.wrap,
				!disabled && SHADOWS.button,
				{ opacity: disabled ? 0.45 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
				style,
			]}
		>
			<LinearGradient
				colors={disabled ? ['#C9BCB2', '#B3A093'] : colors}
				start={{ x: 0, y: 0 }}
				end={{ x: 1, y: 1 }}
				style={styles.gradient}
			>
				{loading ? (
					<ActivityIndicator color={COLORS.onBrand} />
				) : (
					<View style={styles.content}>
						{icon && <Ionicons name={icon} size={20} color={COLORS.onBrand} />}
						<Text style={styles.label}>{title}</Text>
					</View>
				)}
			</LinearGradient>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	wrap: {
		borderRadius: RADIUS.pill,
	},
	gradient: {
		minHeight: 58,
		borderRadius: RADIUS.pill,
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 24,
	},
	content: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
	},
	label: {
		color: COLORS.onBrand,
		fontFamily: FONTS.bold,
		fontSize: 17,
		letterSpacing: 0.3,
	},
});
