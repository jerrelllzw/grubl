import * as eva from '@eva-design/eva';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ApplicationProvider } from '@ui-kitten/components';
import React from 'react';
import DeckScreen from '../src/screens/DeckScreen';
import HomeScreen from '../src/screens/HomeScreen';

const Stack = createNativeStackNavigator();

export default function index() {
	return (
		<ApplicationProvider {...eva} theme={eva.light}>
			<Stack.Navigator initialRouteName='Home'>
				<Stack.Screen name='Home' component={HomeScreen} />
				<Stack.Screen name='Deck' component={DeckScreen} />
			</Stack.Navigator>
		</ApplicationProvider>
	);
}
