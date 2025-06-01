import { Card, Text } from '@ui-kitten/components';
import React from 'react';
import {
	Image,
	ImageErrorEventData,
	NativeSyntheticEvent,
	View,
} from 'react-native';

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
				marginVertical: 8,
				backgroundColor: '#1c2238',
			}}
			disabled
		>
			<View style={{ width: '100%', height: 200, marginBottom: 12 }}>
				<Image
					source={photoUri ? { uri: photoUri } : undefined}
					style={{
						maxWidth: '100%',
						height: 200,
						borderRadius: 10,
					}}
					resizeMode='cover'
					onError={handleImageError}
				/>
				<View
					style={{
						position: 'absolute',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						backgroundColor: 'rgba(0,0,0,0.2)',
						borderRadius: 10,
					}}
				/>
			</View>
			<Text category='h6' style={{ marginBottom: 4, textAlign: 'center' }}>
				{name || 'No name provided'}
			</Text>
			<Text appearance='hint' style={{ marginBottom: 4, textAlign: 'center' }}>
				{rating !== undefined ? `${rating} ⭐` : 'No rating'}
				{ratingCount !== undefined ? ` (${ratingCount})` : ''}
			</Text>
			<Text appearance='hint' style={{ textAlign: 'center' }}>
				{priceLevelToDollarSigns(priceLevel)}
			</Text>
		</Card>
	);
}
