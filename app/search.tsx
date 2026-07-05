import React from 'react';
import SearchScreen from '../src/screens/SearchScreen';
import { useAppState } from '../src/state/AppState';

export default function SearchRoute() {
	const { query, submitSearch, loading } = useAppState();
	return <SearchScreen initial={query} onSearch={submitSearch} loading={loading} />;
}
