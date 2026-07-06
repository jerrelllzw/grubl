import AsyncStorage from '@react-native-async-storage/async-storage';

// First-run onboarding flag. This is the app's only persisted state — swiping,
// the shortlist and the theme are all in-memory by design (see theme.tsx), but the
// swipe tutorial must show exactly once *ever*, so it needs to survive cold starts.
//
// Storage failures are swallowed: a missing/broken read just means "not seen yet"
// (worst case the tutorial shows again — harmless), and a failed write is ignored
// rather than allowed to bubble up into the swipe flow.

// Versioned so a reworked tutorial can re-show for everyone by bumping the suffix.
const SEEN_KEY = 'grubl.swipeTutorialSeen.v1';

export async function hasSeenSwipeTutorial(): Promise<boolean> {
	try {
		return (await AsyncStorage.getItem(SEEN_KEY)) === '1';
	} catch {
		return false;
	}
}

export async function markSwipeTutorialSeen(): Promise<void> {
	try {
		await AsyncStorage.setItem(SEEN_KEY, '1');
	} catch {
		// Ignore — the tutorial simply shows again next launch.
	}
}
