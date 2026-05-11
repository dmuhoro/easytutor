import * as Speech from 'expo-speech';

export const speakText = (text: string) => {
  try {
    Speech.speak(text);
    console.log('[TTS] Speaking...');
  } catch (err) {
    console.error('[TTS ERROR]', err);
  }
};

export const stopSpeaking = () => {
  try {
    Speech.stop();
  } catch (err) {
    console.error('[TTS ERROR]', err);
  }
};
