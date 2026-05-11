import { Platform } from "react-native";

export const copyToClipboard = async (text: string) => {
  if (Platform.OS === "web") {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
    } else {
      console.warn('Clipboard API not available on this browser');
    }
    return;
  }

  const Clipboard = await import("expo-clipboard");
  await Clipboard.setStringAsync(text);
};
