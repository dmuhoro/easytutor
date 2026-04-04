import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { generateQuizQuestion } from "../lib/api";
import { useProgressStore } from "../store/progressStore";
import * as Haptics from 'expo-haptics';

interface Question {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

interface QuizEngineProps {
  subjectName: string;
  topicName: string;
  totalQuestions?: number;
  onFinish?: (score: number) => void;
  containerStyle?: ViewStyle;
}

export const QuizEngine: React.FC<QuizEngineProps> = ({ 
  subjectName, 
  topicName, 
  totalQuestions = 5,
  onFinish,
  containerStyle 
}) => {
  const { addQuizScore } = useProgressStore();
  
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [questionData, setQuestionData] = useState<Question | null>(null);
  const [nextQuestionData, setNextQuestionData] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [preFetching, setPreFetching] = useState(false);
  const [error, setError] = useState('');
  
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    startQuiz();
  }, [subjectName, topicName]);

  const startQuiz = async () => {
    setLoading(true);
    setError('');
    const res = await generateQuizQuestion(subjectName, topicName);
    if (res.success) {
      setQuestionData(res.data);
      preFetchNext();
    } else {
      setError(res.error ?? 'Failed to start quiz.');
    }
    setLoading(false);
  };

  const preFetchNext = async () => {
    if (preFetching || questionIndex + 1 >= totalQuestions) return;
    setPreFetching(true);
    const res = await generateQuizQuestion(subjectName, topicName);
    if (res.success) {
      setNextQuestionData(res.data);
    }
    setPreFetching(false);
  };

  const handleSelectOption = (index: number) => {
    if (showExplanation || !questionData) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedOption(index);
    setShowExplanation(true);
    
    if (index === questionData.correct) {
      setScore(prev => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    if (questionIndex + 1 >= totalQuestions) {
       addQuizScore(score, totalQuestions);
       setIsFinished(true);
       if (onFinish) onFinish(score);
       return;
    }

    if (nextQuestionData) {
      setQuestionData(nextQuestionData);
      setNextQuestionData(null);
      setQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setShowExplanation(false);
      preFetchNext();
    } else {
      setLoading(true);
      startQuiz();
    }
  };

  const handleTryAgain = () => {
    setQuestionIndex(0);
    setScore(0);
    setIsFinished(false);
    startQuiz();
  };

  if (isFinished) {
    const percentage = Math.round((score / totalQuestions) * 100);
    const feedback = percentage >= 80 ? "Outstanding!" : percentage >= 50 ? "Good Job!" : "Keep Practicing!";
    const accentColor = percentage >= 80 ? "#22c55e" : percentage >= 50 ? "#f59e0b" : "#ef4444";

    return (
      <View className="flex-1 items-center justify-center" style={containerStyle}>
        <View className="bg-[#161920] w-full rounded-[40px] p-8 border border-[#2a2f3d] items-center shadow-2xl overflow-hidden">
          <View className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-20" style={{ backgroundColor: accentColor }} />
          <View className="w-24 h-24 bg-[#0d0f12] rounded-full items-center justify-center mb-6 border-4" style={{ borderColor: accentColor }}>
             <Text className="text-white text-3xl font-bold font-syne">{percentage}%</Text>
          </View>
          <Text className="text-white text-4xl font-bold font-syne mb-2 text-center">{feedback}</Text>
          <Text className="text-[#8a8fa3] text-lg font-dmsans mb-8 text-center">
            You answered {score} out of {totalQuestions} correctly.
          </Text>
          <TouchableOpacity 
            className="bg-[#4f7cff] w-full py-5 rounded-2xl flex-row items-center justify-center shadow-lg shadow-[#4f7cff]/30"
            onPress={handleTryAgain}
          >
            <Ionicons name="refresh" size={20} color="#ffffff" />
            <Text className="text-white font-bold font-syne text-lg ml-2">Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1" style={containerStyle}>
      {/* Progress Header */}
      <View className="mb-8">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-[#8a8fa3] font-dmsans font-bold">
            Question {questionIndex + 1} of {totalQuestions}
          </Text>
          <View className="bg-[#4f7cff]/10 px-3 py-1 rounded-full">
            <Text className="text-[#4f7cff] font-bold font-syne text-[10px] uppercase">{subjectName}</Text>
          </View>
        </View>
        <View className="w-full bg-[#161920] h-1.5 rounded-full overflow-hidden border border-[#2a2f3d]">
          <View 
            className="bg-[#4f7cff] h-full rounded-full" 
            style={{ width: `${((questionIndex + 1) / totalQuestions) * 100}%` }} 
          />
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#4f7cff" />
          <Text className="text-[#8a8fa3] mt-4 text-center font-dmsans">
            Designing a challenging question for you...
          </Text>
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center">
          <Ionicons name="warning-outline" size={48} color="#ef4444" />
          <Text className="text-white mt-4 text-center font-bold text-lg mb-6">{error}</Text>
          <TouchableOpacity onPress={startQuiz} className="bg-[#4f7cff] py-3 px-8 rounded-xl flex-row items-center">
            <Ionicons name="refresh" size={18} color="#ffffff" />
            <Text className="text-white font-bold ml-2">Retry</Text>
          </TouchableOpacity>
        </View>
      ) : questionData && (
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text className="text-white text-2xl font-bold font-syne mb-8 leading-9">
            {questionData.question}
          </Text>

          <View className="mb-6">
            {questionData.options.map((option, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrect = showExplanation && idx === questionData.correct;
              const isWrong = showExplanation && isSelected && !isCorrect;
              
              const borderColor = isCorrect ? 'border-green-500' : isWrong ? 'border-red-500' : isSelected ? 'border-[#4f7cff]' : 'border-[#2a2f3d]';
              const bgColor = isCorrect ? 'bg-green-500/10' : isWrong ? 'bg-red-500/10' : isSelected ? 'bg-[#4f7cff]/10' : 'bg-[#161920]';

              return (
                <TouchableOpacity
                  key={idx}
                  onPress={() => handleSelectOption(idx)}
                  activeOpacity={0.7}
                  disabled={showExplanation}
                  className={`p-5 rounded-2xl mb-4 border-2 flex-row items-center justify-between ${borderColor} ${bgColor}`}
                >
                  <Text className={`text-base font-dmsans flex-1 pr-4 leading-6 ${showExplanation && (isCorrect || isWrong) ? 'text-white' : 'text-[#e2e8f0]'}`}>
                    {option}
                  </Text>
                  {showExplanation && isCorrect && <Ionicons name="checkmark-circle" size={24} color="#22c55e" />}
                  {showExplanation && isWrong && <Ionicons name="close-circle" size={24} color="#ef4444" />}
                </TouchableOpacity>
              );
            })}
          </View>

          {showExplanation && (
            <View className="bg-[#161920] p-5 rounded-2xl border border-[#2a2f3d] mb-8">
              <View className="flex-row items-center mb-2">
                <Ionicons name="information-circle" size={20} color="#4f7cff" />
                <Text className="text-white font-bold font-syne text-lg ml-2">Explanation</Text>
              </View>
              <Text className="text-[#8a8fa3] text-base font-dmsans leading-6">
                {questionData.explanation}
              </Text>
            </View>
          )}

          {showExplanation && (
            <TouchableOpacity 
              onPress={handleNextQuestion}
              className="bg-[#4f7cff] py-4 rounded-2xl flex-row items-center justify-center mb-10 shadow-lg shadow-[#4f7cff]/30"
            >
              <Text className="text-white font-bold text-lg font-syne mr-2">
                {questionIndex + 1 >= totalQuestions ? "Finish Quiz" : "Next Question"}
              </Text>
              <Ionicons name="arrow-forward" size={20} color="#ffffff" />
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
    </View>
  );
};
