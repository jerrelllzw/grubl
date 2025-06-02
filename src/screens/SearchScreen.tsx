import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button, IndexPath, Input, Layout, Select, SelectItem, Text } from '@ui-kitten/components';
import React, { useState } from 'react';
import { Keyboard, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { PLACE_TYPE_OPTIONS, RADIUS_OPTIONS } from '../constants/googlePlaces';
import { useCurrentLocation } from '../hooks/useCurrentLocation';
import { handleError } from '../utils/errorHandler';

type RootStackParamList = {
	Swipe: { location: string; radius: number; placeTypes: string[] };
};

export default function SearchScreen() {
	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

	const [location, setLocation] = useState('');
	const [placeTypes, setPlaceTypes] = useState<string[]>(PLACE_TYPE_OPTIONS.map((option) => option.value));
	const [radius, setRadius] = useState(RADIUS_OPTIONS[1]);

	const handleUseCurrentLocation = useCurrentLocation(setLocation);

	const handlePlaceTypeToggle = (value: string) => {
		setPlaceTypes((prev) => {
			if (prev.includes(value)) {
				return prev.length > 1 ? prev.filter((t) => t !== value) : prev;
			} else {
				return [...prev, value];
			}
		});
	};

	const handleSearch = () => {
		if (location.trim()) {
			navigation.navigate('Swipe', {
				location,
				radius,
				placeTypes,
			});
		} else {
			handleError('No location entered', 'Please enter a location.');
		}
	};

	return (
		<TouchableWithoutFeedback onPress={Keyboard.dismiss}>
			<Layout style={styles.container}>
				<Text category='h6' style={styles.header}>
					Location:
				</Text>
				<Layout style={styles.inputRow}>
					<Input
						placeholder='e.g. Lot 1'
						value={location}
						onChangeText={setLocation}
						style={[styles.input, { flex: 1 }]}
					/>
					<Button size='small' appearance='outline' onPress={handleUseCurrentLocation} style={styles.useLocationButton}>
						📍
					</Button>
				</Layout>

				<Text style={styles.radiusLabel}>Search Radius:</Text>
				<Select
					selectedIndex={new IndexPath(RADIUS_OPTIONS.indexOf(radius))}
					onSelect={(index) => setRadius(RADIUS_OPTIONS[(index as IndexPath).row])}
					value={`${radius}m`}
					style={styles.radiusSelect}
				>
					{RADIUS_OPTIONS.map((option) => (
						<SelectItem key={option} title={`${option}m`} />
					))}
				</Select>

				<Text style={styles.radiusLabel}>Place Types:</Text>
				<Layout style={styles.placeTypeContainer}>
					{PLACE_TYPE_OPTIONS.map(({ label, value }) => (
						<Button
							key={value}
							size='tiny'
							appearance={placeTypes.includes(value) ? 'filled' : 'outline'}
							status={placeTypes.includes(value) ? 'primary' : 'basic'}
							style={styles.typeButton}
							onPress={() => handlePlaceTypeToggle(value)}
						>
							{label}
						</Button>
					))}
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
	},
	header: {
		marginBottom: 8,
	},
	inputRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 4,
	},
	input: {
		marginBottom: 4,
	},
	useLocationButton: {
		marginLeft: 8,
		marginBottom: 4,
	},
	radiusLabel: {
		marginBottom: 4,
	},
	radiusSelect: {
		marginBottom: 16,
	},
	typeButton: {
		margin: 4,
	},
	placeTypeContainer: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'center',
		marginBottom: 16,
	},
});
