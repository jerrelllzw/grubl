import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, FONTS, RADIUS } from '../theme/tokens';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

type TagProps = {
	label: string;
	icon?: IoniconName;
	tone?: 'brand' | 'neutral';
};

const Tag = ({ label, icon, tone = 'brand' }: TagProps) => {
	const brand = tone === 'brand';
	return (
		<View style={[styles.tag, { backgroundColor: brand ? COLORS.brandSoft : COLORS.surfaceAlt }]}>
			{icon && <Ionicons name={icon} size={13} color={brand ? COLORS.brand : COLORS.body} />}
			<Text style={[styles.label, { color: brand ? COLORS.brandDark : COLORS.body }]}>{label}</Text>
		</View>
	);
};

const styles = StyleSheet.create({
	tag: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 5,
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: RADIUS.pill,
	},
	label: {
		fontFamily: FONTS.semibold,
		fontSize: 13,
	},
});

export default Tag;
