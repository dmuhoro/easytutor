import * as React from 'react';
import { Text as RNText } from 'react-native';
import { cn } from '@/lib/utils';

export const TextClassContext = React.createContext<string | undefined>(undefined);

export function Text({ className, variant, ...props }: React.ComponentProps<typeof RNText> & { variant?: string }) {
  const textClass = React.useContext(TextClassContext);
  return <RNText className={cn(textClass, className)} {...props} />;
}
