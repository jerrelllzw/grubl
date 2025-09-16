import * as eva from '@eva-design/eva';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ApplicationProvider } from '@ui-kitten/components';
import React from 'react';
import SearchScreen from '../src/screens/SearchScreen';
import SwipeScreen from '../src/screens/SwipeScreen';
import { default as theme } from './theme.json';

const Stack = createNativeStackNavigator();

export default function index() {
	return (
		<ApplicationProvider {...eva} theme={{ ...eva.light, ...theme }}>
			<Stack.Navigator initialRouteName='Search' screenOptions={{ headerShown: false }}>
				<Stack.Screen name='Search' component={SearchScreen} />
				<Stack.Screen name='Swipe' component={SwipeScreen} />
			</Stack.Navigator>
		</ApplicationProvider>
	);
}
