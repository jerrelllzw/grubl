import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';
import { useColors, useTheme } from '../theme/theme';
import { BORDER, RADII } from '../theme/tokens';

// Compact sun/moon toggle. Shows the scheme you'd switch *to* (moon while light,
// sun while dark), the common convention for a one-tap theme flip.
export default function ThemeToggle({ style }: { style?: StyleProp<ViewStyle> }) {
	const c = useColors();
	const { scheme, toggle } = useTheme();
	const isDark = scheme === 'dark';
	return (
		<Pressable
			onPress={toggle}
			hitSlop={8}
			accessibilityRole="switch"
			accessibilityLabel={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
			accessibilityState={{ checked: isDark }}
			style={[
				{
					width: 44,
					height: 44,
					borderRadius: RADII.pill,
					backgroundColor: c.paper,
					borderWidth: BORDER,
					borderColor: c.ink,
					alignItems: 'center',
					justifyContent: 'center',
				},
				style,
			]}
		>
			<Ionicons name={isDark ? 'sunny' : 'moon'} size={20} color={c.ink} />
		</Pressable>
	);
}
