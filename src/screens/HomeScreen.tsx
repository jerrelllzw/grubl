import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button, Layout } from '@ui-kitten/components';
import React from 'react';
import { Image, StyleSheet } from 'react-native';

type RootStackParamList = {
	Search: undefined;
};

export default function HomeScreen() {
	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

	return (
		<Layout style={styles.container}>
			<Image source={require('../assets/images/hero.png')} style={styles.title} />
			<Button onPress={() => navigation.navigate('Search')}>Let&apos;s Eat!</Button>
		</Layout>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 16,
		gap: 32,
	},
	title: {
		width: 300,
		height: 300,
		resizeMode: 'contain',
		borderRadius: 100,
	},
});
