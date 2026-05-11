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

import { PortalHeader } from "../../components/PortalHeader";
import { Alert } from "react-native";

export default function SelfDirectedMission() {
  const router = useRouter();
  const { roadmaps, fetchSavedRoadmaps, checkedTasks } = useRoadmapStore();

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
      <PortalHeader />
      <ScrollView className="flex-1 px-5 pt-4">
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
              Alert.alert("Uploading", "Processing your document for semantic retrieval...");
              const res = await uploadDocument({ name: 'mock_book.pdf' });
              if (res.success) {
                const text = await extractText({ name: 'mock_book.pdf' });
                const chunks = chunkText(text);
                await storeChunks({ documentId: '00000000-0000-0000-0000-000000000000', chunks });
                Alert.alert("Success", "Knowledge base updated. You can now 'Ask AI Tutor' about this book.");
              }
            }}
          >
            <Ionicons name="cloud-upload-outline" size={24} color="#3b82f6" />
            <Text className="text-white font-syne text-lg ml-4">Upload Book</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-[#161920] p-5 rounded-[20px] border border-[#2a2f3d] mb-3 flex-row items-center"
            onPress={() => router.push('/explore')}
          >
            <Ionicons name="chatbubbles-outline" size={24} color="#a855f7" />
            <Text className="text-white font-syne text-lg ml-4">Ask AI Tutor</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-[#161920] p-5 rounded-[20px] border border-[#2a2f3d] mb-3 flex-row items-center"
            onPress={() => Alert.alert("Library", "Opening your personal knowledge vault...")}
          >
            <Ionicons name="book-outline" size={24} color="#eab308" />
            <Text className="text-white font-syne text-lg ml-4">Study Uploaded Material</Text>
          </TouchableOpacity>
        </View>

        {selfDirectedRoadmaps.length > 0 && (
          <View className="mb-20">
            <Text className="text-white text-2xl font-bold font-syne mb-6">Your Recent Missions</Text>
            {selfDirectedRoadmaps.slice(0, 5).map((roadmap) => {
              const tasks = roadmap.days.reduce((acc, d) => acc + d.tasks.length, 0);
              const roadmapChecked = checkedTasks[roadmap.id] || {};
              const done = Object.values(roadmapChecked).reduce((acc, dt) => acc + dt.length, 0);
              const percent = tasks > 0 ? Math.round((done / tasks) * 100) : 0;

              return (
                <TouchableOpacity
                  key={roadmap.id}
                  onPress={() => router.push({ pathname: '/(self_directed)/roadmap', params: { topic: roadmap.topic } })}
                  className="bg-[#161920] p-6 rounded-[28px] border border-[#2a2f3d] mb-4 flex-row items-center justify-between"
                >
                  <View className="flex-1 mr-4">
                     <Text className="text-white text-lg font-bold font-syne mb-1" numberOfLines={1}>{roadmap.topic}</Text>
                     <Text className="text-[#8a8fa3] text-xs font-dmsans">{percent}% Complete • 7-Day Mission</Text>
                  </View>
                  <View className={`w-8 h-8 rounded-full items-center justify-center ${percent === 100 ? 'bg-[#22c55e]/20' : 'bg-[#4f7cff]/20'}`}>
                    <Ionicons name={percent === 100 ? "trophy" : "chevron-forward"} size={16} color={percent === 100 ? "#22c55e" : "#4f7cff"} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
