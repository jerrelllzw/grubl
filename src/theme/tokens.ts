// Design tokens for Grubl.
//
// A single light palette. Screens read colours through `useColors()` (see
// theme.tsx) and build styles with `useThemedStyles(makeStyles)`.
//
// Token roles (used consistently across screens):
//   cream/ground = background · paper = surface
//   ink = text + hairline outlines · muted = secondary text
//   brass/tomato = PRIMARY accent (persimmon — CTAs, wordmark dot)
//   jade/green = yes · rose = no
//   shadow = hard offset · line = divider
//   onAccent = text/icon on a SATURATED accent (persimmon/jade/berry)

export type Palette = {
	cream: string;
	paper: string;
	ground: string;
	ink: string;
	muted: string;
	brass: string;
	brassDeep: string;
	tomato: string;
	rose: string;
	jade: string;
	green: string;
	shadow: string;
	line: string;
	onAccent: string;
};

// Food-first. Warm cream, espresso ink, persimmon leads (the appetite colour);
// basil = yes, berry = no, honey = secondary.
export const COLORS: Palette = {
	cream: '#FBF4E6',
	paper: '#FFFDF8',
	ground: '#FBF4E6',
	ink: '#2A1C14',
	muted: '#8A7C6B',
	brass: '#D8481F', // persimmon — primary
	brassDeep: '#B23A16',
	tomato: '#D8481F', // alias → primary
	rose: '#C6455F', // berry — the "no" accent
	jade: '#2FA46B', // the "yes" accent
	green: '#2FA46B', // alias → jade
	shadow: '#3A2A1E', // warm dark hard offset on cream
	line: 'rgba(42,28,20,0.12)',
	onAccent: '#FFF7EC', // warm white — text on persimmon/jade/berry
};

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
