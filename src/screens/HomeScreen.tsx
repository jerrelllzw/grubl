import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import GradientButton from '../components/GradientButton';
import { COLORS, FONTS, GRADIENTS, SHADOWS } from '../theme/tokens';

type RootStackParamList = {
	Search: undefined;
};

// Playful, low-opacity food emojis scattered behind the content.
const DECOR = [
	{ emoji: '🍕', top: 70, left: 28, size: 46, rotate: '-18deg' },
	{ emoji: '🌮', top: 120, right: 24, size: 40, rotate: '14deg' },
	{ emoji: '🍣', top: 300, left: 14, size: 38, rotate: '10deg' },
	{ emoji: '🍩', top: 360, right: 30, size: 44, rotate: '-12deg' },
	{ emoji: '🍜', bottom: 220, left: 36, size: 40, rotate: '16deg' },
	{ emoji: '🍦', bottom: 180, right: 28, size: 38, rotate: '-8deg' },
];

export default function HomeScreen() {
	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

	return (
		<View style={styles.container}>
			<View style={StyleSheet.absoluteFill} pointerEvents='none'>
				{DECOR.map((d, i) => (
					<Text
						key={i}
						style={[
							styles.decor,
							{
								fontSize: d.size,
								top: d.top,
								bottom: d.bottom,
								left: d.left,
								right: d.right,
								transform: [{ rotate: d.rotate }],
							},
						]}
					>
						{d.emoji}
					</Text>
				))}
			</View>

			<SafeAreaView style={styles.safe}>
				<View style={styles.hero}>
					<LinearGradient
						colors={GRADIENTS.brand}
						start={{ x: 0, y: 0 }}
						end={{ x: 1, y: 1 }}
						style={[styles.logoRing, SHADOWS.card]}
					>
						<View style={styles.logoInner}>
							<Image source={require('../assets/images/hero.png')} style={styles.logo} />
						</View>
					</LinearGradient>

					<Text style={styles.kicker}>HUNGRY?</Text>
					<Text style={styles.title}>Grubl</Text>
					<Text style={styles.tagline}>
						Swipe your way to your next{'\n'}favourite bite nearby.
					</Text>
				</View>

				<View style={styles.footer}>
					<GradientButton
						title="Let's Eat"
						icon='restaurant'
						onPress={() => navigation.navigate('Search')}
					/>
					<View style={styles.hintRow}>
						<Text style={styles.hint}>Right to eat</Text>
						<Text style={styles.dot}>•</Text>
						<Text style={styles.hint}>Left to skip</Text>
						<Text style={styles.dot}>•</Text>
						<Text style={styles.hint}>Down to save</Text>
					</View>
				</View>
			</SafeAreaView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: COLORS.bg,
	},
	decor: {
		position: 'absolute',
		opacity: 0.16,
	},
	safe: {
		flex: 1,
		paddingHorizontal: 28,
		justifyContent: 'space-between',
	},
	hero: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		gap: 10,
	},
	logoRing: {
		width: 196,
		height: 196,
		borderRadius: 98,
		alignItems: 'center',
		justifyContent: 'center',
		padding: 10,
		marginBottom: 24,
	},
	logoInner: {
		flex: 1,
		alignSelf: 'stretch',
		borderRadius: 88,
		backgroundColor: COLORS.surface,
		alignItems: 'center',
		justifyContent: 'center',
		overflow: 'hidden',
	},
	logo: {
		width: 150,
		height: 150,
		resizeMode: 'contain',
	},
	kicker: {
		fontFamily: FONTS.bold,
		fontSize: 14,
		letterSpacing: 4,
		color: COLORS.brand,
	},
	title: {
		fontFamily: FONTS.extrabold,
		fontSize: 64,
		color: COLORS.ink,
		letterSpacing: -1,
		lineHeight: 70,
	},
	tagline: {
		fontFamily: FONTS.medium,
		fontSize: 16,
		lineHeight: 24,
		color: COLORS.body,
		textAlign: 'center',
		marginTop: 4,
	},
	footer: {
		gap: 18,
		paddingBottom: 16,
	},
	hintRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
	},
	hint: {
		fontFamily: FONTS.medium,
		fontSize: 13,
		color: COLORS.muted,
	},
	dot: {
		color: COLORS.brand,
		fontSize: 12,
	},
});
