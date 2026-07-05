import React from 'react';
import IntroScreen from '../src/screens/IntroScreen';
import { useAppState } from '../src/state/AppState';

export default function IntroRoute() {
	const { start } = useAppState();
	return <IntroScreen onStart={start} />;
}
