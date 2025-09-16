import { useTheme } from '@ui-kitten/components';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type TagProps = {
	label: string;
};

const Tag = ({ label }: TagProps) => {
	const theme = useTheme();

	return (
		<View style={[styles.tag, { backgroundColor: theme['color-primary-300'] }]}>
			<Text style={{ fontWeight: 'bold' }}>{label}</Text>
		</View>
	);
};

const styles = StyleSheet.create({
	tag: {
		paddingHorizontal: 10,
		paddingVertical: 4,
		borderRadius: 20,
	},
});

export default Tag;
