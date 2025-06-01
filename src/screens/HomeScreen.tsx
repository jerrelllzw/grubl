import Slider from '@react-native-community/slider';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button, Input, Layout, Text } from '@ui-kitten/components';
import React, { useState } from 'react';

type RootStackParamList = {
	Deck: { location: string; types: string[]; radius: number };
};

const PLACE_TYPE_OPTIONS = [
	{ label: 'Restaurant', value: 'restaurant' },
	{ label: 'Cafe', value: 'cafe' },
	{ label: 'Coffee Shop', value: 'coffee_shop' },
	{ label: 'Fast Food', value: 'fast_food_restaurant' },
	{ label: 'Bakery', value: 'bakery' },
	{ label: 'Bar', value: 'bar' },
	{ label: 'Food Court', value: 'food_court' },
	{ label: 'Takeaway', value: 'meal_takeaway' },
];
const RADIUS_OPTIONS = [200, 400, 800, 1600];

export default function HomeScreen() {
	const navigation =
		useNavigation<NativeStackNavigationProp<RootStackParamList>>();
	const [location, setLocation] = useState('');
	const [selectedTypes, setSelectedTypes] = useState<string[]>(['restaurant']);
	const [radiusIndex, setRadiusIndex] = useState(1);

	const radius = RADIUS_OPTIONS[radiusIndex];

	return (
		<Layout
			style={{
				flex: 1,
				padding: 32,
				justifyContent: 'center',
			}}
		>
			<Text
				category='h6'
				style={{
					marginBottom: 8,
				}}
			>
				Enter a location:
			</Text>
			<Input
				placeholder='e.g. Lot 1'
				value={location}
				onChangeText={setLocation}
				style={{ marginBottom: 16 }}
			/>

			<Text style={{ marginBottom: 4 }}>Search Radius: {radius}m</Text>
			<Slider
				style={{ width: '100%', height: 40, marginBottom: 16 }}
				minimumValue={0}
				maximumValue={3}
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
						onPress={() => {
							setSelectedTypes((prev) =>
								prev.includes(value)
									? prev.filter((t) => t !== value)
									: [...prev, value]
							);
						}}
					>
						{label}
					</Button>
				))}
			</Layout>

			<Button
				onPress={() => {
					if (location.trim()) {
						navigation.navigate('Deck', {
							location,
							types: selectedTypes.length ? selectedTypes : ['restaurant'],
							radius,
						});
					}
				}}
			>
				Search
			</Button>
		</Layout>
	);
}
