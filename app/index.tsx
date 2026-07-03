import { ArchivoBlack_400Regular } from '@expo-google-fonts/archivo-black';
import {
	SpaceGrotesk_400Regular,
	SpaceGrotesk_500Medium,
	SpaceGrotesk_600SemiBold,
	SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DEFAULT_RADIUS } from '../src/constants/googlePlaces';
import {
	pickWinner,
	searchRestaurants,
	type Restaurant,
	type SearchQuery,
	type WinnerStrategy,
} from '../src/data/restaurants';
import IntroScreen from '../src/screens/IntroScreen';
import SearchScreen from '../src/screens/SearchScreen';
import { EmptyScreen, LoadingScreen } from '../src/screens/StatusScreen';
import SwipeScreen from '../src/screens/SwipeScreen';
import VerdictScreen from '../src/screens/VerdictScreen';
import { COLORS } from '../src/theme/tokens';

// Behavior knobs — the prototype exposed these as tweaks; keep them here so a
// settings surface (or the future API) can drive them later.
const WINNER_STRATEGY: WinnerStrategy = 'surprise me';
const SHOW_RATING = true;

SplashScreen.preventAutoHideAsync().catch(() => {});

type Screen = 'intro' | 'search' | 'swipe' | 'result';

export default function Index() {
	const [fontsLoaded, fontError] = useFonts({
		ArchivoBlack_400Regular,
		SpaceGrotesk_400Regular,
		SpaceGrotesk_500Medium,
		SpaceGrotesk_600SemiBold,
		SpaceGrotesk_700Bold,
	});

	const [screen, setScreen] = useState<Screen>('intro');
	const [radius, setRadius] = useState<string>(DEFAULT_RADIUS);
	const [query, setQuery] = useState<SearchQuery | null>(null);
	const [deck, setDeck] = useState<Restaurant[]>([]);
	const [loading, setLoading] = useState(false);
	const [winner, setWinner] = useState<Restaurant | null>(null);
	const [likesCount, setLikesCount] = useState(0);
	const [runId, setRunId] = useState(0); // remounts the deck for a fresh swipe run

	useEffect(() => {
		if (fontsLoaded || fontError) SplashScreen.hideAsync().catch(() => {});
	}, [fontsLoaded, fontError]);

	const handleStart = useCallback(() => setScreen('search'), []);

	const handleSearch = useCallback(async (q: SearchQuery) => {
		setQuery(q);
		setDeck([]);
		setLoading(true);
		setRunId((id) => id + 1);
		setScreen('swipe');
		try {
			setDeck(await searchRestaurants(q));
		} finally {
			setLoading(false);
		}
	}, []);

	const handleComplete = useCallback((likes: Restaurant[]) => {
		setWinner(pickWinner(likes, WINNER_STRATEGY));
		setLikesCount(likes.length);
		setScreen('result');
	}, []);

	const handleAgain = useCallback(() => {
		// Re-swipe the same deck without another API round-trip.
		setRunId((id) => id + 1);
		setWinner(null);
		setLikesCount(0);
		setScreen('swipe');
	}, []);

	const handleNewSearch = useCallback(() => setScreen('search'), []);

	if (!fontsLoaded && !fontError) return null;

	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<SafeAreaProvider>
				<StatusBar style="dark" />
				<View style={{ flex: 1, backgroundColor: COLORS.cream }}>
					{screen === 'intro' && (
						<IntroScreen radius={radius} onPickRadius={setRadius} onStart={handleStart} />
					)}

					{screen === 'search' && (
						<SearchScreen radius={radius} onBack={() => setScreen('intro')} onSearch={handleSearch} />
					)}

					{screen === 'swipe' &&
						(loading ? (
							<LoadingScreen location={query?.location ?? ''} />
						) : deck.length === 0 ? (
							<EmptyScreen onAdjust={handleNewSearch} />
						) : (
							<SwipeScreen key={runId} deck={deck} showRating={SHOW_RATING} onComplete={handleComplete} />
						))}

					{screen === 'result' && (
						<VerdictScreen
							winner={winner}
							likesCount={likesCount}
							showRating={SHOW_RATING}
							onAgain={handleAgain}
							onNewSearch={handleNewSearch}
						/>
					)}
				</View>
			</SafeAreaProvider>
		</GestureHandlerRootView>
	);
}
