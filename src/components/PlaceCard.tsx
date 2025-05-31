import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

type PlaceCardProps = {
  name: string;
  rating: number;
  price_level: string;
  description: string;
  photo: string;
};

export default function PlaceCard({ name, rating, price_level, description, photo }: PlaceCardProps) {
  return (
    <View style={styles.card}>
      <Image source={{ uri: photo }} style={styles.image} />
      <Text style={styles.name}>{name}</Text>
      <Text>{rating} ⭐ | {price_level}</Text>
      <Text>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 10,
    backgroundColor: '#fff',
    padding: 16,
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 10,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 8,
  },
});