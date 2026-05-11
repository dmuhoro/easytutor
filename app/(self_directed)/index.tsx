import React, { useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { GoalInput } from "../../components/GoalInput";
import { useRoadmapStore } from "../../store/roadmapStore";
import { Ionicons } from "@expo/vector-icons";
import { uploadDocument } from "../../lib/documents";
import { extractText } from "../../lib/extraction";
import { chunkText } from "../../lib/chunking";
import { storeChunks } from "../../lib/knowledge";

export default function SelfDirectedMission() {
  const router = useRouter();
  const { roadmaps, fetchSavedRoadmaps } = useRoadmapStore();

  useEffect(() => {
    fetchSavedRoadmaps();
  }, []);

  const handleStartMission = (goal: string) => {
    router.push({
      pathname: '/(self_directed)/roadmap',
      params: { topic: goal }
    });
  };

  const selfDirectedRoadmaps = roadmaps.filter(r => r.learningMode === 'self_directed');

  return (
    <SafeAreaView className="flex-1 bg-[#0d0f12]" edges={['top']}>
      <ScrollView className="flex-1 px-5 pt-8">
        <View className="mb-10">
          <Text className="text-[#22c55e] font-bold font-syne text-sm uppercase tracking-widest mb-2">The Explorer's Portal</Text>
          <Text className="text-white text-4xl font-bold font-syne mb-4">Self-Directed Path</Text>
          <Text className="text-[#8a8fa3] text-lg font-dmsans leading-7">
            You are the architect of your own knowledge. What mission will you embark on today?
          </Text>
        </View>

        <GoalInput onStart={handleStartMission} containerStyle={{ marginBottom: 40 }} />

        <View className="mb-10">
          <Text className="text-white text-2xl font-bold font-syne mb-6">Knowledge Workspace</Text>
          
          <TouchableOpacity
            className="bg-[#161920] p-5 rounded-[20px] border border-[#2a2f3d] mb-3 flex-row items-center"
            onPress={async () => {
              const res = await uploadDocument({ name: 'mock_book.pdf' });
              if (res.success) {
                const text = await extractText({ name: 'mock_book.pdf' });
                const chunks = chunkText(text);
                // mock document ID for now
                await storeChunks({ documentId: '00000000-0000-0000-0000-000000000000', chunks });
              }
            }}
          >
            <Ionicons name="cloud-upload-outline" size={24} color="#3b82f6" />
            <Text className="text-white font-syne text-lg ml-4">Upload Book</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-[#161920] p-5 rounded-[20px] border border-[#2a2f3d] mb-3 flex-row items-center"
          >
            <Ionicons name="chatbubbles-outline" size={24} color="#a855f7" />
            <Text className="text-white font-syne text-lg ml-4">Ask AI Tutor</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-[#161920] p-5 rounded-[20px] border border-[#2a2f3d] mb-3 flex-row items-center"
          >
            <Ionicons name="book-outline" size={24} color="#eab308" />
            <Text className="text-white font-syne text-lg ml-4">Study Uploaded Material</Text>
          </TouchableOpacity>
        </View>

        {selfDirectedRoadmaps.length > 0 && (
          <View className="mb-20">
            <Text className="text-white text-2xl font-bold font-syne mb-6">Your Recent Missions</Text>
            {selfDirectedRoadmaps.slice(0, 5).map((roadmap) => (
              <TouchableOpacity
                key={roadmap.id}
                onPress={() => router.push({ pathname: '/(self_directed)/roadmap', params: { topic: roadmap.topic } })}
                className="bg-[#161920] p-6 rounded-[28px] border border-[#2a2f3d] mb-4 flex-row items-center justify-between"
              >
                <View className="flex-1 mr-4">
                   <Text className="text-white text-lg font-bold font-syne mb-1" numberOfLines={1}>{roadmap.topic}</Text>
                   <Text className="text-[#8a8fa3] text-xs font-dmsans">7-Day Study Cycle</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#22c55e" />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
