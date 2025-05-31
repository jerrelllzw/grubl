import { Card, Text } from '@ui-kitten/components';
import React from 'react';
import { Image, ImageErrorEventData, NativeSyntheticEvent } from 'react-native';

interface PlaceCardProps {
	name?: string;
	rating?: number;
	photoUri?: string;
}

export default function PlaceCard({ name, rating, photoUri }: PlaceCardProps) {
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
			</Text>
		</Card>
	);
}
