import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
	Button,
	IndexPath,
	Input,
	Layout,
	List,
	ListItem,
	Select,
	SelectItem,
	Text,
	Toggle,
} from '@ui-kitten/components';
import React, { useEffect, useRef, useState } from 'react';
import { Keyboard, StyleSheet, TouchableWithoutFeedback, View } from 'react-native';
import { fetchAutoComplete } from '../api/googlePlaces';
import { CATEGORIES, EXCLUSIONS, PRICE_MAP, RADIUS_OPTIONS } from '../constants/googlePlaces';
import { useCurrentLocation } from '../hooks/useCurrentLocation';
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

	const handleOpenNowToggle = () => {
		setOpenNow((prev) => !prev);
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
			handleError('No location entered', 'Please enter a location.');
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
				} catch (e) {
					clearSuggestions();
				}
			}
		}, 300);

		return () => clearTimeout(timeout);
	}, [location]);

	return (
		<TouchableWithoutFeedback
			onPress={() => {
				Keyboard.dismiss();
				setShowSuggestions(false);
			}}
		>
			<Layout style={styles.container}>
				<Layout>
					<Text category='h6' style={styles.header}>
						Location
					</Text>
					<View style={{ position: 'relative' }}>
						<Layout style={styles.locationContainer}>
							<Input
								placeholder='Enter a location'
								value={location}
								onChangeText={setLocation}
								style={{ flex: 1 }}
								onFocus={() => {
									if (suggestions.length) setShowSuggestions(true);
								}}
							/>
							<Button
								size='small'
								status='basic'
								appearance='outline'
								onPress={handleUseCurrentLocation}
								disabled={isLocating}
							>
								{isLocating ? '...' : '📍'}
							</Button>
						</Layout>

						{showSuggestions && suggestions.length > 0 && (
							<View style={styles.suggestionDropdown}>
								<List
									data={suggestions}
									renderItem={({ item }) => (
										<ListItem
											title={item}
											onPress={() => {
												suppressAutocompleteRef.current = true;
												setLocation(item);
												clearSuggestions();
												setTimeout(() => (suppressAutocompleteRef.current = false), 500);
											}}
										/>
									)}
								/>
							</View>
						)}
					</View>
				</Layout>

				<Layout>
					<Text category='h6' style={styles.header}>
						Categories
					</Text>
					<Select
						multiSelect
						value={categories.map((key) => CATEGORIES[key]).join(', ')}
						selectedIndex={categories.map((key) => new IndexPath(Object.keys(CATEGORIES).indexOf(key)))}
						onSelect={(index) => {
							if (Array.isArray(index)) {
								const selectedKeys = index
									.map((i) => Object.keys(CATEGORIES)[i.row])
									.sort((a, b) => Object.keys(CATEGORIES).indexOf(a) - Object.keys(CATEGORIES).indexOf(b));
								setCategories(selectedKeys.length ? selectedKeys : categories);
							}
						}}
					>
						{Object.keys(CATEGORIES).map((key) => (
							<SelectItem key={key} title={CATEGORIES[key]} />
						))}
					</Select>
				</Layout>

				<Layout>
					<Text category='h6' style={styles.header}>
						Exclude
					</Text>
					<Select
						multiSelect
						placeholder={'None'}
						value={excluded.map((key) => EXCLUSIONS[key]).join(', ')}
						selectedIndex={excluded.map((key) => new IndexPath(Object.keys(EXCLUSIONS).indexOf(key)))}
						onSelect={(index) => {
							if (Array.isArray(index)) {
								const selectedKeys = index
									.map((i) => Object.keys(EXCLUSIONS)[i.row])
									.sort((a, b) => Object.keys(EXCLUSIONS).indexOf(a) - Object.keys(EXCLUSIONS).indexOf(b));
								setExcluded(selectedKeys);
							}
						}}
					>
						{Object.keys(EXCLUSIONS).map((key) => (
							<SelectItem key={key} title={EXCLUSIONS[key]} />
						))}
					</Select>
				</Layout>

				<Layout>
					<Text category='h6' style={styles.header}>
						Radius
					</Text>
					<Select
						selectedIndex={new IndexPath(RADIUS_OPTIONS.indexOf(radius))}
						onSelect={(index) => setRadius(RADIUS_OPTIONS[(index as IndexPath).row])}
						value={`${radius}m`}
					>
						{RADIUS_OPTIONS.map((option) => (
							<SelectItem key={option} title={`${option}m`} />
						))}
					</Select>
				</Layout>

				<Layout>
					<Text category='h6' style={styles.header}>
						Price Level
					</Text>
					<Select
						multiSelect
						value={priceLevels.map((key) => PRICE_MAP[key]).join(', ')}
						selectedIndex={priceLevels.map((key) => new IndexPath(Object.keys(PRICE_MAP).indexOf(key)))}
						onSelect={(index) => {
							if (Array.isArray(index)) {
								const selectedKeys = index
									.map((i) => Object.keys(PRICE_MAP)[i.row])
									.sort((a, b) => Object.keys(PRICE_MAP).indexOf(a) - Object.keys(PRICE_MAP).indexOf(b));
								setPriceLevels(selectedKeys.length ? selectedKeys : priceLevels);
							}
						}}
					>
						{Object.keys(PRICE_MAP).map((key) => (
							<SelectItem key={key} title={PRICE_MAP[key]} />
						))}
					</Select>
				</Layout>

				<Layout style={styles.openNowContainer}>
					<Text>Only show places that are open now</Text>
					<Toggle checked={openNow} onChange={handleOpenNowToggle}></Toggle>
				</Layout>

				<Button onPress={handleSearch}>Search</Button>
			</Layout>
		</TouchableWithoutFeedback>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 48,
		justifyContent: 'center',
		gap: 16,
	},
	header: {
		marginBottom: 8,
	},
	locationContainer: {
		flexDirection: 'row',
		gap: 8,
	},
	openNowContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	suggestionDropdown: {
		position: 'absolute',
		top: 52,
		left: 0,
		right: 0,
		borderRadius: 8,
		maxHeight: 200,
		zIndex: 10,
		elevation: 5,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.2,
		shadowRadius: 4,
	},
});
