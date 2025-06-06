import 'dotenv/config';

export default {
	expo: {
		name: 'grubl',
		slug: 'grubl',
		version: '1.0.0',
		orientation: 'portrait',
		icon: './assets/images/logo.png',
		scheme: 'grubl',
		userInterfaceStyle: 'automatic',
		newArchEnabled: true,
		ios: {
			supportsTablet: true,
		},
		android: {
			adaptiveIcon: {
				foregroundImage: './assets/images/logo.png',
				backgroundColor: '#ffffff',
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
				'expo-splash-screen',
				{
					image: './assets/images/logo.png',
					imageWidth: 200,
					resizeMode: 'contain',
					backgroundColor: '#ffffff',
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
