import HomeScreen from '@/src/screens/HomeScreen';
import * as eva from '@eva-design/eva';
import {
	Poppins_400Regular,
	Poppins_500Medium,
	Poppins_600SemiBold,
	Poppins_700Bold,
	Poppins_800ExtraBold,
	useFonts,
} from '@expo-google-fonts/poppins';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ApplicationProvider } from '@ui-kitten/components';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import SearchScreen from '../src/screens/SearchScreen';
import SwipeScreen from '../src/screens/SwipeScreen';
import { COLORS } from '../src/theme/tokens';
import { default as theme } from './theme.json';

SplashScreen.preventAutoHideAsync().catch(() => {});

const Stack = createNativeStackNavigator();

// Apply Poppins across all UI Kitten components (headings, inputs, selects, etc.).
const fontMapping = {
	components: {},
	strict: {
		'text-font-family': 'Poppins_400Regular',
		'text-heading-1-font-family': 'Poppins_800ExtraBold',
		'text-heading-2-font-family': 'Poppins_800ExtraBold',
		'text-heading-3-font-family': 'Poppins_700Bold',
		'text-heading-4-font-family': 'Poppins_700Bold',
		'text-heading-5-font-family': 'Poppins_700Bold',
		'text-heading-6-font-family': 'Poppins_700Bold',
		'text-subtitle-1-font-family': 'Poppins_600SemiBold',
		'text-subtitle-2-font-family': 'Poppins_600SemiBold',
		'text-paragraph-1-font-family': 'Poppins_400Regular',
		'text-paragraph-2-font-family': 'Poppins_400Regular',
		'text-caption-1-font-family': 'Poppins_500Medium',
		'text-caption-2-font-family': 'Poppins_500Medium',
		'text-label-font-family': 'Poppins_600SemiBold',
	},
};

export default function Index() {
	const [fontsLoaded, fontError] = useFonts({
		Poppins_400Regular,
		Poppins_500Medium,
		Poppins_600SemiBold,
		Poppins_700Bold,
		Poppins_800ExtraBold,
	});

	useEffect(() => {
		if (fontsLoaded || fontError) {
			SplashScreen.hideAsync().catch(() => {});
		}
	}, [fontsLoaded, fontError]);

	if (!fontsLoaded && !fontError) {
		return null;
	}

	return (
		<>
			<StatusBar style='dark' />
			<ApplicationProvider {...eva} theme={{ ...eva.light, ...theme }} customMapping={fontMapping}>
				<Stack.Navigator
					initialRouteName='Home'
					screenOptions={{
						headerShown: false,
						contentStyle: { backgroundColor: COLORS.bg },
						animation: 'slide_from_right',
					}}
				>
					<Stack.Screen name='Home' component={HomeScreen} />
					<Stack.Screen name='Search' component={SearchScreen} />
					<Stack.Screen name='Swipe' component={SwipeScreen} />
				</Stack.Navigator>
			</ApplicationProvider>
		</>
	);
}
