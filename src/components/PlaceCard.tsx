import { Card, Text } from '@ui-kitten/components';
import React from 'react';
import { Image } from 'react-native';

type PlaceCardProps = {
	name: string;
	rating: number;
	price_level: string;
	description: string;
	photo: string;
};

export default function PlaceCard({
	name,
	rating,
	price_level,
	description,
	photo,
}: PlaceCardProps) {
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
				source={{ uri: photo }}
				style={{
					width: '100%',
					height: 200,
					borderRadius: 10,
					marginBottom: 12,
				}}
				resizeMode='cover'
			/>
			<Text category='h6' style={{ marginBottom: 4, textAlign: 'center' }}>
				{name}
			</Text>
			<Text appearance='hint' style={{ marginBottom: 4 }}>
				{rating} ⭐ | {price_level}
			</Text>
			<Text appearance='hint' style={{ textAlign: 'center' }}>
				{description}
			</Text>
		</Card>
	);
}
