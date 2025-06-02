import { Card, Text } from '@ui-kitten/components';
import React from 'react';
import { Image, ImageErrorEventData, NativeSyntheticEvent, StyleSheet } from 'react-native';
import { handleError } from '../utils/errorHandler';

interface PlaceCardProps {
	name?: string;
	rating?: number;
	photoUri?: string;
	ratingCount?: number;
	priceLevel?: string;
}

function priceLevelToDollarSigns(level?: string) {
	switch (level) {
		case 'PRICE_LEVEL_FREE':
			return 'Free';
		case 'PRICE_LEVEL_INEXPENSIVE':
			return '$';
		case 'PRICE_LEVEL_MODERATE':
			return '$$';
		case 'PRICE_LEVEL_EXPENSIVE':
			return '$$$';
		case 'PRICE_LEVEL_VERY_EXPENSIVE':
			return '$$$$';
		default:
			return '';
	}
}

export default function PlaceCard({ name, rating, photoUri, ratingCount, priceLevel }: PlaceCardProps) {
	const handleImageError = (e: NativeSyntheticEvent<ImageErrorEventData>) => {
		handleError(e.nativeEvent.error, 'Failed to load image');
	};

	return (
		<Card style={styles.card} disabled>
			<Image
				source={photoUri ? { uri: photoUri } : undefined}
				style={styles.image}
				resizeMode='cover'
				onError={handleImageError}
			/>
			<Text category='h6' style={styles.title}>
				{name || 'No name provided'}
			</Text>
			<Text appearance='hint' style={styles.rating}>
				{rating !== undefined ? `${rating} ⭐` : 'No ratings yet'}
				{ratingCount !== undefined ? ` (${ratingCount})` : ''}
			</Text>
			<Text appearance='hint' style={styles.price}>
				{priceLevelToDollarSigns(priceLevel)}
			</Text>
		</Card>
	);
}

const styles = StyleSheet.create({
	card: {
		borderRadius: 10,
		padding: 16,
		marginVertical: 8,
	},
	image: {
		maxWidth: '100%',
		height: 200,
		borderRadius: 10,
	},
	title: {
		marginBottom: 4,
		textAlign: 'center',
	},
	rating: {
		marginBottom: 4,
		textAlign: 'center',
	},
	price: {
		textAlign: 'center',
	},
});
