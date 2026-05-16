import React from 'react';
import { Text, type TextProps, type TextStyle } from 'react-native';

import { Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { ThemeColor } from '@/constants/theme';

type Variant = keyof typeof Typography;

interface RNText extends TextProps {
  variant?: Variant;
  themeColor?: ThemeColor;
  align?: TextStyle['textAlign'];
  style?: TextStyle | TextStyle[];
}

export function Heading({
  variant = 'headline',
  themeColor = 'text',
  align,
  style,
  children,
  ...rest
}: RNText) {
  const theme = useTheme();
  return (
    <Text
      style={[Typography[variant], { color: theme[themeColor], textAlign: align }, style]}
      {...rest}>
      {children}
    </Text>
  );
}
