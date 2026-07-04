// Logs an error for debugging. User-facing feedback is deliberately NOT shown
// here — screens surface it inline in grubl's own voice rather than through an
// off-brand system alert.
export function handleError(error: unknown) {
	if (__DEV__) {
		console.error(error);
	}
}
