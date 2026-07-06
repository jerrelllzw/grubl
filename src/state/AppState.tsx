import { useRouter } from 'expo-router';
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { searchRestaurants, type Restaurant, type SearchQuery } from '../data/restaurants';

// The whole app is one linear flow (intro → search → swipe → result) but the
// screens share a lot of non-serializable state — the deck, the shortlist, the
// picked winner. Rather than thread that through route params, we hold it here
// and let each route read/write it. Navigation itself is real Expo Router stack
// motion, so the device back button and iOS edge-swipe "just work".

type EmptyReason = 'location' | 'no-results' | 'error';

type AppState = {
	query: SearchQuery | null;
	deck: Restaurant[];
	loading: boolean;
	emptyReason: EmptyReason;
	winner: Restaurant | null; // null → the user still has to choose
	shortlist: Restaurant[]; // the "yes" pile from swiping
	swipeIndex: number; // where the deck was left off, so we can resume
	runId: number; // bumped to remount the deck for a fresh swipe run

	start: () => void;
	submitSearch: (q: SearchQuery) => void;
	retry: () => void;
	complete: (maybes: Restaurant[], atIndex: number) => void;
	pick: (r: Restaurant) => void;
	reshuffle: () => void;
	newSearch: () => void;
};

const Ctx = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
	const router = useRouter();
	const [query, setQuery] = useState<SearchQuery | null>(null);
	const [deck, setDeck] = useState<Restaurant[]>([]);
	const [loading, setLoading] = useState(false);
	const [emptyReason, setEmptyReason] = useState<EmptyReason>('no-results');
	const [winner, setWinner] = useState<Restaurant | null>(null);
	const [shortlist, setShortlist] = useState<Restaurant[]>([]);
	const [swipeIndex, setSwipeIndex] = useState(0);
	const [runId, setRunId] = useState(0);

	// Fetch a deck for q. We fetch first (with the spinner shown on the calling
	// screen) and only navigate once results are in — there's no standalone
	// loading screen. `navigate` pushes the swipe route for a brand-new search;
	// retry re-runs in place on the swipe route that's already showing.
	const performFetch = useCallback(
		async (q: SearchQuery, navigate: boolean) => {
			setDeck([]);
			setShortlist([]); // a new deck starts with an empty shortlist…
			setSwipeIndex(0); // …swiped from the top
			setWinner(null);
			setLoading(true);
			try {
				const { deck: found, status } = await searchRestaurants(q);
				setDeck(found);
				setEmptyReason(status === 'error' ? 'error' : status === 'no-location' ? 'location' : 'no-results');
				setRunId((id) => id + 1);
				if (navigate) router.push('/swipe');
			} finally {
				setLoading(false);
			}
		},
		[router]
	);

	const start = useCallback(() => router.push('/search'), [router]);

	const submitSearch = useCallback(
		(q: SearchQuery) => {
			setQuery(q);
			performFetch(q, true);
		},
		[performFetch]
	);

	// Re-run the last search — the "TRY AGAIN" action on the connectivity-error
	// screen. Stays on the swipe route (no extra push) and just refetches.
	const retry = useCallback(() => {
		if (query) performFetch(query, false);
	}, [query, performFetch]);

	// Deck exhausted or "Shortlist" pressed — stash the shortlist and stopping index,
	// then push the verdict on top of the swipe screen so device back resumes it.
	const complete = useCallback(
		(maybes: Restaurant[], atIndex: number) => {
			setShortlist(maybes);
			setSwipeIndex(atIndex);
			setWinner(null);
			router.push('/result');
		},
		[router]
	);

	const pick = useCallback((r: Restaurant) => setWinner(r), []);

	// Drop a locked-in pick to return to the shortlist / spin-the-wheel view.
	const reshuffle = useCallback(() => setWinner(null), []);

	// Start over with new filters — pop straight back to the search route, keeping
	// the last query seeded so tweaking one filter doesn't mean re-entering all.
	const newSearch = useCallback(() => router.dismissTo('/search'), [router]);

	const value = useMemo<AppState>(
		() => ({
			query,
			deck,
			loading,
			emptyReason,
			winner,
			shortlist,
			swipeIndex,
			runId,
			start,
			submitSearch,
			retry,
			complete,
			pick,
			reshuffle,
			newSearch,
		}),
		[query, deck, loading, emptyReason, winner, shortlist, swipeIndex, runId, start, submitSearch, retry, complete, pick, reshuffle, newSearch]
	);

	return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppState() {
	const ctx = useContext(Ctx);
	if (!ctx) throw new Error('useAppState must be used within an AppStateProvider');
	return ctx;
}
