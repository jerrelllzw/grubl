import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
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
import { fetchAutoComplete } from '../api/googlePlaces';
import GradientButton from '../components/GradientButton';
import SectionCard from '../components/SectionCard';
import { CATEGORIES, EXCLUSIONS, PRICE_MAP, RADIUS_OPTIONS } from '../constants/googlePlaces';
import { useCurrentLocation } from '../hooks/useCurrentLocation';
import { COLORS, FONTS, RADIUS, SHADOWS } from '../theme/tokens';
import { handleError } from '../utils/errorHandler';

type RootStackParamList = {
	Swipe: {
		location: string;
		categories: string[];
		excluded: string[];
		radius: number;
		priceLevels: string[];
		openNow: boolean;
	};
};

export default function SearchScreen() {
	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

	const [location, setLocation] = useState('');
	const [isLocating, setIsLocating] = useState(false);
	const [suggestions, setSuggestions] = useState<string[]>([]);
	const [showSuggestions, setShowSuggestions] = useState(false);
	const suppressAutocompleteRef = useRef(false);
	const [radius, setRadius] = useState(RADIUS_OPTIONS[0]);
	const [categories, setCategories] = useState<string[]>(Object.keys(CATEGORIES));
	const [excluded, setExcluded] = useState<string[]>([]);
	const [priceLevels, setPriceLevels] = useState<string[]>(Object.keys(PRICE_MAP));
	const [openNow, setOpenNow] = useState(true);

	const clearSuggestions = () => {
		setSuggestions([]);
		setShowSuggestions(false);
	};

	const handleUseCurrentLocationInner = useCurrentLocation(setLocation);
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
				categories,
				excluded,
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

	const categoryKeys = Object.keys(CATEGORIES);
	const exclusionKeys = Object.keys(EXCLUSIONS);
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
							onChangeText={setLocation}
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

				<SectionCard icon='restaurant' label='Categories'>
					<Select
						multiSelect
						size='large'
						value={categories.map((key) => CATEGORIES[key]).join(', ')}
						selectedIndex={categories.map((key) => new IndexPath(categoryKeys.indexOf(key)))}
						onSelect={(index) => {
							if (Array.isArray(index)) {
								const selectedKeys = index
									.map((i) => categoryKeys[i.row])
									.sort((a, b) => categoryKeys.indexOf(a) - categoryKeys.indexOf(b));
								setCategories(selectedKeys.length ? selectedKeys : categories);
							}
						}}
					>
						{categoryKeys.map((key) => (
							<SelectItem key={key} title={CATEGORIES[key]} />
						))}
					</Select>
				</SectionCard>

				<SectionCard icon='close-circle' label='Exclude'>
					<Select
						multiSelect
						size='large'
						placeholder='Nothing excluded'
						value={excluded.length ? excluded.map((key) => EXCLUSIONS[key]).join(', ') : ''}
						selectedIndex={excluded.map((key) => new IndexPath(exclusionKeys.indexOf(key)))}
						onSelect={(index) => {
							if (Array.isArray(index)) {
								const selectedKeys = index
									.map((i) => exclusionKeys[i.row])
									.sort((a, b) => exclusionKeys.indexOf(a) - exclusionKeys.indexOf(b));
								setExcluded(selectedKeys);
							}
						}}
					>
						{exclusionKeys.map((key) => (
							<SelectItem key={key} title={EXCLUSIONS[key]} />
						))}
					</Select>
				</SectionCard>

				<View style={styles.row}>
					<SectionCard icon='navigate' label='Radius' style={styles.flex1}>
						<Select
							size='large'
							selectedIndex={new IndexPath(RADIUS_OPTIONS.indexOf(radius))}
							onSelect={(index) => setRadius(RADIUS_OPTIONS[(index as IndexPath).row])}
							value={`${radius} m`}
						>
							{RADIUS_OPTIONS.map((option) => (
								<SelectItem key={option} title={`${option} m`} />
							))}
						</Select>
					</SectionCard>

					<SectionCard icon='cash' label='Price' style={styles.flex1}>
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
				</View>

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
	row: {
		flexDirection: 'row',
		gap: 14,
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
