import React from 'react';
import { View, ViewProps, Text } from 'react-native';
import { cn } from '../../lib/utils';

interface SectionProps extends ViewProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  headerAction?: React.ReactNode;
}

export function Section({ title, description, action, headerAction, className, children, ...props }: SectionProps) {
  const rightAction = action || headerAction;
  return (
    <View className={cn('py-4', className)} {...props}>
      {(title || rightAction) && (
        <View className="flex-row items-end justify-between mb-4 px-1">
          <View className="flex-1 pr-4">
            {title && (
              <Text className="text-xl font-syne text-text-primary tracking-tight">
                {title}
              </Text>
            )}
            {description && (
              <Text className="text-sm font-dmsans text-text-secondary mt-1">
                {description}
              </Text>
            )}
          </View>
          {rightAction && <View>{rightAction}</View>}
        </View>
      )}
      <View>{children}</View>
    </View>
  );
}
