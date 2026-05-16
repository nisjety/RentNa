import { useColorScheme } from 'react-native';
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppleSignInButton } from '@/components/auth/apple-sign-in-button';
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button';
import { VippsSignInButton } from '@/components/auth/vipps-sign-in-button';
import { Colors, Spacing } from '@/constants/theme';

export default function SignInScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={styles.inner}>
        <View style={styles.hero}>
          <Text style={[styles.appName, { color: colors.text }]}>RentNå</Text>
          <Text style={[styles.tagline, { color: colors.textSecondary }]}>
            Finn din neste bolig{'\n'}enkelt og trygt
          </Text>
        </View>

        <View style={styles.buttons}>
          {Platform.OS === 'ios' && <AppleSignInButton />}
          <GoogleSignInButton />
          <VippsSignInButton />
        </View>

        <Text style={[styles.legal, { color: colors.textSecondary }]}>
          Ved å fortsette godtar du våre{'\n'}
          <Text style={styles.legalLink}>Vilkår for bruk</Text>
          {' og '}
          <Text style={styles.legalLink}>Personvernregler</Text>
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  inner: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    justifyContent: 'space-between',
    paddingBottom: Spacing.four,
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.two,
  },
  appName: {
    fontSize: 48,
    fontWeight: '700',
    letterSpacing: -2,
  },
  tagline: {
    fontSize: 17,
    textAlign: 'center',
    lineHeight: 24,
  },
  buttons: {
    gap: Spacing.two,
  },
  legal: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: Spacing.three,
    lineHeight: 18,
  },
  legalLink: {
    textDecorationLine: 'underline',
  },
});
