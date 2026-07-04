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
import { searchRestaurants, type Restaurant, type SearchQuery } from '../src/data/restaurants';
import IntroScreen from '../src/screens/IntroScreen';
import SearchScreen from '../src/screens/SearchScreen';
import { EmptyScreen, LoadingScreen } from '../src/screens/StatusScreen';
import SwipeScreen from '../src/screens/SwipeScreen';
import VerdictScreen from '../src/screens/VerdictScreen';
import { COLORS } from '../src/theme/tokens';

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
	const [query, setQuery] = useState<SearchQuery | null>(null);
	const [deck, setDeck] = useState<Restaurant[]>([]);
	const [loading, setLoading] = useState(false);
	const [emptyReason, setEmptyReason] = useState<'location' | 'no-results' | 'error'>('no-results');
	const [winner, setWinner] = useState<Restaurant | null>(null); // null → let the user choose
	const [shortlist, setShortlist] = useState<Restaurant[]>([]); // the "yum" pile (swipe right)
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
			const { deck: found, status } = await searchRestaurants(q);
			setDeck(found);
			setEmptyReason(status === 'error' ? 'error' : status === 'no-location' ? 'location' : 'no-results');
		} finally {
			setLoading(false);
		}
	}, []);

	// Re-run the last search — the "TRY AGAIN" action on the connectivity-error screen.
	const handleRetry = useCallback(() => {
		if (query) handleSearch(query);
	}, [query, handleSearch]);

	// Deck exhausted or "Done" pressed — no pick yet, so the verdict screen lets
	// the user spin the wheel or tap a place from their shortlist.
	const handleComplete = useCallback((maybes: Restaurant[]) => {
		setShortlist(maybes);
		setWinner(null);
		setScreen('result');
	}, []);

	// Promote a specific shortlisted place to the pick (tapped from the shortlist).
	const handlePick = useCallback((r: Restaurant) => setWinner(r), []);

	const handleAgain = useCallback(() => {
		// Re-swipe the same deck without another API round-trip.
		setRunId((id) => id + 1);
		setWinner(null);
		setShortlist([]);
		setScreen('swipe');
	}, []);

	const handleNewSearch = useCallback(() => setScreen('search'), []);

	if (!fontsLoaded && !fontError) return null;

	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<SafeAreaProvider>
				<StatusBar style="dark" />
				<View style={{ flex: 1, backgroundColor: COLORS.cream }}>
					{screen === 'intro' && <IntroScreen onStart={handleStart} />}

					{screen === 'search' && (
						<SearchScreen initial={query} onBack={() => setScreen('intro')} onSearch={handleSearch} />
					)}

					{screen === 'swipe' &&
						(loading ? (
							<LoadingScreen location={query?.location ?? ''} />
						) : deck.length === 0 ? (
							<EmptyScreen reason={emptyReason} onAdjust={handleNewSearch} onRetry={handleRetry} />
						) : (
							<SwipeScreen
								key={runId}
								deck={deck}
								onBack={handleNewSearch}
								onComplete={handleComplete}
							/>
						))}

					{screen === 'result' && (
						<VerdictScreen
							winner={winner}
							shortlist={shortlist}
							deck={deck}
							onPick={handlePick}
							onAgain={handleAgain}
							onNewSearch={handleNewSearch}
						/>
					)}
				</View>
			</SafeAreaProvider>
		</GestureHandlerRootView>
	);
}
