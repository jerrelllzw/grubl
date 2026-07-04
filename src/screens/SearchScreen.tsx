import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
	ActivityIndicator,
	Keyboard,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchAutoComplete, type Coordinates, type Suggestion } from '../api/googlePlaces';
import HardButton from '../components/HardButton';
import { DEFAULT_RADIUS, PRICE_KEYS, PRICE_MAP, RADII_OPTIONS } from '../constants/googlePlaces';
import type { SearchQuery } from '../data/restaurants';
import { useCurrentLocation } from '../hooks/useCurrentLocation';
import { BORDER, COLORS, FONTS, RADII } from '../theme/tokens';

export default function SearchScreen({
	initial,
	onBack,
	onSearch,
}: {
	initial: SearchQuery | null;
	onBack: () => void;
	onSearch: (query: SearchQuery) => void;
}) {
	const insets = useSafeAreaInsets();

	// Seed from the last search so tweaking one filter doesn't mean re-entering all.
	const [location, setLocation] = useState(initial?.location ?? '');
	const [coords, setCoords] = useState<Coordinates | null>(initial?.coords ?? null);
	const [isLocating, setIsLocating] = useState(false);
	const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
	const [showSuggestions, setShowSuggestions] = useState(false);
	const [error, setError] = useState<string | null>(null); // inline, on-brand feedback
	const suppressAutocomplete = useRef(false);

	const [radius, setRadius] = useState(initial?.radius ?? DEFAULT_RADIUS);
	// Empty = "any price" (no constraint). An explicit ANY chip owns that state so
	// the user never has to reason about "all off means all on".
	const [priceLevels, setPriceLevels] = useState<string[]>(initial?.priceLevels ?? []);
	const [openNow, setOpenNow] = useState(initial?.openNow ?? true);

	const priceIsAny = priceLevels.length === 0;

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

	// The ANY chip clears every specific price back to "no constraint".
	const setAnyPrice = () => setPriceLevels([]);

	const resolveCurrentLocation = useCurrentLocation(
		(label, resolved) => {
			setLocation(label);
			setCoords(resolved);
			setError(null);
		},
		setError
	);

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
		if (!location.trim()) {
			setError('Tell grubl where you are to start swiping.');
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
				<Pressable
					style={styles.backButton}
					onPress={onBack}
					hitSlop={8}
					accessibilityRole="button"
					accessibilityLabel="Back"
				>
					<Ionicons name="chevron-back" size={24} color={COLORS.ink} />
				</Pressable>
				<Text style={styles.title}>WHAT SOUNDS GOOD?</Text>
			</View>

			<ScrollView
				style={styles.scroll}
				contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
				keyboardShouldPersistTaps="handled"
				showsVerticalScrollIndicator={false}
				onScrollBeginDrag={() => {
					Keyboard.dismiss();
					setShowSuggestions(false);
				}}
			>
				{/* Location */}
				<View style={styles.locationSection}>
					<Text style={styles.label}>LOCATION</Text>

					{/* GPS is the fast path for a "just tell me where to eat" app — lead with it. */}
					<Pressable
						style={styles.gpsPrimary}
						onPress={useCurrentLocationPress}
						disabled={isLocating}
						accessibilityRole="button"
						accessibilityLabel="Use my current location"
					>
						{isLocating ? (
							<ActivityIndicator size="small" color={COLORS.ink} />
						) : (
							<Ionicons name="locate" size={20} color={COLORS.ink} />
						)}
						<Text style={styles.gpsPrimaryText}>{isLocating ? 'LOCATING…' : 'USE MY LOCATION'}</Text>
					</Pressable>

					<Text style={styles.orType}>or type an address</Text>

					{/* Anchor keeps the floating dropdown positioned to the input, not the section. */}
					<View style={styles.locationAnchor}>
						<View style={styles.inputWrap}>
							<TextInput
								style={styles.input}
								placeholder="Where are you eating?"
								placeholderTextColor="rgba(90,83,71,0.6)"
								value={location}
								onChangeText={onChangeLocation}
								onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
								accessibilityLabel="Location"
							/>
							{location.length > 0 && (
								<Pressable
									style={styles.clearButton}
									onPress={clearLocation}
									hitSlop={8}
									accessibilityRole="button"
									accessibilityLabel="Clear location"
								>
									<Ionicons name="close-circle" size={20} color="rgba(90,83,71,0.7)" />
								</Pressable>
							)}
						</View>

						{showSuggestions && suggestions.length > 0 && (
							<View style={styles.dropdown}>
								{suggestions.slice(0, 5).map((item, i) => (
									<Pressable
										key={`${item.label}-${i}`}
										style={styles.suggestion}
										accessibilityRole="button"
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
										<Ionicons name="location-outline" size={16} color={COLORS.tomato} />
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
						<View style={styles.errorBanner} accessibilityRole="alert">
							<Ionicons name="alert-circle" size={18} color={COLORS.tomato} />
							<Text style={styles.errorText}>{error}</Text>
						</View>
					)}
				</View>

				{/* Radius */}
				<View style={styles.section}>
					<Text style={styles.label}>HOW FAR</Text>
					<View style={styles.chipWrap}>
						{RADII_OPTIONS.map((r) => {
							const active = radius === r;
							return (
								<Pressable
									key={r}
									onPress={() => setRadius(r)}
									style={[styles.priceChip, active ? styles.chipActive : styles.chipInactive]}
									accessibilityRole="button"
									accessibilityState={{ selected: active }}
									accessibilityLabel={`Within ${r}`}
								>
									<Text style={[styles.chipText, active ? styles.chipTextActive : styles.chipTextInactive]}>{r}</Text>
								</Pressable>
							);
						})}
					</View>
				</View>

				{/* Price */}
				<View style={styles.section}>
					<Text style={styles.label}>PRICE</Text>
					<View style={styles.chipWrap}>
						<Pressable
								onPress={setAnyPrice}
								style={[styles.priceChip, priceIsAny ? styles.chipActive : styles.chipInactive]}
								accessibilityRole="button"
								accessibilityState={{ selected: priceIsAny }}
								accessibilityLabel="Any price"
							>
								<Text style={[styles.chipText, priceIsAny ? styles.chipTextActive : styles.chipTextInactive]}>ANY</Text>
							</Pressable>
							{PRICE_KEYS.map((key) => {
							const active = priceLevels.includes(key);
							return (
								<Pressable
									key={key}
									onPress={() => togglePrice(key)}
									style={[styles.priceChip, active ? styles.chipActive : styles.chipInactive]}
									accessibilityRole="button"
									accessibilityState={{ selected: active }}
									accessibilityLabel={`Price ${PRICE_MAP[key]}`}
								>
									<Text style={[styles.chipText, active ? styles.chipTextActive : styles.chipTextInactive]}>{PRICE_MAP[key]}</Text>
								</Pressable>
							);
						})}
					</View>
				</View>

				{/* Open now */}
				<Pressable
					style={styles.toggleRow}
					onPress={() => setOpenNow((v) => !v)}
					accessibilityRole="switch"
					accessibilityLabel="Open now"
					accessibilityState={{ checked: openNow }}
				>
					<View>
						<Text style={styles.toggleTitle}>Open now</Text>
						<Text style={styles.toggleHint}>Only show places open right now</Text>
					</View>
					<View style={[styles.toggleTrack, openNow ? styles.toggleOn : styles.toggleOff]}>
						<View style={[styles.toggleKnob, openNow ? styles.knobOn : styles.knobOff]} />
					</View>
				</Pressable>
			</ScrollView>

			<View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
				<HardButton dx={6} dy={6} color={COLORS.tomato} radius={RADII.cta} onPress={handleFind} accessibilityLabel="Find food" faceStyle={styles.ctaFace}>
					<Text style={styles.ctaText}>FIND FOOD →</Text>
				</HardButton>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: COLORS.cream,
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
		paddingHorizontal: 20,
		paddingBottom: 10,
	},
	backButton: {
		width: 44,
		height: 44,
		borderRadius: RADII.sticker,
		backgroundColor: COLORS.paper,
		borderWidth: BORDER,
		borderColor: COLORS.ink,
		alignItems: 'center',
		justifyContent: 'center',
	},
	title: {
		fontFamily: FONTS.display,
		fontSize: 22,
		color: COLORS.ink,
	},
	scroll: {
		flex: 1,
	},
	scrollContent: {
		paddingHorizontal: 20,
		paddingTop: 8,
		gap: 22,
	},
	label: {
		fontFamily: FONTS.bold,
		fontSize: 13,
		letterSpacing: 1.2,
		color: COLORS.ink,
		marginBottom: 12,
	},
	locationSection: {
		zIndex: 30,
	},
	locationAnchor: {
		position: 'relative',
		zIndex: 30,
	},
	errorBanner: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		marginTop: 12,
		paddingVertical: 10,
		paddingHorizontal: 12,
		backgroundColor: COLORS.paper,
		borderWidth: 2,
		borderColor: COLORS.tomato,
		borderRadius: RADII.sticker,
	},
	errorText: {
		flex: 1,
		fontFamily: FONTS.semibold,
		fontSize: 13,
		color: COLORS.ink,
	},
	gpsPrimary: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 10,
		height: 54,
		backgroundColor: COLORS.yolk,
		borderWidth: BORDER,
		borderColor: COLORS.ink,
		borderRadius: RADII.sticker,
	},
	gpsPrimaryText: {
		fontFamily: FONTS.bold,
		fontSize: 15,
		letterSpacing: 0.5,
		color: COLORS.ink,
	},
	orType: {
		marginTop: 12,
		marginBottom: 10,
		fontFamily: FONTS.medium,
		fontSize: 13,
		color: COLORS.muted,
	},
	inputWrap: {
		width: '100%',
		position: 'relative',
		justifyContent: 'center',
	},
	input: {
		width: '100%',
		height: 54,
		backgroundColor: COLORS.paper,
		borderWidth: BORDER,
		borderColor: COLORS.ink,
		borderRadius: RADII.sticker,
		paddingLeft: 16,
		paddingRight: 44, // room for the clear button
		fontFamily: FONTS.semibold,
		fontSize: 16,
		color: COLORS.ink,
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
		backgroundColor: COLORS.paper,
		borderWidth: BORDER,
		borderColor: COLORS.ink,
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
		borderBottomColor: 'rgba(26,26,26,0.1)',
	},
	suggestionText: {
		flex: 1,
		fontFamily: FONTS.medium,
		fontSize: 14,
		color: COLORS.ink,
	},
	attribution: {
		fontFamily: FONTS.medium,
		fontSize: 10,
		color: COLORS.muted,
		textAlign: 'right',
		paddingHorizontal: 14,
		paddingVertical: 6,
	},
	section: {},
	chipWrap: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
	},
	priceChip: {
		minWidth: 56,
		alignItems: 'center',
		borderRadius: RADII.chip,
		borderWidth: BORDER,
		borderColor: COLORS.ink,
		paddingVertical: 10,
		paddingHorizontal: 16,
	},
	chipActive: {
		backgroundColor: COLORS.ink,
	},
	chipInactive: {
		backgroundColor: COLORS.paper,
	},
	chipText: {
		fontFamily: FONTS.bold,
		fontSize: 14,
	},
	chipTextActive: {
		color: COLORS.cream,
	},
	chipTextInactive: {
		color: COLORS.ink,
	},
	toggleRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		backgroundColor: COLORS.paper,
		borderWidth: BORDER,
		borderColor: COLORS.ink,
		borderRadius: RADII.sticker,
		padding: 16,
	},
	toggleTitle: {
		fontFamily: FONTS.bold,
		fontSize: 16,
		color: COLORS.ink,
	},
	toggleHint: {
		fontFamily: FONTS.medium,
		fontSize: 12,
		color: COLORS.muted,
		marginTop: 2,
	},
	toggleTrack: {
		width: 56,
		height: 32,
		borderRadius: RADII.pill,
		borderWidth: BORDER,
		borderColor: COLORS.ink,
		justifyContent: 'center',
		paddingHorizontal: 3,
	},
	toggleOn: {
		backgroundColor: COLORS.green,
	},
	toggleOff: {
		backgroundColor: COLORS.paper,
	},
	toggleKnob: {
		width: 20,
		height: 20,
		borderRadius: RADII.pill,
		backgroundColor: COLORS.ink,
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
		backgroundColor: COLORS.cream,
		borderTopWidth: 1,
		borderTopColor: 'rgba(26,26,26,0.1)',
	},
	ctaFace: {
		width: '100%',
		paddingVertical: 18,
		alignItems: 'center',
		backgroundColor: COLORS.ink,
		borderWidth: BORDER,
		borderColor: COLORS.ink,
	},
	ctaText: {
		fontFamily: FONTS.display,
		fontSize: 20,
		color: COLORS.cream,
	},
});
