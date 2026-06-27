import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { COLORS, FONTS, RADIUS, SHADOWS } from '../theme/tokens';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

type Props = {
	icon: IoniconName;
	label: string;
	children: React.ReactNode;
	style?: StyleProp<ViewStyle>;
};

export default function SectionCard({ icon, label, children, style }: Props) {
	return (
		<View style={[styles.card, SHADOWS.soft, style]}>
			<View style={styles.header}>
				<View style={styles.iconBadge}>
					<Ionicons name={icon} size={16} color={COLORS.brand} />
				</View>
				<Text style={styles.label}>{label}</Text>
			</View>
			{children}
		</View>
	);
}

const styles = StyleSheet.create({
	card: {
		backgroundColor: COLORS.surface,
		borderRadius: RADIUS.lg,
		padding: 16,
		gap: 12,
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
	},
	iconBadge: {
		width: 30,
		height: 30,
		borderRadius: 10,
		backgroundColor: COLORS.brandSoft,
		alignItems: 'center',
		justifyContent: 'center',
	},
	label: {
		fontFamily: FONTS.semibold,
		fontSize: 15,
		color: COLORS.ink,
		letterSpacing: 0.2,
	},
});
