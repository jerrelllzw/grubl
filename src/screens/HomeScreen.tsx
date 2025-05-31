import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native';

type RootStackParamList = {
	Place: { location: string };
};

export default function HomeScreen() {
	const navigation =
		useNavigation<NativeStackNavigationProp<RootStackParamList>>();
	const [location, setLocation] = useState('');

	return (
		<View style={styles.container}>
			<TextInput
				style={styles.input}
				placeholder='Enter your location'
				value={location}
				onChangeText={setLocation}
			/>
			<TouchableOpacity
				style={styles.button}
				onPress={() => {
					if (location.trim()) {
						navigation.navigate('Place', { location });
					}
				}}
			>
				<Text style={styles.buttonText}>Search</Text>
			</TouchableOpacity>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 16,
		justifyContent: 'center',
	},
	input: {
		height: 50,
		fontSize: 18,
		borderWidth: 1,
		borderColor: '#ccc',
		borderRadius: 8,
		paddingHorizontal: 12,
		marginBottom: 16,
	},
	button: {
		backgroundColor: '#4CAF50',
		padding: 16,
		borderRadius: 8,
		alignItems: 'center',
	},
	buttonText: {
		color: '#fff',
		fontSize: 18,
		fontWeight: 'bold',
	},
});
