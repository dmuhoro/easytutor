import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "../../../lib/supabase";
import { TopicList, TopicData } from "../../../components/TopicList";
import { Ionicons } from "@expo/vector-icons";
import { useRoadmapStore } from "../../../store/roadmapStore";
import * as Haptics from 'expo-haptics';

export default function SubjectTopics() {
  const router = useRouter();
  const { subject, name } = useLocalSearchParams();
  const { setTopicId } = useRoadmapStore();
  
  const [topics, setTopics] = useState<TopicData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTopics = async () => {
    try {
      const { data, error } = await supabase
        .from('topics')
        .select('*')
        .eq('subject_id', subject)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setTopics(data || []);
    } catch (error) {
      console.error('Error fetching HS topics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTopics();
  }, [subject]);

  const handleTopicPress = (topic: TopicData) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTopicId(topic.id);
    router.push({
      pathname: '/(high_school)/[subject]/roadmap',
      params: { subject, topic: topic.title }
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0d0f12]" edges={['top']}>
      <View className="px-5 py-6 border-b border-[#2a2f3d] flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color="#4f7cff" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-white text-2xl font-bold font-syne" numberOfLines={1}>{name || 'Topics'}</Text>
          <Text className="text-[#8a8fa3] text-xs font-dmsans uppercase tracking-widest mt-1">KICD Topic Syllabus</Text>
        </View>
      </View>

      <ScrollView 
        className="flex-1 px-5 pt-8"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchTopics(); }} tintColor="#4f7cff" />
        }
      >
        {loading ? (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator size="large" color="#4f7cff" />
          </View>
        ) : topics.length === 0 ? (
          <View className="items-center justify-center py-20">
             <View className="w-16 h-16 bg-[#161920] rounded-2xl items-center justify-center mb-4 border border-[#2a2f3d]">
               <Ionicons name="documents-outline" size={32} color="#5a5f73" />
             </View>
             <Text className="text-white font-bold font-syne text-lg">No topics found</Text>
             <Text className="text-[#8a8fa3] text-center mt-2 font-dmsans">We're still updating this subject's syllabus.</Text>
          </View>
        ) : (
          <TopicList topics={topics} onPress={handleTopicPress} />
        )}

        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
}
