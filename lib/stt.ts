export const startListening = async (): Promise<string> => {
  try {
    console.log('[VOICE] Listening...');
    // integrate Expo Speech Recognition or similar
    // We will simulate a delay and return a mocked transcript for testing
    await new Promise(resolve => setTimeout(resolve, 1000));
    return "Can you explain this concept in simple terms?";
  } catch (err) {
    console.error('[STT ERROR]', err);
    return '';
  }
};
