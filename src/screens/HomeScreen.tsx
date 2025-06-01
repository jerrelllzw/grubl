import Slider from '@react-native-community/slider';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button, Input, Layout, Text } from '@ui-kitten/components';
import React, { useState } from 'react';
import { PLACE_TYPE_OPTIONS, RADIUS_OPTIONS } from '../constants/places';
import { useCurrentLocation } from '../hooks/useCurrentLocation';

type RootStackParamList = {
	Deck: { location: string; types: string[]; radius: number };
};

export default function HomeScreen() {
	const navigation =
		useNavigation<NativeStackNavigationProp<RootStackParamList>>();
	const [location, setLocation] = useState('');
	const [selectedTypes, setSelectedTypes] = useState<string[]>(['restaurant']);
	const [radiusIndex, setRadiusIndex] = useState(1);
	const radius = RADIUS_OPTIONS[radiusIndex];
	const handleUseCurrentLocation = useCurrentLocation(setLocation);

	const handleTypeToggle = (value: string) => {
		setSelectedTypes((prev) =>
			prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value]
		);
	};

	const handleSearch = () => {
		if (location.trim()) {
			navigation.navigate('Deck', {
				location,
				types: selectedTypes.length ? selectedTypes : ['restaurant'],
				radius,
			});
		}
	};

	return (
		<Layout style={{ flex: 1, padding: 32, justifyContent: 'center' }}>
			<Text category='h6' style={{ marginBottom: 8 }}>
				Enter a location:
			</Text>
			<Input
				placeholder='e.g. Lot 1'
				value={location}
				onChangeText={setLocation}
				style={{ marginBottom: 8 }}
			/>
			<Button
				size='small'
				appearance='ghost'
				onPress={handleUseCurrentLocation}
				style={{ marginBottom: 16 }}
			>
				Use Current Location
			</Button>

			<Text style={{ marginBottom: 4 }}>Search Radius: {radius}m</Text>
			<Slider
				style={{ width: '100%', height: 40, marginBottom: 16 }}
				minimumValue={0}
				maximumValue={RADIUS_OPTIONS.length - 1}
				step={1}
				value={radiusIndex}
				onValueChange={setRadiusIndex}
				minimumTrackTintColor='#1EB1FC'
				maximumTrackTintColor='#d3d3d3'
				thumbTintColor='#1EB1FC'
			/>

			<Layout
				style={{
					flexDirection: 'row',
					flexWrap: 'wrap',
					justifyContent: 'center',
					marginBottom: 16,
				}}
			>
				{PLACE_TYPE_OPTIONS.map(({ label, value }) => (
					<Button
						key={value}
						size='tiny'
						appearance={selectedTypes.includes(value) ? 'filled' : 'outline'}
						status={selectedTypes.includes(value) ? 'primary' : 'basic'}
						style={{ margin: 4 }}
						onPress={() => handleTypeToggle(value)}
					>
						{label}
					</Button>
				))}
			</Layout>

			<Button onPress={handleSearch}>Search</Button>
		</Layout>
	);
}
