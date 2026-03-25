import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  isCached?: boolean;
}


interface StudyState {
  selectedSubjectId: string | null;
  selectedTopic: string | null;
  chatHistory: Record<string, ChatMessage[]>; // topicId -> messages
  setSelectedSubject: (id: string | null) => void;
  setSelectedTopic: (topic: string | null) => void;
  addMessage: (topicId: string, message: ChatMessage) => void;
  clearMessages: (topicId: string) => void;
  clearSession: () => void;
}

export const useStudyStore = create<StudyState>()(
  persist(
    (set) => ({
      selectedSubjectId: null,
      selectedTopic: null,
      chatHistory: {},
      setSelectedSubject: (id) => set({ selectedSubjectId: id }),
      setSelectedTopic: (topic) => set({ selectedTopic: topic }),
      addMessage: (topicId, message) =>
        set((state) => ({
          chatHistory: {
            ...state.chatHistory,
            [topicId]: [...(state.chatHistory[topicId] || []), message]
          }
        })),
      clearMessages: (topicId) =>
        set((state) => ({
          chatHistory: {
            ...state.chatHistory,
            [topicId]: []
          }
        })),
      clearSession: () =>
        set({
          selectedSubjectId: null,
          selectedTopic: null,
          chatHistory: {},
        }),
    }),
    {
      name: 'easytutor-study-storage-v2', // v2 to avoid conflicts with previous
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
