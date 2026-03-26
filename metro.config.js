const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Enable require.context
config.transformer.unstable_allowRequireContext = true;

module.exports = withNativeWind(config, { input: "./global.css" });
