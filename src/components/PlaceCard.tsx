import { Card, Text } from '@ui-kitten/components';
import React from 'react';
import { Image, ImageErrorEventData, NativeSyntheticEvent } from 'react-native';

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

export default function PlaceCard({
	name,
	rating,
	photoUri,
	ratingCount,
	priceLevel,
}: PlaceCardProps) {
	const handleImageError = (e: NativeSyntheticEvent<ImageErrorEventData>) => {
		console.warn('Image failed to load:', e.nativeEvent.error);
	};

	return (
		<Card
			style={{
				borderRadius: 10,
				padding: 16,
				alignItems: 'center',
				marginVertical: 8,
			}}
			disabled={true}
		>
			<Image
				source={photoUri ? { uri: photoUri } : undefined}
				style={{
					width: '100%',
					height: 200,
					borderRadius: 10,
					marginBottom: 12,
				}}
				resizeMode='cover'
				onError={handleImageError}
			/>
			<Text category='h6' style={{ marginBottom: 4, textAlign: 'center' }}>
				{name || 'No name provided'}
			</Text>
			<Text appearance='hint' style={{ marginBottom: 4 }}>
				{rating !== undefined ? `${rating} ⭐` : 'No rating'}
				{ratingCount !== undefined ? ` (${ratingCount})` : ''}
			</Text>
			<Text appearance='hint' style={{ marginBottom: 4 }}>
				{priceLevelToDollarSigns(priceLevel)}
			</Text>
		</Card>
	);
}
