import { Alert } from 'react-native';

export function handleError(error: unknown, userMessage?: string) {
    if (__DEV__) {
        console.error(error);
    }
    if (userMessage) {
        Alert.alert('Grubl', userMessage);
    }
}