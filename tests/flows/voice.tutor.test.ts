import { describe, it, expect, vi } from 'vitest';
import { handleVoiceQuery } from '../../lib/voiceTutor';
import { startListening } from '../../lib/stt';
import * as tts from '../../lib/tts';
import * as ai from '../../lib/ai';

vi.mock('../../lib/tts', () => ({
  speakText: vi.fn(),
  stopSpeaking: vi.fn(),
}));

vi.mock('../../lib/ai', () => ({
  generateExplanation: vi.fn().mockResolvedValue('Here is a simulated voice explanation.'),
}));

describe('Voice Tutor', () => {
  it('handles voice input safely', async () => {
    const transcript = await startListening();
    expect(typeof transcript).toBe('string');
  });

  it('generates explanation from transcript', async () => {
    const res = await handleVoiceQuery({ transcript: 'test query', subjectId: 'subj-1' });
    expect(res).toBe('Here is a simulated voice explanation.');
    expect(ai.generateExplanation).toHaveBeenCalledWith({
      topicTitle: 'test query',
      masteryLevel: 50,
      subjectId: 'subj-1'
    });
  });

  it('triggers speech output', async () => {
    await handleVoiceQuery({ transcript: 'test query 2', subjectId: 'subj-2' });
    expect(tts.speakText).toHaveBeenCalledWith('Here is a simulated voice explanation.');
  });
});
