export function handleError(error: unknown, userMessage?: string) {
    if (__DEV__) {
        console.error(error);
    }
    if (userMessage) {
        alert(userMessage);
    }
}