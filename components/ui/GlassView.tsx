import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { cn } from '../../lib/utils';
import { COLORS } from '../../lib/theme';

interface GlassViewProps {
  children: React.ReactNode;
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
  className?: string;
  borderColor?: string;
}

export function GlassView({
  children,
  intensity = 40,
  tint = 'dark',
  className,
  borderColor = COLORS.surface.border,
}: GlassViewProps) {
  return (
    <View 
      className={cn('overflow-hidden rounded-2xl border', className)}
      style={{ borderColor }}
    >
      <BlurView
        intensity={intensity}
        tint={tint}
        style={StyleSheet.absoluteFill}
      />
      <View className="p-4">
        {children}
      </View>
    </View>
  );
}
