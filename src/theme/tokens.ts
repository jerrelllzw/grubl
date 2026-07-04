// Design tokens for grubl — the "playful & bold" direction (option 3a).
// Chunky type, 3px ink borders, hard offset shadows (no blur), sticker panels.

export const COLORS = {
	cream: '#FFF7E0', // app background
	paper: '#FFFDF6', // card / panel surface
	ink: '#1A1A1A', // text, borders, hard shadows
	tomato: '#FF5A3C', // primary accent (brand, YUM button, NAH stamp)
	yolk: '#FFD43B', // secondary accent (Swipe Again button)
	green: '#2FA84F', // YUM stamp
	muted: '#5A5347', // secondary text
} as const;

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

export const BORDER = 3; // signature 3px ink border
