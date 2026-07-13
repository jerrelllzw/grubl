import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, Pattern, Rect } from 'react-native-svg';

// Placeholder "photo": diagonal two-tone stripes tinted by the restaurant's hue.
// Swap for a real <Image> once the API provides photography.

function hslToHex(h: number, s: number, l: number): string {
	s /= 100;
	l /= 100;
	const k = (n: number) => (n + h / 30) % 12;
	const a = s * Math.min(l, 1 - l);
	const f = (n: number) => {
		const color = l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
		return Math.round(255 * color)
			.toString(16)
			.padStart(2, '0');
	};
	return `#${f(0)}${f(8)}${f(4)}`;
}

const TILE = 28;

export default function StripePhoto({ hue, radius = 0 }: { hue: number; radius?: number }) {
	const light = hslToHex(hue, 50, 87);
	const dark = hslToHex(hue, 50, 80);
	const id = `stripe-${hue}`;
	return (
		// zIndex -1 keeps this stripe backdrop behind its overlay siblings (emoji,
		// info sticker, stamps) while still sitting above the parent's background.
		// On Fabric, absolutely-positioned and SVG surfaces otherwise paint *over*
		// static/later siblings (web stacking rules), which hid the card content.
		<View style={[StyleSheet.absoluteFill, { borderRadius: radius, overflow: 'hidden', zIndex: -1 }]}>
			<Svg width="100%" height="100%">
				<Defs>
					<Pattern id={id} patternUnits="userSpaceOnUse" width={TILE} height={TILE} patternTransform="rotate(45)">
						<Rect x={0} y={0} width={TILE} height={TILE} fill={light} />
						<Rect x={0} y={0} width={TILE / 2} height={TILE} fill={dark} />
					</Pattern>
				</Defs>
				<Rect x={0} y={0} width="100%" height="100%" fill={`url(#${id})`} />
			</Svg>
		</View>
	);
}
