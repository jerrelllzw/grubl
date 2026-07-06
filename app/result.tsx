import React from 'react';
import VerdictScreen from '../src/screens/VerdictScreen';
import { useAppState } from '../src/state/AppState';

export default function ResultRoute() {
	const { winner, shortlist, deck, swipeIndex, pick, reshuffle, newSearch } = useAppState();
	return (
		<VerdictScreen
			winner={winner}
			shortlist={shortlist}
			deck={deck}
			swipeIndex={swipeIndex}
			onPick={pick}
			onReshuffle={reshuffle}
			onNewSearch={newSearch}
		/>
	);
}
