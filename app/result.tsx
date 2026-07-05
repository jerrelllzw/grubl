import React from 'react';
import VerdictScreen from '../src/screens/VerdictScreen';
import { useAppState } from '../src/state/AppState';

export default function ResultRoute() {
	const { winner, shortlist, deck, pick, reshuffle, again, newSearch } = useAppState();
	return (
		<VerdictScreen
			winner={winner}
			shortlist={shortlist}
			deck={deck}
			onPick={pick}
			onReshuffle={reshuffle}
			onAgain={again}
			onNewSearch={newSearch}
		/>
	);
}
