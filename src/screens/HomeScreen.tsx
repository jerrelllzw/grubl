import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button, Layout, Text } from '@ui-kitten/components';
import React from 'react';
import { StyleSheet } from 'react-native';

type RootStackParamList = {
	Search: undefined;
};

export default function HomeScreen() {
	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

	return (
		<Layout style={styles.container}>
			<Text category='h1'>Grubl</Text>
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
});
