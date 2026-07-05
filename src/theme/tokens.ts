// Design tokens for Grubl.
//
// Two palettes behind a runtime theme. Screens read colours through `useColors()`
// (see theme.tsx) and build styles with `useThemedStyles`, so flipping light↔dark
// re-themes every surface live. `COLORS` below stays exported as the LIGHT default
// for the rare non-React caller and for type/shape reference.
//
// Token roles (used consistently across screens):
//   cream/ground = background · paper/panel = surface   (these flip with the theme)
//   ink = text + hairline outlines · muted = secondary text
//   brass/tomato = PRIMARY accent (persimmon — CTAs, wordmark dot)
//   jade/green = yes · rose = no · yolk/amber = secondary (honey)
//   shadow = hard offset · line = divider · stone = quiet no
//   onAccent = text/icon on a SATURATED accent (persimmon/jade/berry) — light, both themes
//   onWarm   = text/icon on the LIGHT honey accent (yolk) — dark, both themes
// onAccent/onWarm deliberately do NOT flip: an accent is legible on the same ink
// regardless of the surrounding ground, so buttons never invert into mud.

export type Palette = {
	cream: string;
	paper: string;
	ground: string;
	panel: string;
	ink: string;
	muted: string;
	brass: string;
	brassDeep: string;
	tomato: string;
	yolk: string;
	rose: string;
	jade: string;
	green: string;
	amber: string;
	stone: string;
	shadow: string;
	line: string;
	onAccent: string;
	onWarm: string;
};

// Light — food-first. Warm cream, espresso ink, persimmon leads (the appetite
// colour); basil = yes, berry = no, honey = secondary.
const LIGHT: Palette = {
	cream: '#FBF4E6',
	paper: '#FFFDF8',
	ground: '#FBF4E6',
	panel: '#FFFDF8',
	ink: '#2A1C14',
	muted: '#8A7C6B',
	brass: '#D8481F', // persimmon — primary
	brassDeep: '#B23A16',
	tomato: '#D8481F', // alias → primary
	yolk: '#E9A23B', // secondary → honey/amber
	rose: '#C6455F', // berry — the "no" accent
	jade: '#2FA46B', // the "yes" accent
	green: '#2FA46B', // alias → jade
	amber: '#E9A23B',
	stone: '#B9AE9C', // quiet no / skip
	shadow: '#3A2A1E', // warm dark hard offset on cream
	line: 'rgba(42,28,20,0.12)',
	onAccent: '#FFF7EC', // warm white — text on persimmon/jade/berry
	onWarm: '#2A1C14', // espresso — text on honey
};

// Dark — food-first "night". Same brand, after dark: warm near-black ground, cream
// ink, persimmon still leads. Not a jewel/casino palette — the light theme's twin.
const DARK: Palette = {
	cream: '#181310', // ground — warm near-black espresso
	paper: '#241C16', // surface — lifted warm brown-black
	ground: '#181310',
	panel: '#241C16',
	ink: '#F3E9D9', // warm cream — text + hairline outlines
	muted: '#9E9080',
	brass: '#EA5A34', // persimmon — a touch brighter for the dark ground
	brassDeep: '#B23A16',
	tomato: '#EA5A34',
	yolk: '#E9A23B', // honey holds up on dark
	rose: '#E06B82', // berry — brighter
	jade: '#35B884', // basil — brighter
	green: '#35B884',
	amber: '#E9A23B',
	stone: '#6E6559',
	shadow: '#0B0705', // near-black hard offset reads on the dark ground
	line: 'rgba(243,233,217,0.14)',
	onAccent: '#FFF7EC', // same as light — accents sit at the same brightness
	onWarm: '#2A1C14',
};

export const PALETTES = { light: LIGHT, dark: DARK };
export type ThemeName = keyof typeof PALETTES;

// Active LIGHT default for non-React callers / shape reference. In components,
// prefer `useColors()` so the value tracks the live theme.
export const COLORS: Palette = PALETTES.light;

// Google Fonts loaded via expo-font. Bricolage Grotesque — a warm, slightly quirky
// grotesque — carries the display voice (wordmark, headlines, stamps): its heft sits
// right on the neo-brutalist hard shadows. DM Sans handles UI/body text across
// weights: clean but not cold.
export const FONTS = {
	display: 'BricolageGrotesque_800ExtraBold', // single-weight display face — brutalist poster
	regular: 'DMSans_400Regular',
	medium: 'DMSans_500Medium',
	semibold: 'DMSans_600SemiBold',
	bold: 'DMSans_700Bold',
} as const;

export const RADII = {
	card: 24,
	sticker: 16,
	cta: 18,
	pill: 999,
	chip: 999,
} as const;

export const BORDER = 1.5; // refined hairline
