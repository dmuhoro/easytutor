import React from 'react';
import { View, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface SubjectData {
  id: string;
  name: string;
  icon: string | null;
  description?: string;
  level: string;
}

interface SubjectGridProps {
  subjects: SubjectData[];
  onPress: (subject: SubjectData) => void;
  containerStyle?: ViewStyle;
}

export const SubjectGrid: React.FC<SubjectGridProps> = ({ subjects, onPress, containerStyle }) => {
  return (
    <View className="flex-row flex-wrap justify-between" style={containerStyle}>
      {subjects.map((subject) => (
        <TouchableOpacity
          key={subject.id}
          onPress={() => onPress(subject)}
          activeOpacity={0.7}
          className="w-[48%] bg-[#161920] rounded-[32px] p-5 mb-5 border border-[#2a2f3d]/60 shadow-sm"
        >
          <View className="w-12 h-12 bg-[#0d0f12] rounded-2xl items-center justify-center mb-4 border border-[#2a2f3d]">
            <Text className="text-2xl">{subject.icon || '📚'}</Text>
          </View>
          
          <Text className="text-white text-lg font-bold font-syne mb-1" numberOfLines={2}>
            {subject.name}
          </Text>
          
          {subject.description && (
            <Text className="text-[#8a8fa3] text-[10px] font-dmsans uppercase tracking-widest mb-4" numberOfLines={1}>
              {subject.description}
            </Text>
          )}

          <View className="flex-row items-center mt-auto">
            <Text className="text-[#4f7cff] font-bold text-xs font-syne">Explore</Text>
            <Ionicons name="arrow-forward" size={14} color="#4f7cff" style={{ marginLeft: 4 }} />
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};
