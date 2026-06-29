import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Slider from '@react-native-community/slider';
import {
	IndexPath,
	Input,
	List,
	ListItem,
	Select,
	SelectItem,
	Toggle,
} from '@ui-kitten/components';
import React, { useEffect, useRef, useState } from 'react';
import {
	ActivityIndicator,
	Keyboard,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Coordinates, fetchAutoComplete } from '../api/googlePlaces';
import GradientButton from '../components/GradientButton';
import SectionCard from '../components/SectionCard';
import {
	CRAVINGS,
	formatRadius,
	PRICE_MAP,
	RADIUS_DEFAULT,
	RADIUS_MAX,
	RADIUS_MIN,
	RADIUS_STEP,
} from '../constants/googlePlaces';
import { useCurrentLocation } from '../hooks/useCurrentLocation';
import { COLORS, FONTS, RADIUS, SHADOWS } from '../theme/tokens';
import { handleError } from '../utils/errorHandler';

type RootStackParamList = {
	Swipe: {
		location: string;
		coords?: Coordinates;
		cravings: string[];
		radius: number;
		priceLevels: string[];
		openNow: boolean;
	};
};

export default function SearchScreen() {
	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

	const [location, setLocation] = useState('');
	// Exact coordinates when the user picks "current location"; cleared the
	// moment they type, since the text no longer matches these coords.
	const [coords, setCoords] = useState<Coordinates | null>(null);
	const [isLocating, setIsLocating] = useState(false);
	const [suggestions, setSuggestions] = useState<string[]>([]);
	const [showSuggestions, setShowSuggestions] = useState(false);
	const suppressAutocompleteRef = useRef(false);

	const [radius, setRadius] = useState(RADIUS_DEFAULT);
	const [cravings, setCravings] = useState<string[]>([]);
	const [priceLevels, setPriceLevels] = useState<string[]>(Object.keys(PRICE_MAP));
	const [openNow, setOpenNow] = useState(true);

	const clearSuggestions = () => {
		setSuggestions([]);
		setShowSuggestions(false);
	};

	const onChangeLocation = (text: string) => {
		setLocation(text);
		setCoords(null);
	};

	const toggleCraving = (key: string) => {
		setCravings((prev) =>
			prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
		);
	};

	const handleUseCurrentLocationInner = useCurrentLocation((label, resolved) => {
		setLocation(label);
		setCoords(resolved);
	});
	const handleUseCurrentLocation = async () => {
		try {
			setIsLocating(true);
			suppressAutocompleteRef.current = true;
			await handleUseCurrentLocationInner();
			clearSuggestions();
		} finally {
			setIsLocating(false);
			setTimeout(() => (suppressAutocompleteRef.current = false), 500);
		}
	};

	const handleSearch = () => {
		if (location.trim()) {
			navigation.navigate('Swipe', {
				location,
				coords: coords ?? undefined,
				cravings,
				radius,
				priceLevels,
				openNow,
			});
		} else {
			handleError('No location entered', 'Please enter a location to start.');
		}
	};

	useEffect(() => {
		if (suppressAutocompleteRef.current) return;

		const timeout = setTimeout(async () => {
			if (location.trim().length > 2) {
				try {
					const results = await fetchAutoComplete(location);
					setSuggestions(results);
					setShowSuggestions(true);
				} catch {
					clearSuggestions();
				}
			}
		}, 300);

		return () => clearTimeout(timeout);
	}, [location]);

	const priceKeys = Object.keys(PRICE_MAP);

	return (
		<SafeAreaView style={styles.container} edges={['top', 'bottom']}>
			<View style={styles.header}>
				<Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
					<Ionicons name='chevron-back' size={24} color={COLORS.ink} />
				</Pressable>
				<View>
					<Text style={styles.headerTitle}>What sounds good?</Text>
					<Text style={styles.headerSubtitle}>Set your taste, then start swiping</Text>
				</View>
			</View>

			<ScrollView
				style={styles.scroll}
				contentContainerStyle={styles.scrollContent}
				keyboardShouldPersistTaps='handled'
				showsVerticalScrollIndicator={false}
				onScrollBeginDrag={() => {
					Keyboard.dismiss();
					setShowSuggestions(false);
				}}
			>
				<SectionCard icon='location' label='Location' style={styles.locationSection}>
					<View style={styles.locationRow}>
						<Input
							placeholder='Where are you eating?'
							value={location}
							onChangeText={onChangeLocation}
							size='large'
							style={styles.input}
							onFocus={() => {
								if (suggestions.length) setShowSuggestions(true);
							}}
						/>
						<Pressable
							style={styles.locButton}
							onPress={handleUseCurrentLocation}
							disabled={isLocating}
						>
							{isLocating ? (
								<ActivityIndicator size='small' color={COLORS.brand} />
							) : (
								<Ionicons name='locate' size={22} color={COLORS.brand} />
							)}
						</Pressable>
					</View>

					{showSuggestions && suggestions.length > 0 && (
						<View style={[styles.suggestionDropdown, SHADOWS.card]}>
							<List
								data={suggestions}
								keyboardShouldPersistTaps='handled'
								renderItem={({ item }) => (
									<ListItem
										title={item}
										onPress={() => {
											suppressAutocompleteRef.current = true;
											setLocation(item);
											setCoords(null);
											clearSuggestions();
											Keyboard.dismiss();
											setTimeout(() => (suppressAutocompleteRef.current = false), 500);
										}}
									/>
								)}
							/>
						</View>
					)}
				</SectionCard>

				<SectionCard icon='fast-food' label='Craving'>
					<Text style={styles.cravingHint}>
						{cravings.length ? `${cravings.length} selected` : 'Pick a few, or leave blank to see everything'}
					</Text>
					<View style={styles.cravingGrid}>
						{CRAVINGS.map((craving) => {
							const active = cravings.includes(craving.key);
							return (
								<Pressable
									key={craving.key}
									onPress={() => toggleCraving(craving.key)}
									style={[styles.cravingChip, active && styles.cravingChipActive]}
								>
									<Text style={styles.cravingEmoji}>{craving.emoji}</Text>
									<Text style={[styles.cravingLabel, active && styles.cravingLabelActive]}>
										{craving.label}
									</Text>
								</Pressable>
							);
						})}
					</View>
				</SectionCard>

				<SectionCard icon='navigate' label='Distance'>
					<View style={styles.radiusRow}>
						<Text style={styles.radiusValue}>{formatRadius(radius)}</Text>
						<Text style={styles.radiusCaption}>around your spot</Text>
					</View>
					<Slider
						minimumValue={RADIUS_MIN}
						maximumValue={RADIUS_MAX}
						step={RADIUS_STEP}
						value={radius}
						onValueChange={setRadius}
						minimumTrackTintColor={COLORS.brand}
						maximumTrackTintColor={COLORS.hairline}
						thumbTintColor={COLORS.brand}
					/>
				</SectionCard>

				<SectionCard icon='cash' label='Price'>
					<Select
						multiSelect
						size='large'
						value={priceLevels.map((key) => PRICE_MAP[key]).join(' ')}
						selectedIndex={priceLevels.map((key) => new IndexPath(priceKeys.indexOf(key)))}
						onSelect={(index) => {
							if (Array.isArray(index)) {
								const selectedKeys = index
									.map((i) => priceKeys[i.row])
									.sort((a, b) => priceKeys.indexOf(a) - priceKeys.indexOf(b));
								setPriceLevels(selectedKeys.length ? selectedKeys : priceLevels);
							}
						}}
					>
						{priceKeys.map((key) => (
							<SelectItem key={key} title={PRICE_MAP[key]} />
						))}
					</Select>
				</SectionCard>

				<View style={[styles.openNowCard, SHADOWS.soft]}>
					<View style={styles.openNowText}>
						<View style={styles.iconBadge}>
							<Ionicons name='time' size={16} color={COLORS.brand} />
						</View>
						<View style={styles.flex1}>
							<Text style={styles.openNowTitle}>Open now</Text>
							<Text style={styles.openNowHint}>Only show places currently open</Text>
						</View>
					</View>
					<Toggle checked={openNow} onChange={() => setOpenNow((prev) => !prev)} />
				</View>
			</ScrollView>

			<View style={styles.footer}>
				<GradientButton title='Find Food' icon='search' onPress={handleSearch} />
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: COLORS.bg,
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		paddingHorizontal: 20,
		paddingBottom: 12,
	},
	backButton: {
		width: 44,
		height: 44,
		borderRadius: 14,
		backgroundColor: COLORS.surface,
		alignItems: 'center',
		justifyContent: 'center',
		...SHADOWS.soft,
	},
	headerTitle: {
		fontFamily: FONTS.extrabold,
		fontSize: 22,
		color: COLORS.ink,
	},
	headerSubtitle: {
		fontFamily: FONTS.regular,
		fontSize: 13,
		color: COLORS.muted,
	},
	scroll: {
		flex: 1,
	},
	scrollContent: {
		paddingHorizontal: 20,
		paddingTop: 8,
		paddingBottom: 24,
		gap: 14,
	},
	locationSection: {
		zIndex: 30,
		elevation: 30,
	},
	locationRow: {
		flexDirection: 'row',
		gap: 10,
	},
	input: {
		flex: 1,
		borderRadius: RADIUS.md,
	},
	locButton: {
		width: 52,
		height: 52,
		borderRadius: RADIUS.md,
		backgroundColor: COLORS.brandSoft,
		alignItems: 'center',
		justifyContent: 'center',
	},
	suggestionDropdown: {
		position: 'absolute',
		top: 92,
		left: 16,
		right: 16,
		backgroundColor: COLORS.surface,
		borderRadius: RADIUS.md,
		maxHeight: 220,
		overflow: 'hidden',
		zIndex: 50,
		elevation: 40,
	},

	/* Craving picker */
	cravingHint: {
		fontFamily: FONTS.regular,
		fontSize: 12,
		color: COLORS.muted,
		marginTop: -4,
	},
	cravingGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
	},
	cravingChip: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		paddingHorizontal: 12,
		paddingVertical: 9,
		borderRadius: RADIUS.pill,
		backgroundColor: COLORS.surfaceAlt,
		borderWidth: 1.5,
		borderColor: 'transparent',
	},
	cravingChipActive: {
		backgroundColor: COLORS.brandSoft,
		borderColor: COLORS.brand,
	},
	cravingEmoji: {
		fontSize: 15,
	},
	cravingLabel: {
		fontFamily: FONTS.semibold,
		fontSize: 13,
		color: COLORS.body,
	},
	cravingLabelActive: {
		color: COLORS.brandDark,
	},

	/* Distance slider */
	radiusRow: {
		flexDirection: 'row',
		alignItems: 'baseline',
		gap: 8,
		marginTop: -2,
	},
	radiusValue: {
		fontFamily: FONTS.extrabold,
		fontSize: 20,
		color: COLORS.ink,
	},
	radiusCaption: {
		fontFamily: FONTS.regular,
		fontSize: 13,
		color: COLORS.muted,
	},

	flex1: {
		flex: 1,
	},
	openNowCard: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		backgroundColor: COLORS.surface,
		borderRadius: RADIUS.lg,
		padding: 16,
	},
	openNowText: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
		flex: 1,
		paddingRight: 12,
	},
	iconBadge: {
		width: 30,
		height: 30,
		borderRadius: 10,
		backgroundColor: COLORS.brandSoft,
		alignItems: 'center',
		justifyContent: 'center',
	},
	openNowTitle: {
		fontFamily: FONTS.semibold,
		fontSize: 15,
		color: COLORS.ink,
	},
	openNowHint: {
		fontFamily: FONTS.regular,
		fontSize: 12,
		color: COLORS.muted,
	},
	footer: {
		paddingHorizontal: 20,
		paddingTop: 10,
		paddingBottom: 8,
		backgroundColor: COLORS.bg,
		borderTopWidth: 1,
		borderTopColor: COLORS.hairline,
	},
});
