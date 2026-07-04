// Design tokens for Grubl.
//
// Two palettes behind one active export. Screens import { COLORS } and never
// hardcode, so switching the default (or adding a runtime toggle later) is a
// one-line change. LIGHT is the shipping default — a warm, food-first theme;
// DARK is the jewel "night mode", kept in sync for when we wire it up.
//
// Token roles (used consistently across screens):
//   cream/ground = background · paper/panel = surface
//   ink = text + hairline outlines · muted = secondary text
//   brass/tomato = PRIMARY accent (CTAs, wordmark dot)
//   jade/green = yes / YUM · stone = quiet no / skip
//   yolk = secondary accent · shadow = hard offset · line = divider
//   Text that sits *on* an accent uses `cream` (so it flips with the theme).

type Palette = {
	cream: string;
	paper: string;
	ground: string;
	panel: string;
	ink: string;
	muted: string;
	brass: string;
	brassDeep: string;
	tomato: string;
	amethyst: string;
	yolk: string;
	rose: string;
	jade: string;
	green: string;
	amber: string;
	teal: string;
	stone: string;
	shadow: string;
	line: string;
};

// Light — food-first. Warm cream, espresso ink, persimmon leads (the appetite
// colour); basil = yes, stone = quiet no, honey/amber = secondary.
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
	amethyst: '#8A6FB8',
	yolk: '#E9A23B', // secondary → honey/amber
	rose: '#C6455F', // berry — no / NAH
	jade: '#2FA46B', // yes / yum
	green: '#2FA46B', // alias → jade
	amber: '#E9A23B',
	teal: '#4194AE',
	stone: '#B9AE9C', // quiet no / skip
	shadow: '#3A2A1E', // warm dark hard offset on cream
	line: 'rgba(42,28,20,0.12)',
};

// Dark — jewel "night mode" (Spin-to-Win, grown up). Kept for a later toggle.
const DARK: Palette = {
	cream: '#26141A',
	paper: '#33191F',
	ground: '#26141A',
	panel: '#33191F',
	ink: '#F3ECE0',
	muted: '#A99DAE',
	brass: '#CBA75A',
	brassDeep: '#A5822F',
	tomato: '#CBA75A',
	amethyst: '#8B6FB8',
	yolk: '#8B6FB8',
	rose: '#DB7391',
	jade: '#46AE8F',
	green: '#46AE8F',
	amber: '#E19A54',
	teal: '#4194AE',
	stone: '#8A7E8C',
	shadow: '#160A0E',
	line: '#3E2A30',
};

export const PALETTES = { light: LIGHT, dark: DARK };

// Active theme. Flip to PALETTES.dark (or thread a provider) to switch.
export const COLORS: Palette = PALETTES.light;

// Google Fonts loaded via expo-font.
export const FONTS = {
	display: 'ArchivoBlack_400Regular', // single-weight display face
	regular: 'SpaceGrotesk_400Regular',
	medium: 'SpaceGrotesk_500Medium',
	semibold: 'SpaceGrotesk_600SemiBold',
	bold: 'SpaceGrotesk_700Bold',
} as const;

export const RADII = {
	card: 24,
	sticker: 16,
	cta: 18,
	pill: 999,
	chip: 999,
} as const;

export const BORDER = 1.5; // refined hairline
