import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchAutoComplete, fetchPlaceDetails, newSessionToken, type Coordinates, type Suggestion } from '../api/googlePlaces';
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
	onDraftChange,
	loading = false,
}: {
	initial: SearchQuery | null;
	onSearch: (query: SearchQuery) => void;
	/** Persist the in-progress form so leaving and returning restores it. */
	onDraftChange?: (draft: SearchQuery) => void;
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
	const inputRef = useRef<TextInput>(null);
	// Track focus so a late autocomplete response can't pop the dropdown open after
	// the field has been blurred.
	const isFocused = useRef(false);
	// One Google Autocomplete session spans the keystrokes + the Details call for a
	// single pick; regenerated once a place resolves so billing groups correctly.
	const sessionToken = useRef(newSessionToken());
	// Last known coordinate (device or previous pick) — biases predictions nearby,
	// like Maps. Survives typing (which clears `coords`) so the bias persists.
	const biasCoords = useRef<Coordinates | null>(initial?.coords ?? null);

	// After a pick, long labels leave the field scrolled to the end (tail visible).
	// Momentarily control the selection to snap the scroll back to the start so the
	// user can read what they chose; released to uncontrolled again on focus/typing.
	const [selection, setSelection] = useState<{ start: number; end: number } | undefined>(undefined);
	const revealStart = () => setSelection({ start: 0, end: 0 });

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
		setSelection(undefined); // hand cursor control back so typing/caret works normally
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
		biasCoords.current = resolved;
		setError(null);
		revealStart();
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

	// Debounced autocomplete. Short debounce keeps it responsive; the `cancelled`
	// guard drops a slow in-flight response once a newer keystroke supersedes it,
	// so results can't land out of order.
	useEffect(() => {
		if (suppressAutocomplete.current) return;
		if (location.trim().length <= 2) return;
		let cancelled = false;
		const t = setTimeout(async () => {
			const results = await fetchAutoComplete(location, sessionToken.current, biasCoords.current ?? undefined);
			if (cancelled || !isFocused.current) return; // dropped: field lost focus
			setSuggestions(results);
			setShowSuggestions(isFocused.current && results.length > 0);
		}, 150);
		return () => {
			cancelled = true;
			clearTimeout(t);
		};
	}, [location]);

	// Persist the in-progress form (ref-backed upstream, so no re-render) so backing
	// out to home and returning restores what was entered, not just the last search.
	useEffect(() => {
		onDraftChange?.({
			location,
			coords: coords ?? undefined,
			radius,
			priceLevels,
			openNow,
		});
	}, [location, coords, radius, priceLevels, openNow, onDraftChange]);

	return (
		<View style={[styles.container, { paddingTop: insets.top + 14 }]}>
			<View style={styles.header}>
				<ThemeToggle />
			</View>

			<ScrollView
				style={styles.scroll}
				contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 16 }]}
				keyboardShouldPersistTaps='handled'
				showsVerticalScrollIndicator={false}
				onScrollBeginDrag={() => {
					Keyboard.dismiss();
					setShowSuggestions(false);
				}}
			>
				<View style={styles.formWrap}>
				{/* Hard offset shadow — lifts the panel off the page like a swipe card. */}
				<View style={styles.formShadow} />
				<View style={styles.form}>
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
									ref={inputRef}
									style={styles.input}
									placeholder='e.g. Marina Bay Sands'
									placeholderTextColor={c.muted}
									value={location}
									selection={selection}
									onChangeText={onChangeLocation}
									onFocus={() => {
										isFocused.current = true;
										setSelection(undefined); // release control so the caret lands where tapped
										if (suggestions.length > 0) setShowSuggestions(true);
									}}
									onBlur={() => {
										isFocused.current = false;
										setShowSuggestions(false); // never show the dropdown while unfocused
									}}
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
										key={`${item.placeId}-${i}`}
										style={styles.suggestion}
										accessibilityRole='button'
										accessibilityLabel={item.label}
										onPress={() => {
											suppressAutocomplete.current = true;
											setLocation(item.label);
											setCoords(null); // resolve the exact place via Details below
											clearSuggestions();
											Keyboard.dismiss();
											revealStart();
											// Resolve the placeId → coords (closes the billing session), then
											// mint a fresh token for the next search.
											const token = sessionToken.current;
											fetchPlaceDetails(item.placeId, token).then((resolved) => {
												if (resolved) {
													setCoords(resolved);
													biasCoords.current = resolved;
												}
											});
											sessionToken.current = newSessionToken();
											setTimeout(() => (suppressAutocomplete.current = false), 500);
										}}
									>
										<Ionicons name='location-outline' size={16} color={c.muted} />
										<View style={styles.suggestionTextWrap}>
											<Text style={styles.suggestionMain} numberOfLines={1}>
												{item.mainText}
											</Text>
											{item.secondaryText ? (
												<Text style={styles.suggestionSecondary} numberOfLines={1}>
													{item.secondaryText}
												</Text>
											) : null}
										</View>
									</Pressable>
								))}
								<Text style={styles.attribution}>Powered by Google</Text>
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
				</View>
				</View>

				{/* Search sits just below the card, outside it — the card holds only
				    the filters; the CTA is its own object. */}
				<View style={styles.ctaWrap}>
					<HardButton
						dx={6}
						dy={6}
						color={c.shadow}
						radius={RADII.cta}
						onPress={handleFind}
						busy={loading}
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
			</ScrollView>
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
			paddingHorizontal: 16,
			paddingBottom: 10,
		},
		scroll: {
			flex: 1,
		},
		scrollContent: {
			flexGrow: 1, // fill the viewport so the card can stretch to fill it
			paddingHorizontal: 20, // match the swipe-card side gutters
			paddingTop: 8,
		},
		// The wrapper carries the width + hard shadow and grows to fill the viewport,
		// so the panel reads as a full swipe-card-sized surface rather than a small
		// content-hugging box. The panel itself sits on top.
		formWrap: {
			flex: 1, // fill the vertical space between header and bottom inset
			width: '100%',
			maxWidth: 480,
			alignSelf: 'center',
			position: 'relative',
		},
		// Hard offset shadow behind the panel — same trick as the swipe cards, so the
		// form reads as a lifted sticker rather than a flat frame.
		formShadow: {
			...StyleSheet.absoluteFillObject,
			backgroundColor: c.shadow,
			borderRadius: RADII.card,
			transform: [{ translateX: 7 }, { translateY: 7 }],
		},
		// The panel: an ink hairline on the page ground, so the lighter paper fields
		// still pop inside it. Fills the wrapper but keeps the fields as one centred
		// group with an even rhythm — leftover height sits as balanced top/bottom
		// margins rather than stretched-apart voids between sections.
		form: {
			flex: 1,
			justifyContent: 'center',
			gap: 30,
			padding: 22,
			backgroundColor: c.ground,
			borderWidth: BORDER,
			borderColor: c.ink,
			borderRadius: RADII.card,
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
		suggestionTextWrap: {
			flex: 1,
		},
		suggestionMain: {
			fontFamily: FONTS.semibold,
			fontSize: 14,
			color: c.ink,
		},
		suggestionSecondary: {
			marginTop: 1,
			fontFamily: FONTS.medium,
			fontSize: 12,
			color: c.muted,
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
			// Blow past the capped-width form and its vertical centering so a tap
			// ANYWHERE in the scroll viewport (gutters + empty space) dismisses,
			// not just taps landing on the form column.
			position: 'absolute',
			top: -1000,
			left: -1000,
			right: -1000,
			bottom: -1000,
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
		ctaWrap: {
			width: '100%',
			maxWidth: 480, // align width with the card above
			alignSelf: 'center',
			marginTop: 16,
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
