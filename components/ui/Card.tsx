import React from 'react';
import { View, ViewProps, Text, TextProps, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { cn } from '../../lib/utils';

interface CardProps extends TouchableOpacityProps {
  elevated?: boolean;
  interactive?: boolean;
  variant?: 'default' | 'error' | 'highlight' | 'success';
}

export function Card({ className, elevated = false, interactive = false, variant = 'default', ...props }: CardProps) {
  if (interactive || typeof props.onPress === 'function') {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        className={cn(
          'bg-surface-card rounded-2xl border border-surface-border p-4',
          elevated && 'shadow-lg shadow-black/20',
          variant === 'error' && 'border-error bg-error/10',
          variant === 'highlight' && 'border-brand-500 bg-brand-500/10',
          variant === 'success' && 'border-success bg-success/10',
          className
        )}
        {...props}
      />
    );
  }
  
  return (
    <View
      className={cn(
        'bg-surface-card rounded-2xl border border-surface-border p-4',
        elevated && 'shadow-lg shadow-black/20',
        variant === 'error' && 'border-error bg-error/10',
        variant === 'highlight' && 'border-brand-500 bg-brand-500/10',
        variant === 'success' && 'border-success bg-success/10',
        className
      )}
      {...(props as any)}
    />
  );
}

export function CardHeader({ className, ...props }: ViewProps) {
  return <View className={cn('flex flex-col space-y-1.5 mb-4', className)} {...props} />;
}

export function CardTitle({ className, ...props }: TextProps) {
  return (
    <Text
      className={cn('text-xl font-syne text-text-primary tracking-tight', className)}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }: TextProps) {
  return (
    <Text
      className={cn('text-sm font-dmsans text-text-secondary', className)}
      {...props}
    />
  );
}

export function CardContent({ className, ...props }: ViewProps) {
  return <View className={cn('pt-0', className)} {...props} />;
}

export function CardFooter({ className, ...props }: ViewProps) {
  return <View className={cn('flex flex-row items-center pt-4 mt-auto', className)} {...props} />;
}
