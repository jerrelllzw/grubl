import React from 'react';
import { EmptyScreen, LoadingScreen } from '../src/screens/StatusScreen';
import SwipeScreen from '../src/screens/SwipeScreen';
import { useAppState } from '../src/state/AppState';

export default function SwipeRoute() {
	const { deck, loading, emptyReason, query, shortlist, swipeIndex, runId, complete, retry, newSearch } = useAppState();

	if (loading) return <LoadingScreen location={query?.location ?? ''} />;
	if (deck.length === 0) return <EmptyScreen reason={emptyReason} onAdjust={newSearch} onRetry={retry} />;

	return (
		<SwipeScreen
			key={runId}
			deck={deck}
			initialIndex={swipeIndex}
			initialShortlist={shortlist}
			onComplete={complete}
		/>
	);
}
