import { useAuth } from '@clerk/expo';
import { useQuery } from 'convex/react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api } from 'convex/_generated/api';

/**
 * Self-detecting version: queries Convex for the identity and shows the
 * banner only when Clerk is signed in but Convex returns null (i.e. the
 * JWT template "convex" is missing). Safe to drop into any screen.
 */
export function AuthSetupBannerAuto() {
  const { isSignedIn, isLoaded } = useAuth();
  const whoami = useQuery(api.notificationsQueries.whoami);
  if (!isLoaded || !isSignedIn) return null;
  if (whoami === undefined) return null; // still loading
  if (whoami !== null) return null;      // Convex sees identity — all good
  return <AuthSetupBanner />;
}

/**
 * Shown when the user is signed into Clerk but Convex cannot see the identity.
 * Almost always means the "convex" JWT template hasn't been created in Clerk.
 */
export function AuthSetupBanner() {
  const theme = useTheme();
  const openClerk = () =>
    Linking.openURL('https://dashboard.clerk.com').catch(() => null);
  return (
    <View style={[styles.root, { backgroundColor: '#F5E6C8' }]}>
      <View style={styles.icon}>
        <Icon name="warning-outline" size={20} color="#7A4F00" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { color: '#7A4F00' }]}>
          Konfigurer Convex-auth
        </Text>
        <Text style={[styles.body, { color: '#7A4F00' }]}>
          Opprett JWT-malen kalt <Text style={styles.code}>convex</Text> i
          Clerk-dashbordet for å aktivere byrå- og renholder-data.
        </Text>
        <Pressable onPress={openClerk} hitSlop={8}>
          <Text style={[styles.link, { color: '#7A4F00' }]}>
            Åpne Clerk-dashbordet →
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
    marginHorizontal: Spacing.four,
    marginBottom: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.lg,
  },
  icon: {
    width: 32, height: 32, borderRadius: Radius.pill,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(122,79,0,0.12)',
  },
  title: { ...Typography.bodyMedium, fontWeight: '700', marginBottom: 2 },
  body: { ...Typography.caption, lineHeight: 18 },
  code: { fontWeight: '700', fontVariant: ['tabular-nums'] },
  link: { ...Typography.caption, fontWeight: '700', marginTop: 6 },
});
