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
import { CRAVINGS, DEFAULT_RADIUS, PRICE_KEYS, PRICE_MAP, RADII_OPTIONS } from '../constants/googlePlaces';
import type { SearchQuery } from '../data/restaurants';
import { useCurrentLocation } from '../hooks/useCurrentLocation';
import { handleError } from '../utils/errorHandler';
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
	const suppressAutocomplete = useRef(false);

	const [radius, setRadius] = useState(initial?.radius ?? DEFAULT_RADIUS);
	const [cravings, setCravings] = useState<string[]>(initial?.cravings ?? []);
	const [priceLevels, setPriceLevels] = useState<string[]>(initial?.priceLevels ?? PRICE_KEYS);
	const [openNow, setOpenNow] = useState(initial?.openNow ?? true);

	// Both "none" and "all" prices mean no price constraint — say so plainly.
	const priceIsAny = priceLevels.length === 0 || priceLevels.length === PRICE_KEYS.length;

	const clearSuggestions = () => {
		setSuggestions([]);
		setShowSuggestions(false);
	};

	const onChangeLocation = (text: string) => {
		setLocation(text);
		setCoords(null); // typed text no longer matches the resolved GPS coords
	};

	const toggleCraving = (key: string) =>
		setCravings((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

	const togglePrice = (key: string) =>
		setPriceLevels((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

	const resolveCurrentLocation = useCurrentLocation((label, resolved) => {
		setLocation(label);
		setCoords(resolved);
	});

	const useCurrentLocationPress = async () => {
		try {
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
			handleError('No location', 'Enter a location to start swiping.');
			return;
		}
		Keyboard.dismiss();
		onSearch({
			location: location.trim(),
			coords: coords ?? undefined,
			radius,
			cravings,
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
					<View style={styles.locationRow}>
						<TextInput
							style={styles.input}
							placeholder="Where are you eating?"
							placeholderTextColor="rgba(90,83,71,0.6)"
							value={location}
							onChangeText={onChangeLocation}
							onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
							accessibilityLabel="Location"
						/>
						<Pressable
							style={styles.gpsButton}
							onPress={useCurrentLocationPress}
							disabled={isLocating}
							accessibilityRole="button"
							accessibilityLabel="Use my current location"
						>
							{isLocating ? (
								<ActivityIndicator size="small" color={COLORS.ink} />
							) : (
								<Ionicons name="locate" size={22} color={COLORS.ink} />
							)}
						</Pressable>
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

				{/* Craving */}
				<View style={styles.section}>
					<Text style={styles.label}>CRAVING · {cravings.length ? `${cravings.length} PICKED` : 'ANYTHING'}</Text>
					<View style={styles.chipWrap}>
						{CRAVINGS.map((c) => {
							const active = cravings.includes(c.key);
							return (
								<Pressable
									key={c.key}
									onPress={() => toggleCraving(c.key)}
									style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}
									accessibilityRole="button"
									accessibilityState={{ selected: active }}
									accessibilityLabel={c.label}
								>
									<Text style={styles.chipEmoji}>{c.emoji}</Text>
									<Text style={[styles.chipText, active ? styles.chipTextActive : styles.chipTextInactive]}>{c.label}</Text>
								</Pressable>
							);
						})}
					</View>
				</View>

				{/* Price */}
				<View style={styles.section}>
					<Text style={styles.label}>PRICE · {priceIsAny ? 'ANY' : `${priceLevels.length} PICKED`}</Text>
					<View style={styles.chipWrap}>
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
	locationRow: {
		flexDirection: 'row',
		gap: 10,
	},
	input: {
		flex: 1,
		height: 54,
		backgroundColor: COLORS.paper,
		borderWidth: BORDER,
		borderColor: COLORS.ink,
		borderRadius: RADII.sticker,
		paddingHorizontal: 16,
		fontFamily: FONTS.semibold,
		fontSize: 16,
		color: COLORS.ink,
	},
	gpsButton: {
		width: 54,
		height: 54,
		backgroundColor: COLORS.yolk,
		borderWidth: BORDER,
		borderColor: COLORS.ink,
		borderRadius: RADII.sticker,
		alignItems: 'center',
		justifyContent: 'center',
	},
	dropdown: {
		marginTop: 8,
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
	chip: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		borderRadius: RADII.chip,
		borderWidth: BORDER,
		borderColor: COLORS.ink,
		paddingVertical: 9,
		paddingHorizontal: 14,
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
	chipEmoji: {
		fontSize: 15,
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
