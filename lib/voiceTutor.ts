import { generateExplanation } from './ai';
import { speakText } from './tts';

export const handleVoiceQuery = async ({
  transcript,
  subjectId
}: {
  transcript: string;
  subjectId: string;
}): Promise<string | null> => {
  try {
    console.log('[VOICE INPUT]', transcript);

    const explanation = await generateExplanation({
      topicTitle: transcript,
      masteryLevel: 50,
      subjectId
    });

    if (explanation) {
      speakText(explanation);
    }

    console.log('[VOICE OUTPUT]', explanation);
    return explanation;

  } catch (err) {
    console.error('[VOICE TUTOR ERROR]', err);
    return null;
  }
};
