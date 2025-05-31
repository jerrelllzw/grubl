import { Linking } from 'react-native';

export const openInMaps = (place:any) => {
  const url = `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`;
  Linking.openURL(url);
};