import { type StyleProp, type ViewStyle } from 'react-native';

// Dark mode is disabled for now, so there's nothing to toggle — this renders
// nothing. To bring the light/dark switch back, restore the implementation below
// (and re-enable the scheme resolution in ../theme/theme.tsx).
export default function ThemeToggle(_props: { style?: StyleProp<ViewStyle> }) {
	return null;
}

/*
import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';
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
*/
