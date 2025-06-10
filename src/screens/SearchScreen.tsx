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
	const [radius, setRadius] = useState(RADIUS_OPTIONS[0]);
	const [isLocating, setIsLocating] = useState(false);
	const handleUseCurrentLocationInner = useCurrentLocation(setLocation);

	const handleUseCurrentLocation = async () => {
		try {
			setIsLocating(true);
			await handleUseCurrentLocationInner();
		} finally {
			setIsLocating(false);
		}
	};

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
				<Layout>
					<Text category='h6' style={styles.header}>
						Location:
					</Text>
					<Layout style={styles.locationContainer}>
						<Input placeholder='e.g. Lot 1' value={location} onChangeText={setLocation} style={{ flex: 1 }} />
						<Button
							size='small'
							status='warning'
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
						Search Radius:
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
						Place Types:
					</Text>
					<Layout style={styles.placeTypeContainer}>
						{PLACE_TYPE_OPTIONS.map(({ label, value }) => (
							<Button
								key={value}
								size='tiny'
								appearance={placeTypes.includes(value) ? 'filled' : 'outline'}
								status={placeTypes.includes(value) ? 'success' : 'basic'}
								onPress={() => handlePlaceTypeToggle(value)}
							>
								{label}
							</Button>
						))}
					</Layout>
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
		alignItems: 'center',
		gap: 8,
	},
	placeTypeContainer: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'center',
		gap: 4,
	},
});
