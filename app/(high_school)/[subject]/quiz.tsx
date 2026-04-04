import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { QuizEngine } from "../../../components/QuizEngine";
import { Ionicons } from "@expo/vector-icons";

export default function HighSchoolQuiz() {
  const router = useRouter();
  const { subject, topic } = useLocalSearchParams();

  return (
    <SafeAreaView className="flex-1 bg-[#0d0f12]" edges={['top']}>
      <View className="px-5 py-6 border-b border-[#2a2f3d] flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
             <Ionicons name="arrow-back" size={24} color="#4f7cff" />
          </TouchableOpacity>
          <View className="flex-1">
             <Text className="text-[#4f7cff] font-bold font-syne text-[10px] uppercase tracking-widest mb-1">Knowledge Challenge</Text>
             <Text className="text-white text-xl font-bold font-syne" numberOfLines={1}>{topic || 'Quiz'}</Text>
          </View>
        </View>
      </View>

      <View className="flex-1 px-5 pt-8">
        <QuizEngine 
          subjectName={typeof subject === 'string' ? subject : 'High School Subject'} 
          topicName={typeof topic === 'string' ? topic : 'General Topic'} 
          totalQuestions={10}
          onFinish={() => {
            // Optional: You could navigate back or show a special celebratory animation
          }}
        />
      </View>
    </SafeAreaView>
  );
}
