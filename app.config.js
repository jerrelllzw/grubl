import 'dotenv/config';

export default {
	expo: {
		name: 'Grubl',
		slug: 'grubl',
		version: '1.0.0',
		orientation: 'portrait',
		icon: './assets/images/icon.png',
		scheme: 'grubl',
		userInterfaceStyle: 'light',
		newArchEnabled: true,
		ios: {
			supportsTablet: true,
		},
		android: {
			adaptiveIcon: {
				foregroundImage: './assets/images/adaptive-icon.png',
				backgroundColor: '#FBF4E6',
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
			'expo-font',
			[
				'expo-location',
				{
					locationWhenInUsePermission: 'grubl uses your location to find restaurants near you.',
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
