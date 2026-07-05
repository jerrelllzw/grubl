import React from 'react';
import { EmptyScreen } from '../src/screens/StatusScreen';
import SwipeScreen from '../src/screens/SwipeScreen';
import { useAppState } from '../src/state/AppState';

export default function SwipeRoute() {
	const { deck, loading, emptyReason, shortlist, swipeIndex, runId, complete, retry, newSearch } = useAppState();

	if (deck.length === 0) return <EmptyScreen reason={emptyReason} loading={loading} onAdjust={newSearch} onRetry={retry} />;

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
