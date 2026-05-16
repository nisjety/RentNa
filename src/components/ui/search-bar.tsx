import React from 'react';
import { Pressable, StyleSheet, TextInput, View, type ViewStyle } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface SearchBarProps {
  value?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  onFilterPress?: () => void;
  style?: ViewStyle;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Søk tjeneste, område…',
  onFilterPress,
  style,
}: SearchBarProps) {
  const theme = useTheme();

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.input, { backgroundColor: theme.surface }]}>
        <Icon name="search-outline" size={20} color={theme.textSecondary} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.textMuted}
          style={[styles.textInput, { color: theme.text }]}
          returnKeyType="search"
        />
      </View>
      <Pressable
        onPress={onFilterPress}
        style={({ pressed }) => [
          styles.filter,
          { backgroundColor: theme.surface },
          pressed && styles.pressed,
        ]}>
        <Icon name="options-outline" size={20} color={theme.text} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  input: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingVertical: 14,
    borderRadius: Radius.pill,
  },
  textInput: {
    flex: 1,
    ...Typography.body,
    padding: 0,
  },
  filter: {
    width: 50,
    height: 50,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.85 },
});
