import Entypo from '@expo/vector-icons/Entypo';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
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
	const [selectedPlaceTypes, setSelectedPlaceTypes] = useState<string[]>(Object.keys(PLACE_TYPE_OPTIONS));
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

	const handleOpenNowToggle = () => {
		setOpenNow((prev) => !prev);
	};

	const handleSearch = () => {
		if (location.trim()) {
			navigation.navigate('Swipe', {
				location,
				radius,
				placeTypes: selectedPlaceTypes,
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
							style={styles.locationButton}
						>
							{isLocating
								? () => <Entypo name='dots-three-horizontal' style={styles.locationButton} />
								: () => <FontAwesome6 name='location-crosshairs' style={styles.locationButton} />}
						</Button>
					</Layout>
				</Layout>

				<Layout>
					<Text category='h6' style={styles.header}>
						Place Types
					</Text>
					<Select
						multiSelect
						placeholder='Select place types'
						value={selectedPlaceTypes.map((key) => PLACE_TYPE_OPTIONS[key]).join(', ')}
						selectedIndex={selectedPlaceTypes.map((key) => new IndexPath(Object.keys(PLACE_TYPE_OPTIONS).indexOf(key)))}
						onSelect={(index) => {
							if (Array.isArray(index)) {
								const selectedKeys = index
									.map((i) => Object.keys(PLACE_TYPE_OPTIONS)[i.row])
									.sort(
										(a, b) => Object.keys(PLACE_TYPE_OPTIONS).indexOf(a) - Object.keys(PLACE_TYPE_OPTIONS).indexOf(b)
									);
								setSelectedPlaceTypes(selectedKeys.length ? selectedKeys : selectedPlaceTypes);
							}
						}}
					>
						{Object.keys(PLACE_TYPE_OPTIONS).map((key) => (
							<SelectItem key={key} title={PLACE_TYPE_OPTIONS[key]} />
						))}
					</Select>
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
						Price Level
					</Text>
					<Select
						multiSelect
						placeholder='Select price levels'
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
	locationButton: {
		borderColor: '#16172b',
		backgroundColor: '#1c2238',
		color: 'white',
		fontSize: 20,
	},
});
