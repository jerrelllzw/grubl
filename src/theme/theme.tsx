import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { PALETTES, type Palette, type ThemeName } from './tokens';

// Runtime theming. The app follows the OS colour scheme until the user flips the
// in-app toggle, which pins an explicit override for the session. Screens read
// `useColors()` and build styles with `useThemedStyles(makeStyles)` so a flip
// re-themes every surface live (StyleSheet objects are otherwise frozen at import).
//
// Note: the override is in-memory (no storage dep), so a cold start re-follows the
// system preference — deliberate for now; wire persistence in if we add a KV store.

type ThemeContextValue = {
	scheme: ThemeName; // resolved: what's actually on screen
	colors: Palette;
	isFollowingSystem: boolean; // true until the user overrides
	toggle: () => void; // flip to the opposite scheme
	setScheme: (name: ThemeName) => void;
	followSystem: () => void; // drop the override, track the OS again
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
	const system = useColorScheme(); // 'light' | 'dark' | null
	const [override, setOverride] = useState<ThemeName | null>(null);

	const scheme: ThemeName = override ?? (system === 'dark' ? 'dark' : 'light');

	const toggle = useCallback(() => {
		setOverride(scheme === 'dark' ? 'light' : 'dark');
	}, [scheme]);

	const value = useMemo<ThemeContextValue>(
		() => ({
			scheme,
			colors: PALETTES[scheme],
			isFollowingSystem: override === null,
			toggle,
			setScheme: setOverride,
			followSystem: () => setOverride(null),
		}),
		[scheme, override, toggle]
	);

	return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
	const ctx = useContext(ThemeContext);
	if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
	return ctx;
}

export function useColors(): Palette {
	return useTheme().colors;
}

// Build a themed StyleSheet that recomputes only when the palette changes. Define
// the factory at module scope (stable identity) so this memoises correctly.
export function useThemedStyles<T>(factory: (c: Palette) => T): T {
	const colors = useColors();
	return useMemo(() => factory(colors), [colors, factory]);
}
