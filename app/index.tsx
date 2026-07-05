import { BricolageGrotesque_800ExtraBold } from '@expo-google-fonts/bricolage-grotesque';
import {
	DMSans_400Regular,
	DMSans_500Medium,
	DMSans_600SemiBold,
	DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
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
import { ThemeProvider, useTheme } from '../src/theme/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

type Screen = 'intro' | 'search' | 'swipe' | 'result';

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

export default function Index() {
	const [fontsLoaded, fontError] = useFonts({
		BricolageGrotesque_800ExtraBold,
		DMSans_400Regular,
		DMSans_500Medium,
		DMSans_600SemiBold,
		DMSans_700Bold,
	});

	const [screen, setScreen] = useState<Screen>('intro');
	const [query, setQuery] = useState<SearchQuery | null>(null);
	const [deck, setDeck] = useState<Restaurant[]>([]);
	const [loading, setLoading] = useState(false);
	const [emptyReason, setEmptyReason] = useState<'location' | 'no-results' | 'error'>('no-results');
	const [winner, setWinner] = useState<Restaurant | null>(null); // null → let the user choose
	const [shortlist, setShortlist] = useState<Restaurant[]>([]); // the "yum" pile (swipe right)
	const [swipeIndex, setSwipeIndex] = useState(0); // where the deck was left off, so we can resume
	const [runId, setRunId] = useState(0); // remounts the deck for a fresh swipe run

	useEffect(() => {
		if (fontsLoaded || fontError) SplashScreen.hideAsync().catch(() => {});
	}, [fontsLoaded, fontError]);

	const handleStart = useCallback(() => setScreen('search'), []);

	const handleSearch = useCallback(async (q: SearchQuery) => {
		setQuery(q);
		setDeck([]);
		setShortlist([]); // a new deck starts with an empty shortlist…
		setSwipeIndex(0); // …swiped from the top
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
	// the user spin the wheel or tap a place from their shortlist. We stash the
	// stopping index so "back" from the verdict can resume the deck in place.
	const handleComplete = useCallback((maybes: Restaurant[], atIndex: number) => {
		setShortlist(maybes);
		setSwipeIndex(atIndex);
		setWinner(null);
		setScreen('result');
	}, []);

	// Promote a specific shortlisted place to the pick (tapped from the shortlist).
	const handlePick = useCallback((r: Restaurant) => setWinner(r), []);

	// Back from the verdict → resume swiping right where they left off, shortlist
	// intact (unlike "Swipe again", which deliberately restarts the deck).
	const handleResume = useCallback(() => {
		setWinner(null);
		setScreen('swipe');
	}, []);

	// Drop a locked-in pick to return to the shortlist / spin-the-wheel view.
	const handleReshuffle = useCallback(() => setWinner(null), []);

	const handleAgain = useCallback(() => {
		// Re-swipe the same deck without another API round-trip.
		setRunId((id) => id + 1);
		setWinner(null);
		setShortlist([]);
		setSwipeIndex(0);
		setScreen('swipe');
	}, []);

	const handleNewSearch = useCallback(() => setScreen('search'), []);

	if (!fontsLoaded && !fontError) return null;

	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<SafeAreaProvider>
				<ThemeProvider>
					<ThemedRoot>
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
								initialIndex={swipeIndex}
								initialShortlist={shortlist}
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
							onBack={swipeIndex < deck.length ? handleResume : handleNewSearch}
							onReshuffle={handleReshuffle}
							onAgain={handleAgain}
							onNewSearch={handleNewSearch}
						/>
					)}
					</ThemedRoot>
				</ThemeProvider>
			</SafeAreaProvider>
		</GestureHandlerRootView>
	);
}
