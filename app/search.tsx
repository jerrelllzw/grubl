import React from 'react';
import SearchScreen from '../src/screens/SearchScreen';
import { useAppState } from '../src/state/AppState';

export default function SearchRoute() {
	const { query, getDraft, setDraft, submitSearch, loading } = useAppState();
	// Prefer the saved draft (last edits) over the last submitted query, so leaving
	// and returning restores the in-progress form. Read once at mount.
	const initial = getDraft() ?? query;
	return <SearchScreen initial={initial} onSearch={submitSearch} onDraftChange={setDraft} loading={loading} />;
}
