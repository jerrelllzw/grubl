import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import HomeScreen from '../src/screens/HomeScreen';
import PlaceScreen from '../src/screens/PlaceScreen';

const Stack = createNativeStackNavigator();

export default function index() {
	return (
		<Stack.Navigator initialRouteName='Home'>
			<Stack.Screen name='Home' component={HomeScreen} />
			<Stack.Screen name='Place' component={PlaceScreen} />
		</Stack.Navigator>
	);
}
