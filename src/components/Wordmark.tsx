import React from 'react';
import { Text, type StyleProp, type TextStyle } from 'react-native';
import { useColors } from '../theme/theme';
import { FONTS } from '../theme/tokens';

// The Grubl. wordmark — display face with a persimmon full-stop. One source of
// truth so the brand mark reads identically on every screen. Pass `style` to
// tune tracking/line-height for the big hero treatment on the intro.
export default function Wordmark({
	size = 22,
	style,
}: {
	size?: number;
	style?: StyleProp<TextStyle>;
}) {
	const c = useColors();
	return (
		<Text style={[{ fontFamily: FONTS.display, fontSize: size, color: c.ink, letterSpacing: -0.5 }, style]}>
			Grubl<Text style={{ color: c.tomato }}>.</Text>
		</Text>
	);
}
