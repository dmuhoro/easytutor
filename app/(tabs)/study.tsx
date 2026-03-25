import React, { useEffect, useState, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Keyboard, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SUBJECTS } from "../../lib/subjects";
import { useStudyStore, ChatMessage } from "../../store/studyStore";
import { askTutor } from "../../lib/api";
import { explainPrompt, quizPrompt, summaryPrompt } from "../../lib/systemPrompts";
import { useProgressStore } from "../../store/progressStore";
import { useNetInfo } from "@react-native-community/netinfo";
import { saveResponse, getCachedResponse, getCachedTopicsForSubject } from "../../lib/cache";
import * as Haptics from 'expo-haptics';

type Mode = 'Explain' | 'Quiz Me' | 'Summary';
const MODES: Mode[] = ['Explain', 'Quiz Me', 'Summary'];

export default function StudyTab() {
  const params = useLocalSearchParams<{ subjectId?: string }>();
  
  const { 
    selectedSubjectId, 
    selectedTopic, 
    chatHistory, 
    setSelectedSubject, 
    setSelectedTopic, 
    addMessage, 
    clearMessages 
  } = useStudyStore();

  const { markTopicDone } = useProgressStore();
  const { isConnected } = useNetInfo();

  const [input, setInput] = useState('');
  const [mode, setMode] = useState<Mode>('Explain');
  const [loading, setLoading] = useState(false);
  const [offlineCachedTopics, setOfflineCachedTopics] = useState<string[]>([]);
  
  const flatListRef = useRef<FlatList>(null);
  const fadeAnim = useRef(new Animated.Value(0.3)).current;

  const currentSubject = SUBJECTS.find(s => s.id === selectedSubjectId) || SUBJECTS[0];

  useEffect(() => {
    if (loading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(fadeAnim, { toValue: 0.3, duration: 800, useNativeDriver: true })
        ])
      ).start();
    } else {
      fadeAnim.setValue(0.3);
    }
  }, [loading]);

  useEffect(() => {
    if (params.subjectId) {
      setSelectedSubject(params.subjectId);
      const subject = SUBJECTS.find(s => s.id === params.subjectId);
      if (subject && subject.topics.length > 0) {
        if (!selectedTopic || !subject.topics.includes(selectedTopic)) {
           handleSelectTopic(subject.topics[0]);
        }
      }
    } else if (!selectedSubjectId) {
      setSelectedSubject(SUBJECTS[0].id);
      handleSelectTopic(SUBJECTS[0].topics[0]);
    }
  }, [params.subjectId]);

  useEffect(() => {
    if (isConnected === false && currentSubject) {
      getCachedTopicsForSubject(currentSubject.id).then(setOfflineCachedTopics);
    }
  }, [isConnected, currentSubject?.id]);

  const messages = selectedTopic ? (chatHistory[selectedTopic] || []) : [];

  const handleSelectTopic = (topic: string) => {
    setSelectedTopic(topic);
    if (!chatHistory[topic] || chatHistory[topic].length === 0) {
      clearMessages(topic);
      addMessage(topic, {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Hi! I'm your tutor. Let's master **${topic}**. What would you like to know?`,
        timestamp: Date.now()
      });
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !selectedTopic || !currentSubject) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: Date.now()
    };

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    addMessage(selectedTopic, userMsg);
    setInput('');
    setLoading(true);
    Keyboard.dismiss();

    const cached = await getCachedResponse(currentSubject.id, selectedTopic, mode);
    if (cached) {
      addMessage(selectedTopic, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: cached,
        timestamp: Date.now(),
        isCached: true
      });
      setLoading(false);
      return;
    }

    if (isConnected === false) {
      addMessage(selectedTopic, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Sorry, you are offline and there's no cached explanation for this mode yet. Please try another subject or reconnect.",
        timestamp: Date.now()
      });
      setLoading(false);
      return;
    }

    const contextMessages = [...messages, userMsg].slice(-8).map(m => ({
      role: m.role,
      content: m.content
    }));

    let sysPrompt = explainPrompt(currentSubject.name, selectedTopic);
    if (mode === 'Quiz Me') sysPrompt = quizPrompt(currentSubject.name, selectedTopic);
    if (mode === 'Summary') sysPrompt = summaryPrompt(currentSubject.name, selectedTopic);

    const res = await askTutor(sysPrompt, contextMessages);

    setLoading(false);

    if (res.success && res.data) {
      await saveResponse(currentSubject.id, selectedTopic, mode, res.data);
      addMessage(selectedTopic, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.data,
        timestamp: Date.now()
      });
    } else {
      addMessage(selectedTopic, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Sorry, I'm having trouble connecting to the network.",
        timestamp: Date.now()
      });
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';
    return (
      <View className="w-full mb-4">
        <View className={`w-full flex-row ${isUser ? 'justify-end' : 'justify-start'}`}>
          <View className={`max-w-[85%] p-4 rounded-2xl ${isUser ? 'bg-[#4f7cff] rounded-tr-sm' : 'bg-[#161920] border border-[#2a2f3d] rounded-tl-sm'}`}>
            <Text className={`text-base font-dmsans leading-6 ${isUser ? 'text-white' : 'text-[#e2e8f0]'}`}>
              {item.content}
            </Text>
            {item.isCached && (
              <View className="bg-[#f59e0b]/20 px-2 py-1 rounded mt-2 self-start border border-[#f59e0b]/30">
                 <Text className="text-[#f59e0b] text-xs font-bold font-syne">Cached</Text>
              </View>
            )}
          </View>
        </View>
        {!isUser && selectedSubjectId && selectedTopic && (
          <View className="flex-row mt-2">
            <TouchableOpacity 
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                markTopicDone(selectedSubjectId, selectedTopic);
              }}
              className="px-3 py-1.5 bg-[#22c55e]/10 rounded-full border border-[#22c55e]/30 flex-row items-center ml-2"
              activeOpacity={0.7}
            >
              <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
              <Text className="text-[#22c55e] text-xs font-bold font-syne ml-1">Mark as understood</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const displayedTopics = isConnected === false 
    ? currentSubject.topics.filter(t => offlineCachedTopics.includes(t))
    : currentSubject.topics;

  return (
    <SafeAreaView className="flex-1 bg-[#0d0f12]" edges={['top']}>
      {/* Header and Topic Pill List */}
      <View className="pt-4 pb-2 border-b border-[#2a2f3d] bg-[#0d0f12] z-10">
        <View className="px-4 mb-3">
          <Text className="text-white text-2xl font-bold font-syne mb-1">
            {currentSubject.name}
          </Text>
          {isConnected === false && (
            <Text className="text-[#f59e0b] font-dmsans text-sm flex-wrap">
              You're offline. Study from cached topics below.
            </Text>
          )}
        </View>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={displayedTopics}
          keyExtractor={(item) => item}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8 }}
          renderItem={({ item }) => {
            const isSelected = item === selectedTopic;
            return (
              <TouchableOpacity
                onPress={() => handleSelectTopic(item)}
                className={`mr-3 px-4 py-2 rounded-full border ${isSelected ? 'bg-[#4f7cff] border-[#4f7cff]' : 'bg-[#161920] border-[#2a2f3d]'}`}
              >
                <Text className={`font-semibold font-dmsans ${isSelected ? 'text-white' : 'text-[#8a8fa3]'}`}>
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            isConnected === false ? (
              <Text className="text-[#8a8fa3] italic px-4 font-dmsans mt-2">No cached topics found for this subject.</Text>
            ) : null
          }
        />
      </View>

      <KeyboardAvoidingView 
        className="flex-1" 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          className="flex-1 px-4 pt-4"
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd()}
        />

        {loading && (
          <Animated.View style={{ opacity: fadeAnim }} className="px-4 pb-4">
            <View className="w-full flex-row justify-start">
              <View className="max-w-[75%] p-4 rounded-2xl bg-[#161920] border border-[#2a2f3d] rounded-tl-sm w-48">
                <View className="h-3 bg-[#2a2f3d] rounded mb-3 w-3/4" />
                <View className="h-3 bg-[#2a2f3d] rounded mb-3 w-full" />
                <View className="h-3 bg-[#2a2f3d] rounded w-5/6" />
              </View>
            </View>
          </Animated.View>
        )}

        {/* Bottom Input Area */}
        <View className="p-4 border-t border-[#2a2f3d] bg-[#0d0f12]">
          <View className="flex-row mb-3">
            {MODES.map((m) => (
              <TouchableOpacity
                key={m}
                onPress={() => setMode(m)}
                className={`py-1.5 px-3 rounded-full mr-2 ${mode === m ? 'bg-[#4f7cff]/20' : 'bg-transparent'}`}
              >
                <Text className={`text-sm font-bold font-dmsans ${mode === m ? 'text-[#4f7cff]' : 'text-[#8a8fa3]'}`}>
                  {m}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View className="flex-row items-center bg-[#161920] rounded-3xl p-1 border border-[#2a2f3d]">
            <TextInput
              className="flex-1 text-white text-base font-dmsans px-4 py-3 min-h-[48px] max-h-[120px]"
              placeholder="Ask a question..."
              placeholderTextColor="#8a8fa3"
              multiline
              value={input}
              onChangeText={setInput}
            />
            <TouchableOpacity 
              className={`w-10 h-10 rounded-full items-center justify-center mr-1 ${input.trim() ? 'bg-[#4f7cff]' : 'bg-[#2a2f3d]'}`}
              onPress={handleSend}
              disabled={!input.trim() || loading}
            >
              <Ionicons name="send" size={16} color={input.trim() ? "white" : "#8a8fa3"} style={{ marginLeft: 2 }} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
