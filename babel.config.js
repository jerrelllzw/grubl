module.exports = function (api) {
	api.cache(true);
	return {
		// babel-preset-expo bundles the react-native-reanimated plugin, so it does
		// not need to be listed separately (and must remain last if it ever is).
		presets: ['babel-preset-expo'],
	};
};
