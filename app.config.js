import 'dotenv/config';

export default {
	expo: {
		name: 'Grubl',
		slug: 'grubl',
		version: '1.0.0',
		orientation: 'portrait',
		icon: './assets/images/icon.png',
		scheme: 'grubl',
		userInterfaceStyle: 'automatic',
		newArchEnabled: true,
		ios: {
			supportsTablet: true,
		},
		android: {
			adaptiveIcon: {
				foregroundImage: './assets/images/adaptive-icon.png',
				backgroundColor: '#D8481F',
			},
			edgeToEdgeEnabled: true,
			package: 'com.lerej.grubl',
		},
		web: {
			bundler: 'metro',
			output: 'static',
			favicon: './assets/images/favicon.png',
		},
		plugins: [
			'expo-router',
			[
				'expo-font',
				{
					// Embed fonts natively at build time so they exist from app launch.
					// Runtime `useFonts` alone is unreliable in a standalone/EAS build
					// (Expo Go pre-bundles these, which is why it only breaks on device):
					// if loading fails the app renders with system-font fallback + tofu
					// icons. Embedding covers BOTH the display/UI fonts and the
					// vector-icon glyph fonts (Ionicons / MaterialIcons).
					fonts: [
						'./assets/fonts/BricolageGrotesque_800ExtraBold.ttf',
						'./assets/fonts/DMSans_400Regular.ttf',
						'./assets/fonts/DMSans_500Medium.ttf',
						'./assets/fonts/DMSans_600SemiBold.ttf',
						'./assets/fonts/DMSans_700Bold.ttf',
						'./assets/fonts/Ionicons.ttf',
						'./assets/fonts/MaterialIcons.ttf',
					],
				},
			],
			[
				'expo-location',
				{
					locationWhenInUsePermission: 'Grubl uses your location to find restaurants near you.',
				},
			],
			[
				'expo-splash-screen',
				{
					image: './assets/images/splash-icon.png',
					imageWidth: 220,
					resizeMode: 'contain',
					backgroundColor: '#FBF4E6',
				},
			],
		],
		experiments: {
			typedRoutes: true,
		},
		extra: {
			router: {},
			eas: {
				projectId: '791542a5-038f-48d1-88b4-8112baf3be8b',
			},
		},
	},
};
