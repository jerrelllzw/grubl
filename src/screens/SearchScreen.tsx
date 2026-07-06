import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchAutoComplete, type Coordinates, type Suggestion } from '../api/googlePlaces';
import DistanceSlider from '../components/DistanceSlider';
import HardButton from '../components/HardButton';
import LoadingDots from '../components/LoadingDots';
import ThemeToggle from '../components/ThemeToggle';
import {
	DEFAULT_RADIUS_M,
	PRICE_KEYS,
	PRICE_MAP,
	RADIUS_MAX_M,
	RADIUS_MIN_M,
	RADIUS_STEP_M,
} from '../constants/googlePlaces';
import type { SearchQuery } from '../data/restaurants';
import { useCurrentLocation } from '../hooks/useCurrentLocation';
import { useColors, useThemedStyles } from '../theme/theme';
import { BORDER, FONTS, RADII, type Palette } from '../theme/tokens';

// 2000 → "2 km", 2500 → "2.5 km"
const formatKm = (m: number) => `${Number((m / 1000).toFixed(1))} km`;

export default function SearchScreen({
	initial,
	onSearch,
	loading = false,
}: {
	initial: SearchQuery | null;
	onSearch: (query: SearchQuery) => void;
	/** True while the search is fetching — shows a spinner on the CTA. */
	loading?: boolean;
}) {
	const insets = useSafeAreaInsets();
	const c = useColors();
	const styles = useThemedStyles(makeStyles);

	// Seed from the last search so tweaking one filter doesn't mean re-entering all.
	const [location, setLocation] = useState(initial?.location ?? '');
	const [coords, setCoords] = useState<Coordinates | null>(initial?.coords ?? null);
	const [isLocating, setIsLocating] = useState(false);
	const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
	const [showSuggestions, setShowSuggestions] = useState(false);
	const [error, setError] = useState<string | null>(null); // inline, on-brand feedback
	const suppressAutocomplete = useRef(false);

	const [radius, setRadius] = useState(initial?.radius ?? DEFAULT_RADIUS_M);
	// Empty = "any price" (no constraint). Default to every tier selected so the
	// first search casts the widest net; the user narrows by toggling tiers off.
	const [priceLevels, setPriceLevels] = useState<string[]>(initial?.priceLevels ?? [...PRICE_KEYS]);
	const [openNow, setOpenNow] = useState(initial?.openNow ?? true);

	// Nothing selected and everything selected both mean "no price constraint" —
	// show "Any" for both rather than spelling out all four tiers.
	const priceIsAny = priceLevels.length === 0 || priceLevels.length === PRICE_KEYS.length;

	const clearSuggestions = () => {
		setSuggestions([]);
		setShowSuggestions(false);
	};

	const onChangeLocation = (text: string) => {
		setLocation(text);
		setCoords(null); // typed text no longer matches the resolved GPS coords
		if (error) setError(null); // clear stale feedback as the user fixes it
	};

	const clearLocation = () => {
		suppressAutocomplete.current = true; // don't re-open the dropdown as the field empties
		setLocation('');
		setCoords(null);
		clearSuggestions();
		setTimeout(() => (suppressAutocomplete.current = false), 300);
	};

	const togglePrice = (key: string) =>
		setPriceLevels((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

	const resolveCurrentLocation = useCurrentLocation((label, resolved) => {
		setLocation(label);
		setCoords(resolved);
		setError(null);
	}, setError);

	const useCurrentLocationPress = async () => {
		try {
			setError(null);
			setIsLocating(true);
			suppressAutocomplete.current = true;
			await resolveCurrentLocation();
			clearSuggestions();
		} catch {
			// handled inside the hook
		} finally {
			setIsLocating(false);
			setTimeout(() => (suppressAutocomplete.current = false), 500);
		}
	};

	const handleFind = () => {
		if (loading) return; // a fetch is already in flight
		if (!location.trim()) {
			setError('Enter a location to search.');
			return;
		}
		Keyboard.dismiss();
		onSearch({
			location: location.trim(),
			coords: coords ?? undefined,
			radius,
			priceLevels,
			openNow,
		});
	};

	// Debounced autocomplete.
	useEffect(() => {
		if (suppressAutocomplete.current) return;
		const t = setTimeout(async () => {
			if (location.trim().length > 2) {
				const results = await fetchAutoComplete(location);
				setSuggestions(results);
				setShowSuggestions(results.length > 0);
			}
		}, 300);
		return () => clearTimeout(t);
	}, [location]);

	return (
		<View style={[styles.container, { paddingTop: insets.top + 14 }]}>
			<View style={styles.header}>
				<ThemeToggle />
			</View>

			<ScrollView
				style={styles.scroll}
				contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 96 }]}
				keyboardShouldPersistTaps='handled'
				showsVerticalScrollIndicator={false}
				onScrollBeginDrag={() => {
					Keyboard.dismiss();
					setShowSuggestions(false);
				}}
			>
				{/* Tap anywhere outside the dropdown to dismiss it. Sits above the other
				    sections but below the location section, so the dropdown stays tappable. */}
				{showSuggestions && suggestions.length > 0 && (
					<Pressable
						style={styles.dismissOverlay}
						onPress={() => setShowSuggestions(false)}
						accessibilityElementsHidden
						importantForAccessibility='no-hide-descendants'
					/>
				)}

				{/* Location */}
				<View style={styles.locationSection}>
					<Text style={styles.label}>LOCATION</Text>

					{/* One line: the address field, with a separate "use current location"
					    button on the right. Anchor keeps the dropdown pinned to the input. */}
					<View style={styles.locationAnchor}>
						<View style={styles.locationRow}>
							<View style={styles.inputWrap}>
								<TextInput
									style={styles.input}
									placeholder='e.g. Marina Bay Sands'
									placeholderTextColor={c.muted}
									value={location}
									onChangeText={onChangeLocation}
									onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
									accessibilityLabel='Location'
								/>
								{location.length > 0 && (
									<Pressable
										style={styles.clearButton}
										onPress={clearLocation}
										hitSlop={8}
										accessibilityRole='button'
										accessibilityLabel='Clear location'
									>
										<Ionicons name='close-circle' size={20} color={c.muted} />
									</Pressable>
								)}
							</View>
							<Pressable
								style={styles.gpsButton}
								onPress={useCurrentLocationPress}
								disabled={isLocating}
								accessibilityRole='button'
								accessibilityLabel='Use my current location'
							>
								{isLocating ? (
									<LoadingDots color={c.ink} size={6} />
								) : (
									<Ionicons name='locate' size={22} color={c.ink} />
								)}
							</Pressable>
						</View>

						{showSuggestions && suggestions.length > 0 && (
							<View style={styles.dropdown}>
								{suggestions.slice(0, 5).map((item, i) => (
									<Pressable
										key={`${item.label}-${i}`}
										style={styles.suggestion}
										accessibilityRole='button'
										accessibilityLabel={item.label}
										onPress={() => {
											suppressAutocomplete.current = true;
											setLocation(item.label);
											setCoords(item.coords); // Photon gives coords inline — no geocode needed
											clearSuggestions();
											Keyboard.dismiss();
											setTimeout(() => (suppressAutocomplete.current = false), 500);
										}}
									>
										<Ionicons name='location-outline' size={16} color={c.muted} />
										<Text style={styles.suggestionText} numberOfLines={1}>
											{item.label}
										</Text>
									</Pressable>
								))}
								<Text style={styles.attribution}>Locations © OpenStreetMap</Text>
							</View>
						)}
					</View>

					{error && (
						<Text style={styles.errorText} accessibilityRole='alert'>
							{error}
						</Text>
					)}
				</View>

				{/* How far — a slider: a distance is a magnitude, so it gets a range control. */}
				<View style={styles.section}>
					<View style={styles.labelRow}>
						<Text style={styles.label}>HOW FAR</Text>
						<Text style={styles.labelValue}>{formatKm(radius)}</Text>
					</View>
					<DistanceSlider
						value={radius}
						min={RADIUS_MIN_M}
						max={RADIUS_MAX_M}
						step={RADIUS_STEP_M}
						onChange={setRadius}
						accessibilityLabel='Search radius'
					/>
					<View style={styles.scaleRow}>
						<Text style={styles.scaleText}>{formatKm(RADIUS_MIN_M)}</Text>
						<Text style={styles.scaleText}>{formatKm(RADIUS_MAX_M)}</Text>
					</View>
				</View>

				{/* Price — multi-select checkboxes. No "any" chip: nothing selected already
				    means any price, shown in the readout, mirroring How Far's value. */}
				<View style={styles.section}>
					<View style={styles.labelRow}>
						<Text style={styles.label}>PRICE</Text>
						<Text style={styles.labelValue}>
							{priceIsAny
								? 'Any'
								: PRICE_KEYS.filter((k) => priceLevels.includes(k))
										.map((k) => PRICE_MAP[k])
										.join('  ')}
						</Text>
					</View>
					<View style={styles.chipWrap}>
						{PRICE_KEYS.map((key) => {
							const active = priceLevels.includes(key);
							return (
								<Pressable
									key={key}
									onPress={() => togglePrice(key)}
									style={[styles.priceChip, active ? styles.chipActive : styles.chipInactive]}
									accessibilityRole='checkbox'
									accessibilityState={{ checked: active }}
									accessibilityLabel={`Price ${PRICE_MAP[key]}`}
								>
									{active && <Ionicons name='checkmark' size={14} color={c.cream} />}
									<Text style={[styles.chipText, active ? styles.chipTextActive : styles.chipTextInactive]}>
										{PRICE_MAP[key]}
									</Text>
								</Pressable>
							);
						})}
					</View>
				</View>

				{/* Hours — a boolean, so it gets a switch, not a chip or a slider. */}
				<View style={styles.section}>
					<Text style={styles.label}>HOURS</Text>
					<Pressable
						style={styles.switchRow}
						onPress={() => setOpenNow((v) => !v)}
						accessibilityRole='switch'
						accessibilityLabel='Open now'
						accessibilityState={{ checked: openNow }}
					>
						<Text style={styles.switchLabel}>Open now</Text>
						<View style={[styles.track, openNow ? styles.trackOn : styles.trackOff]}>
							<View style={[styles.knob, openNow ? styles.knobOn : styles.knobOff]} />
						</View>
					</Pressable>
				</View>
			</ScrollView>

			<View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
				<HardButton
					dx={6}
					dy={6}
					color={c.shadow}
					radius={RADII.cta}
					onPress={handleFind}
					accessibilityLabel='Find food'
					faceStyle={styles.ctaFace}
				>
					{loading ? (
						<View style={styles.ctaLoading}>
							<Text style={styles.ctaText}>FINDING</Text>
							<LoadingDots color={c.onAccent} />
						</View>
					) : (
						<Text style={styles.ctaText}>SEARCH →</Text>
					)}
				</HardButton>
			</View>
		</View>
	);
}

