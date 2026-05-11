import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CustomRoadmap } from '../store/roadmapStore';

interface RoadmapViewProps {
  roadmap: CustomRoadmap;
  checkedTasks: Record<number, string[]>;
  onToggleTask: (day: number, task: string) => void;
  containerStyle?: ViewStyle;
  hideProgress?: boolean;
}

export const RoadmapView: React.FC<RoadmapViewProps> = ({ roadmap, checkedTasks, onToggleTask, containerStyle, hideProgress }) => {
  const totalTasks = roadmap.days.reduce((acc, day) => acc + day.tasks.length, 0);
  const completedTasksCount = Object.values(checkedTasks).reduce((acc, dayTasks) => acc + dayTasks.length, 0);
  const progress = totalTasks > 0 ? Math.round((completedTasksCount / totalTasks) * 100) : 0;

  return (
    <View className="flex-1" style={containerStyle}>
      {/* Progress Bar Header */}
      {!hideProgress && (
        <View className="mb-8 bg-[#161920] p-6 rounded-[32px] border border-[#2a2f3d]">
          <View className="flex-row justify-between items-center mb-4">
            <View>
              <Text className="text-[#8a8fa3] text-xs font-dmsans uppercase tracking-widest mb-1">Roadmap Progress</Text>
              <Text className="text-white text-3xl font-bold font-syne">{progress}%</Text>
            </View>
            <View className={`w-12 h-12 rounded-full items-center justify-center ${progress === 100 ? 'bg-[#22c55e]/20' : 'bg-[#4f7cff]/20'}`}>
              <Ionicons 
                name={progress === 100 ? "trophy" : "analytics"} 
                size={24} 
                color={progress === 100 ? "#22c55e" : "#4f7cff"} 
              />
            </View>
          </View>
          <View className="w-full bg-[#0d0f12] h-2.5 rounded-full overflow-hidden border border-[#2a2f3d]">
            <View 
              className={`${progress === 100 ? 'bg-[#22c55e]' : 'bg-[#4f7cff]'} h-full rounded-full`} 
              style={{ width: `${progress}%` }} 
            />
          </View>
        </View>
      )}

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      {roadmap.days.map((dayPlan, index) => {
        const isLast = index === roadmap.days.length - 1;
        const completedTasks = checkedTasks[dayPlan.day] || [];
        const isDayComplete = completedTasks.length === dayPlan.tasks.length && dayPlan.tasks.length > 0;
        
        let dayColor = "#4f7cff";
        let dayBg = "bg-[#4f7cff]/10";
        
        if (isDayComplete) {
          dayColor = "#22c55e";
          dayBg = "bg-[#22c55e]/10";
        }

        return (
          <View key={`day-${dayPlan.day}`} className="flex-row mb-8">
            {/* Timeline */}
            <View className="items-center mr-5 w-12">
              <View className={`w-12 h-12 rounded-2xl items-center justify-center border border-white/5 ${dayBg}`}>
                <Text className="font-bold font-syne text-lg" style={{ color: dayColor }}>
                  {dayPlan.day}
                </Text>
              </View>
              {!isLast && (
                <View className="w-[1px] flex-1 my-2 bg-[#2a2f3d]" />
              )}
            </View>

            {/* Day Content */}
            <View className="flex-1 pt-1">
              <Text className="text-white text-xl font-bold font-syne mb-4">{dayPlan.title}</Text>
              
              {dayPlan.tasks.map((task, tIndex) => {
                const isChecked = completedTasks.includes(task);
                
                return (
                  <TouchableOpacity 
                    key={`${dayPlan.day}-${tIndex}`} 
                    onPress={() => onToggleTask(dayPlan.day, task)}
                    activeOpacity={0.7}
                    className="bg-[#161920] rounded-2xl p-4 mb-3 border border-[#2a2f3d]/60 flex-row items-center"
                  >
                    <View className="flex-1 pr-3">
                      <Text className={`text-base font-dmsans ${isChecked ? 'text-[#3a3f53] line-through' : 'text-[#e2e8f0]'}`}>
                        {task}
                      </Text>
                    </View>
                    
                    <View className={`w-6 h-6 rounded-lg items-center justify-center border ${isChecked ? 'bg-[#4f7cff] border-[#4f7cff]' : 'border-[#2a2f3d]'}`}>
                      {isChecked && <Ionicons name="checkmark" size={16} color="white" />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );
      })}
      </ScrollView>
    </View>
  );
};
