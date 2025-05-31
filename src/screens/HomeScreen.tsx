import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button, Input, Layout, Text } from '@ui-kitten/components';
import React, { useState } from 'react';
import { View } from 'react-native';

type RootStackParamList = {
	Deck: { location: string };
};

export default function HomeScreen() {
	const navigation =
		useNavigation<NativeStackNavigationProp<RootStackParamList>>();
	const [location, setLocation] = useState('');

	return (
		<Layout
			style={{
				flex: 1,
				padding: 16,
				justifyContent: 'center',
			}}
		>
			<View style={{ marginBottom: 16, width: '80%', alignSelf: 'center' }}>
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
				/>
			</View>
			<Button
				style={{ width: '80%', alignSelf: 'center' }}
				onPress={() => {
					if (location.trim()) {
						navigation.navigate('Deck', { location });
					}
				}}
			>
				Search
			</Button>
		</Layout>
	);
}