const makeStyles = (c: Palette) =>
	StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: c.cream,
		},
		header: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'flex-end',
			paddingHorizontal: 20,
			paddingBottom: 10,
		},
		scroll: {
			flex: 1,
		},
		scrollContent: {
			paddingHorizontal: 20,
			paddingTop: 8,
			gap: 20,
		},
		label: {
			fontFamily: FONTS.bold,
			fontSize: 13,
			letterSpacing: 1.2,
			color: c.ink,
			marginBottom: 12,
		},
		labelRow: {
			flexDirection: 'row',
			alignItems: 'baseline',
			justifyContent: 'space-between',
		},
		labelValue: {
			fontFamily: FONTS.bold,
			fontSize: 15,
			color: c.ink,
		},
		scaleRow: {
			flexDirection: 'row',
			justifyContent: 'space-between',
			marginTop: 8,
		},
		scaleText: {
			fontFamily: FONTS.medium,
			fontSize: 11,
			color: c.muted,
		},
		locationSection: {
			zIndex: 30,
		},
		locationAnchor: {
			position: 'relative',
			zIndex: 30,
		},
		// Plain red text, no bubble — reads as a quiet inline hint that doesn't
		// compete with the form fields.
		errorText: {
			marginTop: 8,
			fontFamily: FONTS.semibold,
			fontSize: 13,
			color: c.rose,
		},
		// Address field + its own GPS button, side by side on one line.
		locationRow: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: 10,
		},
		// Standalone GPS button on the right — square, neutral, matches input height.
		gpsButton: {
			width: 54,
			height: 54,
			alignItems: 'center',
			justifyContent: 'center',
			backgroundColor: c.paper,
			borderWidth: BORDER,
			borderColor: c.ink,
			borderRadius: RADII.sticker,
		},
		inputWrap: {
			flex: 1,
			position: 'relative',
			justifyContent: 'center',
		},
		input: {
			width: '100%',
			height: 54,
			backgroundColor: c.paper,
			borderWidth: BORDER,
			borderColor: c.ink,
			borderRadius: RADII.sticker,
			paddingLeft: 16,
			paddingRight: 44, // room for the clear button
			fontFamily: FONTS.semibold,
			fontSize: 16,
			color: c.ink,
		},
		clearButton: {
			position: 'absolute',
			right: 12,
			width: 24,
			height: 24,
			alignItems: 'center',
			justifyContent: 'center',
		},
		dropdown: {
			// Float over the sections below instead of pushing them down.
			position: 'absolute',
			top: 60, // just under the 54px input row
			left: 0,
			right: 0,
			zIndex: 40,
			elevation: 8, // Android stacking (zIndex alone isn't enough)
			backgroundColor: c.paper,
			borderWidth: BORDER,
			borderColor: c.ink,
			borderRadius: RADII.sticker,
			overflow: 'hidden',
		},
		suggestion: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: 8,
			paddingHorizontal: 14,
			paddingVertical: 13,
			borderBottomWidth: 1,
			borderBottomColor: c.line,
		},
		suggestionText: {
			flex: 1,
			fontFamily: FONTS.medium,
			fontSize: 14,
			color: c.ink,
		},
		attribution: {
			fontFamily: FONTS.medium,
			fontSize: 10,
			color: c.muted,
			textAlign: 'right',
			paddingHorizontal: 14,
			paddingVertical: 6,
		},
		dismissOverlay: {
			position: 'absolute',
			top: 0,
			left: 0,
			right: 0,
			bottom: 0,
			zIndex: 20, // above the filter sections, below the location section (30) + dropdown (40)
		},
		section: {},
		chipWrap: {
			flexDirection: 'row',
			flexWrap: 'wrap',
			gap: 8,
		},
		priceChip: {
			minWidth: 56,
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'center',
			gap: 5,
			borderRadius: RADII.chip,
			borderWidth: BORDER,
			borderColor: c.ink,
			paddingVertical: 10,
			paddingHorizontal: 16,
		},
		chipActive: {
			backgroundColor: c.ink,
		},
		chipInactive: {
			backgroundColor: c.paper,
		},
		chipText: {
			fontFamily: FONTS.bold,
			fontSize: 14,
		},
		chipTextActive: {
			color: c.cream,
		},
		chipTextInactive: {
			color: c.ink,
		},
		switchRow: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'space-between',
			backgroundColor: c.paper,
			borderWidth: BORDER,
			borderColor: c.ink,
			borderRadius: RADII.sticker,
			paddingVertical: 14,
			paddingHorizontal: 16,
		},
		switchLabel: {
			fontFamily: FONTS.bold,
			fontSize: 15,
			color: c.ink,
		},
		track: {
			width: 52,
			height: 30,
			borderRadius: RADII.pill,
			borderWidth: BORDER,
			borderColor: c.ink,
			justifyContent: 'center',
			paddingHorizontal: 3,
		},
		trackOn: {
			backgroundColor: c.jade,
		},
		trackOff: {
			backgroundColor: c.cream,
		},
		knob: {
			width: 22,
			height: 22,
			borderRadius: RADII.pill,
			backgroundColor: c.ink,
		},
		knobOn: {
			alignSelf: 'flex-end',
		},
		knobOff: {
			alignSelf: 'flex-start',
		},
		footer: {
			position: 'absolute',
			left: 0,
			right: 0,
			bottom: 0,
			paddingHorizontal: 20,
			paddingTop: 12,
			backgroundColor: c.cream,
		},
		ctaFace: {
			width: '100%',
			paddingVertical: 18,
			alignItems: 'center',
			backgroundColor: c.brass,
			borderWidth: BORDER,
			borderColor: c.brassDeep,
		},
		ctaLoading: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: 12,
		},
		ctaText: {
			fontFamily: FONTS.display,
			fontSize: 20,
			color: c.onAccent,
		},
	});
