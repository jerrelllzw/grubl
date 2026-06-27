// Central design tokens for Grubl's custom (non-UI-Kitten) styling.
// Keep these in sync with app/theme.json, which feeds the same palette to UI Kitten.

export const COLORS = {
	// Brand
	brand: '#FF6B35',
	brandDark: '#E85221',
	brandSoft: '#FFF2EC',

	// Surfaces
	bg: '#FFF7F0',
	surface: '#FFFFFF',
	surfaceAlt: '#FBF1E9',
	hairline: '#F0E3D8',

	// Text
	ink: '#241B16',
	body: '#5E5048',
	muted: 'rgba(36, 27, 22, 0.45)',
	onBrand: '#FFFFFF',

	// Swipe semantics
	go: '#3D8BFF', // swipe right → open in Maps
	skip: '#FF4D5E', // swipe left → skip
	save: '#8B5CF6', // swipe down → shortlist

	// Functional
	success: '#1FBF7A',
	star: '#FFB400',
} as const;

// Signature warm gradients (tuples so expo-linear-gradient's typed `colors` is happy).
export const GRADIENTS = {
	brand: ['#FF8A4B', '#FF4D6D'] as const,
	go: ['#5AA0FF', '#2D6EF0'] as const,
	save: ['#A78BFA', '#7C4DFF'] as const,
	dusk: ['#FFB199', '#FF6B6B'] as const,
};

export const FONTS = {
	regular: 'Poppins_400Regular',
	medium: 'Poppins_500Medium',
	semibold: 'Poppins_600SemiBold',
	bold: 'Poppins_700Bold',
	extrabold: 'Poppins_800ExtraBold',
} as const;

export const RADIUS = {
	sm: 12,
	md: 18,
	lg: 24,
	xl: 32,
	pill: 999,
} as const;

export const SPACING = {
	xs: 6,
	sm: 10,
	md: 16,
	lg: 24,
	xl: 36,
} as const;

// Reusable elevation/shadow presets (iOS shadow + Android elevation).
export const SHADOWS = {
	card: {
		shadowColor: '#7A2E00',
		shadowOffset: { width: 0, height: 12 },
		shadowOpacity: 0.18,
		shadowRadius: 24,
		elevation: 10,
	},
	soft: {
		shadowColor: '#7A2E00',
		shadowOffset: { width: 0, height: 6 },
		shadowOpacity: 0.12,
		shadowRadius: 12,
		elevation: 5,
	},
	button: {
		shadowColor: '#FF4D6D',
		shadowOffset: { width: 0, height: 8 },
		shadowOpacity: 0.35,
		shadowRadius: 16,
		elevation: 8,
	},
} as const;
