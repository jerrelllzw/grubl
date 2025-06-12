import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button, IndexPath, Input, Layout, Select, SelectItem, Text, Toggle } from '@ui-kitten/components';
import React, { useState } from 'react';
import { Keyboard, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { PLACE_TYPE_OPTIONS, PRICE_MAP, RADIUS_OPTIONS } from '../constants/googlePlaces';
import { useCurrentLocation } from '../hooks/useCurrentLocation';
import { handleError } from '../utils/errorHandler';

type RootStackParamList = {
	Swipe: { location: string; radius: number; placeTypes: string[]; priceLevels: string[]; openNow: boolean };
};

export default function SearchScreen() {
	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

	const [location, setLocation] = useState('');
	const [isLocating, setIsLocating] = useState(false);
	const [radius, setRadius] = useState(RADIUS_OPTIONS[0]);
	const [selectedPlaceTypes, setSelectedPlaceTypes] = useState<IndexPath[]>(
		PLACE_TYPE_OPTIONS.map((_, i) => new IndexPath(i))
	);
	const [priceLevels, setPriceLevels] = useState<string[]>(Object.keys(PRICE_MAP));
	const [openNow, setOpenNow] = useState(true);

	const handleUseCurrentLocationInner = useCurrentLocation(setLocation);
	const handleUseCurrentLocation = async () => {
		try {
			setIsLocating(true);
			await handleUseCurrentLocationInner();
		} finally {
			setIsLocating(false);
		}
	};

	const handlePriceLevelToggle = (value: string) => {
		setPriceLevels((prev) => {
			if (prev.includes(value)) {
				return prev.length > 1 ? prev.filter((lvl) => lvl !== value) : prev;
			} else {
				return [...prev, value];
			}
		});
	};

	const handleOpenNowToggle = () => {
		setOpenNow((prev) => !prev);
	};

	const handleSearch = () => {
		if (location.trim()) {
			navigation.navigate('Swipe', {
				location,
				radius,
				placeTypes: selectedPlaceTypes.map((i) => PLACE_TYPE_OPTIONS[i.row].value),
				priceLevels,
				openNow,
			});
		} else {
			handleError('No location entered', 'Please enter a location.');
		}
	};

	return (
		<TouchableWithoutFeedback onPress={Keyboard.dismiss}>
			<Layout style={styles.container}>
				<Layout>
					<Text category='h6' style={styles.header}>
						Location
					</Text>
					<Layout style={styles.locationContainer}>
						<Input
							placeholder='Enter a city, address, or use current location'
							value={location}
							onChangeText={setLocation}
							style={{ flex: 1 }}
						/>
						<Button
							size='small'
							status='basic'
							appearance='outline'
							onPress={handleUseCurrentLocation}
							disabled={isLocating}
						>
							{isLocating ? <Text>...</Text> : '📍'}
						</Button>
					</Layout>
				</Layout>

				<Layout>
					<Text category='h6' style={styles.header}>
						Search Radius
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
						Place Types
					</Text>
					<Select
						multiSelect
						placeholder='Select place types'
						value={selectedPlaceTypes.map((i) => PLACE_TYPE_OPTIONS[i.row]?.label).join(', ')}
						selectedIndex={selectedPlaceTypes}
						onSelect={(index) => {
							if (Array.isArray(index)) {
								setSelectedPlaceTypes(index);
							}
						}}
					>
						{PLACE_TYPE_OPTIONS.map((item) => (
							<SelectItem key={item.value} title={item.label} />
						))}
					</Select>
				</Layout>

				<Layout>
					<Text category='h6' style={styles.header}>
						Price Level
					</Text>
					<Layout style={styles.multiSelectContainer}>
						{Object.keys(PRICE_MAP).map((key) => {
							return (
								<Button
									key={key}
									size='tiny'
									appearance={priceLevels.includes(key) ? 'filled' : 'outline'}
									status={priceLevels.includes(key) ? 'primary' : 'basic'}
									onPress={() => handlePriceLevelToggle(key)}
								>
									{PRICE_MAP[key]}
								</Button>
							);
						})}
					</Layout>
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
		padding: 32,
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
	multiSelectContainer: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 4,
	},
	openNowContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
});
