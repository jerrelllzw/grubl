import React, { createContext, useContext, useMemo } from 'react';
import { COLORS, type Palette } from './tokens';

// App theming. Grubl ships a single light palette; screens read colours through
// `useColors()` and build styles with `useThemedStyles(makeStyles)`. The provider
// is kept as a thin seam so a future light/dark toggle can be reintroduced without
// touching every screen.

const ThemeContext = createContext<Palette>(COLORS);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
	return <ThemeContext.Provider value={COLORS}>{children}</ThemeContext.Provider>;
}

export function useColors(): Palette {
	return useContext(ThemeContext);
}

// Build a themed StyleSheet. Define the factory at module scope (stable identity)
// so this memoises correctly.
export function useThemedStyles<T>(factory: (c: Palette) => T): T {
	const colors = useColors();
	return useMemo(() => factory(colors), [colors, factory]);
}
