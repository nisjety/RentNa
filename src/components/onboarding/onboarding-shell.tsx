import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/brand/brand-mark';
import { Icon } from '@/components/ui/icon';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface Props {
  children: React.ReactNode;
  prompt: string;
  helper?: string;
  city?: string;
  year?: number;
  showBack?: boolean;
  onBack?: () => void;
}

export function OnboardingShell({
  children,
  prompt,
  helper,
  city = 'Oslo',
  year = new Date().getFullYear(),
  showBack = false,
  onBack,
}: Props) {
  const theme = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <View style={styles.headerRow}>
        {showBack ? (
          <Pressable
            onPress={onBack ?? (() => router.back())}
            hitSlop={12}
            style={({ pressed }) => [
              styles.iconBtn,
              { backgroundColor: theme.text },
              pressed && styles.pressed,
            ]}>
            <Icon name="chevron-back" size={16} color={theme.background} />
          </Pressable>
        ) : (
          <View style={[styles.mark, { backgroundColor: theme.text }]}>
            <Text style={[styles.markLetter, { color: theme.accent }]}>R</Text>
          </View>
        )}
        <Text style={[styles.locale, { color: theme.textSecondary }]}>
          {city} · {year}
        </Text>
      </View>

      <View style={styles.body}>
        <View style={styles.brandBlock}>
          <BrandMark size="lg" />
          <Text style={[styles.prompt, { color: theme.text }]}>{prompt}</Text>
          {helper && (
            <Text style={[styles.helper, { color: theme.textSecondary }]}>{helper}</Text>
          )}
        </View>

        <View style={styles.cards}>{children}</View>
      </View>

      <View style={styles.footer}>
        <Pressable hitSlop={8} style={({ pressed }) => [styles.langBtn, pressed && styles.pressed]}>
          <Icon name="globe-outline" size={14} color={theme.textSecondary} />
          <Text style={[styles.langText, { color: theme.textSecondary }]}>
            Norsk Bokmål · English
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mark: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markLetter: { ...Typography.bodyMedium, fontWeight: '700' },
  locale: { ...Typography.caption },
  body: { flex: 1, paddingHorizontal: Spacing.four, paddingTop: Spacing.seven },
  brandBlock: { gap: Spacing.two, marginBottom: Spacing.six },
  prompt: { ...Typography.headline, marginTop: Spacing.three },
  helper: { ...Typography.callout, color: '#847267' },
  cards: { gap: Spacing.three },
  footer: { alignItems: 'center', paddingBottom: Spacing.three },
  langBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  langText: { ...Typography.caption },
  pressed: { opacity: 0.85 },
});
