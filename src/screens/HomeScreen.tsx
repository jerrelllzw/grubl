import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button, Input, Layout } from '@ui-kitten/components';
import React, { useState } from 'react';

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
			<Input
				style={{ marginBottom: 16 }}
				placeholder='Enter a location'
				value={location}
				onChangeText={setLocation}
			/>
			<Button
				style={{ marginTop: 8 }}
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
