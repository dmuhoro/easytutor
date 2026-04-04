import React from 'react';
import { View, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface TopicData {
  id: string;
  subject_id: string;
  title: string;
  form_level?: string;
  sort_order?: number;
}

interface TopicListProps {
  topics: TopicData[];
  onPress: (topic: TopicData) => void;
  containerStyle?: ViewStyle;
}

export const TopicList: React.FC<TopicListProps> = ({ topics, onPress, containerStyle }) => {
  return (
    <View style={containerStyle}>
      {topics.map((topic, index) => (
        <TouchableOpacity
          key={topic.id}
          onPress={() => onPress(topic)}
          activeOpacity={0.7}
          className="bg-[#161920] rounded-[24px] p-5 mb-4 border border-[#2a2f3d]/60 flex-row items-center justify-between shadow-sm"
        >
          <View className="flex-1 mr-4">
             {topic.form_level && (
               <Text className="text-[#4f7cff] font-bold font-syne text-[10px] uppercase tracking-widest mb-1">
                 {topic.form_level}
               </Text>
             )}
            <Text className="text-white text-lg font-bold font-syne" numberOfLines={2}>
              {topic.title}
            </Text>
          </View>
          
          <Ionicons name="chevron-forward" size={20} color="#4f7cff" />
        </TouchableOpacity>
      ))}
    </View>
  );
};
