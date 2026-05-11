import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { cn } from '../../lib/utils';
import { COLORS } from '../../lib/theme';

interface ProgressRingProps {
  progress: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  className?: string;
  showText?: boolean;
}

export function ProgressRing({
  progress,
  size = 64,
  strokeWidth = 6,
  color = COLORS.brand[500],
  backgroundColor = COLORS.surface.border,
  className,
  showText = true,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const safeProgress = Math.min(Math.max(progress, 0), 100);
  const strokeDashoffset = circumference - (safeProgress / 100) * circumference;

  return (
    <View className={cn('items-center justify-center relative', className)} style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          rotation="-90"
          originX={size / 2}
          originY={size / 2}
        />
      </Svg>
      {showText && (
        <View className="absolute inset-0 items-center justify-center">
          <Text className="text-xs font-syne text-text-primary font-bold">
            {Math.round(safeProgress)}%
          </Text>
        </View>
      )}
    </View>
  );
}

interface LinearProgressProps {
  progress: number;
  height?: number;
  backgroundColor?: string;
  color?: string;
  className?: string;
}

export function LinearProgress({
  progress,
  height = 6,
  backgroundColor = '#1c2029',
  color = COLORS.brand[500],
  className
}: LinearProgressProps) {
  const safeProgress = Math.min(Math.max(progress, 0), 100);
  
  return (
    <View 
      className={cn('w-full rounded-full overflow-hidden', className)} 
      style={{ height, backgroundColor }}
    >
      <View 
        className="h-full rounded-full" 
        style={{ width: `${safeProgress}%`, backgroundColor: color }} 
      />
    </View>
  );
}