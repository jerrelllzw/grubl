import React, { useRef, useState } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import { useColors } from '../theme/theme';
import { BORDER, RADII } from '../theme/tokens';

// A branded, hard-edged distance slider — a single thumb picking a value from a
// continuous range. Deliberately not a chip row: a magnitude wants a slider.

const THUMB = 28;
const PAD = THUMB / 2; // inset the track so the thumb can reach both ends inside the hit area

export default function DistanceSlider({
	value,
	min,
	max,
	step,
	onChange,
	accessibilityLabel,
}: {
	value: number;
	min: number;
	max: number;
	step: number;
	onChange: (v: number) => void;
	accessibilityLabel?: string;
}) {
	const c = useColors();
	const [trackWidth, setTrackWidth] = useState(0);
	const trackWidthRef = useRef(0);
	const hitRef = useRef<View>(null);
	// Page-X of the hit area's left edge, so a drag can be located from the absolute
	// touch position (locationX would be relative to whatever child is under the finger).
	const offsetRef = useRef(0);
	// Keep the latest onChange behind a ref so the once-built PanResponder never goes stale.
	const onChangeRef = useRef(onChange);
	onChangeRef.current = onChange;

	const measure = () => hitRef.current?.measureInWindow((x) => (offsetRef.current = x));

	const respondTo = (pageX: number) => {
		const w = trackWidthRef.current;
		if (w <= 0) return;
		const frac = Math.max(0, Math.min(1, (pageX - offsetRef.current - PAD) / w));
		const snapped = Math.round((min + frac * (max - min)) / step) * step;
		onChangeRef.current(Math.max(min, Math.min(max, snapped)));
	};

	const pan = useRef(
		PanResponder.create({
			onStartShouldSetPanResponder: () => true,
			onMoveShouldSetPanResponder: () => true,
			// Claim the gesture on move so the parent ScrollView can't hijack the drag…
			onMoveShouldSetPanResponderCapture: () => true,
			// …and refuse to hand it back once we have it (otherwise the drag only taps).
			onPanResponderTerminationRequest: () => false,
			onShouldBlockNativeResponder: () => true,
			onPanResponderGrant: (e) => {
				measure();
				respondTo(e.nativeEvent.pageX);
			},
			onPanResponderMove: (e) => respondTo(e.nativeEvent.pageX),
		})
	).current;

	const frac = max === min ? 0 : (value - min) / (max - min);

	// Interior step boundaries as fractions along the track (endpoints are the
	// track ends, so skip them). These are the "breaks" the value snaps to.
	const steps = step > 0 ? Math.round((max - min) / step) : 0;
	const ticks = steps > 1 ? Array.from({ length: steps - 1 }, (_, i) => (i + 1) / steps) : [];

	return (
		<View
			ref={hitRef}
			style={styles.hitArea}
			onLayout={measure}
			accessibilityRole="adjustable"
			accessibilityLabel={accessibilityLabel}
			accessibilityValue={{ min, max, now: value }}
			{...pan.panHandlers}
		>
			<View
				style={[styles.track, { backgroundColor: c.paper, borderColor: c.ink }]}
				onLayout={(e) => {
					const w = e.nativeEvent.layout.width;
					trackWidthRef.current = w;
					setTrackWidth(w);
				}}
			>
				<View style={[styles.fill, { width: frac * trackWidth, backgroundColor: c.ink }]} />
			</View>
			{trackWidth > 0 &&
				ticks.map((t, i) => (
					<View key={i} style={[styles.tick, { left: PAD + t * trackWidth - 1, backgroundColor: c.ink }]} />
				))}
			<View style={[styles.thumb, { backgroundColor: c.paper, borderColor: c.ink, left: frac * trackWidth }]}>
				<View style={[styles.grip, { backgroundColor: c.ink }]} />
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	hitArea: {
		height: THUMB,
		justifyContent: 'center',
	},
	track: {
		position: 'absolute',
		left: PAD,
		right: PAD,
		height: 12,
		borderRadius: RADII.pill,
		borderWidth: BORDER,
		overflow: 'hidden',
	},
	fill: {
		position: 'absolute',
		left: 0,
		top: 0,
		bottom: 0,
	},
	tick: {
		position: 'absolute',
		width: 2,
		height: 8,
		top: (THUMB - 8) / 2, // vertically centered on the track
		borderRadius: 1,
	},
	thumb: {
		position: 'absolute',
		top: 0,
		width: THUMB,
		height: THUMB,
		borderRadius: RADII.pill,
		borderWidth: BORDER,
		alignItems: 'center',
		justifyContent: 'center',
	},
	grip: {
		width: 8,
		height: 8,
		borderRadius: RADII.pill,
	},
});
