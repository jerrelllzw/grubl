import { BricolageGrotesque_800ExtraBold } from '@expo-google-fonts/bricolage-grotesque';
import {
	DMSans_400Regular,
	DMSans_500Medium,
	DMSans_600SemiBold,
	DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppStateProvider } from '../src/state/AppState';
import { ThemeProvider, useColors, useTheme } from '../src/theme/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

// Themed shell: status-bar icons + app background track the live theme.
function ThemedRoot({ children }: { children: React.ReactNode }) {
	const { scheme, colors } = useTheme();
	return (
		<>
			<StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
			<View style={{ flex: 1, backgroundColor: colors.cream }}>{children}</View>
		</>
	);
}

// Headerless stack — screens draw their own chrome, and back is the device's job
// (Android hardware/gesture back + iOS left-edge swipe pop these routes natively).
function RootNavigator() {
	const c = useColors();
	return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.cream } }} />;
}

export default function RootLayout() {
	const [fontsLoaded, fontError] = useFonts({
		BricolageGrotesque_800ExtraBold,
		DMSans_400Regular,
		DMSans_500Medium,
		DMSans_600SemiBold,
		DMSans_700Bold,
	});

	useEffect(() => {
		if (fontsLoaded || fontError) SplashScreen.hideAsync().catch(() => {});
	}, [fontsLoaded, fontError]);

	if (!fontsLoaded && !fontError) return null;

	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<SafeAreaProvider>
				<ThemeProvider>
					<ThemedRoot>
						<AppStateProvider>
							<RootNavigator />
						</AppStateProvider>
					</ThemedRoot>
				</ThemeProvider>
			</SafeAreaProvider>
		</GestureHandlerRootView>
	);
}
