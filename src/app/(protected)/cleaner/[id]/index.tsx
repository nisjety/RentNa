import { useMutation, useQuery } from 'convex/react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ReviewCard } from '@/components/customer/review-card';
import { ServiceChips } from '@/components/customer/service-chips';
import { StatsStrip } from '@/components/customer/stats-strip';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Radius, Shadow, Spacing, Typography } from '@/constants/theme';
import { adaptCleaner } from '@/data/adapters';
import { useTheme } from '@/hooks/use-theme';
import { api } from 'convex/_generated/api';

export default function CleanerProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { height } = useWindowDimensions();
  const theme = useTheme();
  const router = useRouter();
  const [favorited, setFavorited] = useState(false);

  const cleanerDoc = useQuery(
    api.cleaners.getBySlug,
    id ? { slug: id } : 'skip',
  );

  const HERO_HEIGHT = Math.min(Math.round(height * 0.55), 520);

  if (cleanerDoc === undefined) {
    return (
      <SafeAreaView style={[styles.notFound, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.textSecondary} />
      </SafeAreaView>
    );
  }

  if (cleanerDoc === null) {
    return (
      <SafeAreaView style={[styles.notFound, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.textSecondary }}>Fant ikke renholderen.</Text>
        <Button label="Tilbake" variant="ghost" onPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  const cleaner = adaptCleaner(cleanerDoc);
  const heroSrc = cleaner.heroImageUrl ?? cleaner.avatarUrl;
  const isSuspended = cleanerDoc.suspendedAt != null;

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { height: HERO_HEIGHT }]}>
          <Image
            source={heroSrc}
            style={StyleSheet.absoluteFillObject}
            contentFit="cover"
            transition={250}
          />
          {cleaner.isSuperCleaner && (
            <View style={[styles.superhost, { backgroundColor: theme.background }]}>
              <Ionicons name="shield-checkmark" size={14} color={theme.text} />
              <Text style={[styles.superhostLabel, { color: theme.text }]}>Superhost</Text>
            </View>
          )}
        </View>

        <View style={styles.body}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: theme.text }]}>{cleaner.name}</Text>
            {cleaner.isVerified && (
              <Ionicons name="checkmark-circle" size={20} color="#3A7D3F" />
            )}
          </View>
          <Text style={[styles.location, { color: theme.textSecondary }]}>
            {cleaner.area}, {cleaner.city}
          </Text>

          <StatsStrip
            rating={cleaner.rating}
            reviewCount={cleaner.reviewCount}
            jobsCompleted={cleaner.jobsCompleted}
            yearsExperience={cleaner.yearsExperience}
          />

          <View style={[styles.sectionDivider, { backgroundColor: theme.divider }]} />

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Om {cleaner.shortName.replace('.', '')}
            </Text>
            <Text style={[styles.bio, { color: theme.textSecondary }]}>{cleaner.bio}</Text>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Tjenester</Text>
            <ServiceChips services={cleaner.services} />
          </View>

          {cleaner.reviews.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Hva kundene sier
                </Text>
                <Pressable hitSlop={6}>
                  <Text style={[styles.viewAll, { color: theme.textSecondary }]}>Se alle</Text>
                </Pressable>
              </View>
              {cleaner.reviews.slice(0, 1).map((r) => (
                <ReviewCard key={r.id} review={r} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <SafeAreaView
        style={styles.headerOverlay}
        edges={['top']}
        pointerEvents="box-none">
        <View style={styles.headerRow}>
          <CircleBtn icon="chevron-back" onPress={() => router.back()} />
          <View style={styles.headerRight}>
            <CircleBtn
              icon={favorited ? 'heart' : 'heart-outline'}
              tint={favorited ? '#D24B4B' : undefined}
              onPress={() => setFavorited((f) => !f)}
            />
            <CircleBtn icon="ellipsis-horizontal" />
          </View>
        </View>
      </SafeAreaView>

      <SafeAreaView
        style={[styles.footer, { backgroundColor: theme.background }]}
        edges={['bottom']}>
        <View style={styles.footerRow}>
          <ChatButton cleanerSlug={cleaner.id} cleanerName={cleaner.name} />
          <View style={{ flex: 1 }}>
            <Button
              label={
                isSuspended
                  ? 'Midlertidig utilgjengelig'
                  : `Bestill ${cleaner.shortName.replace('.', '')}`
              }
              variant="primary"
              size="lg"
              disabled={isSuspended}
              onPress={() => {
                if (isSuspended) {
                  Alert.alert(
                    'Renholder er suspendert',
                    'Denne profilen er midlertidig deaktivert. Velg en annen renholder.',
                  );
                  return;
                }
                router.push(`/cleaner/${cleaner.id}/book`);
              }}
            />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

function CircleBtn({
  icon,
  tint,
  onPress,
}: {
  icon: React.ComponentProps<typeof Icon>['name'];
  tint?: string;
  onPress?: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [
        styles.circleBtn,
        { backgroundColor: '#FFFFFFEE' },
        Shadow.soft as object,
        pressed && styles.pressed,
      ]}>
      <Icon name={icon} size={20} color={tint ?? theme.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },

  hero: { position: 'relative', overflow: 'hidden' },
  superhost: {
    position: 'absolute',
    left: Spacing.four,
    bottom: Spacing.four,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.three,
    paddingVertical: 7,
    borderRadius: Radius.pill,
  },
  superhostLabel: { ...Typography.caption, fontWeight: '600' },

  body: { paddingHorizontal: Spacing.four, paddingTop: Spacing.four },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  name: { ...Typography.title, fontFamily: 'Georgia' },
  location: { ...Typography.body, marginTop: 6 },

  sectionDivider: { height: StyleSheet.hairlineWidth, marginVertical: Spacing.three },
  section: { gap: Spacing.three, marginTop: Spacing.four },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: { ...Typography.subhead, fontWeight: '600' },
  bio: { ...Typography.body, lineHeight: 22 },
  viewAll: { ...Typography.callout, fontWeight: '500' },

  headerOverlay: { position: 'absolute', top: 0, left: 0, right: 0 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
  },
  headerRight: { flexDirection: 'row', gap: Spacing.two },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },

  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  chatBtn: {
    width: 56,
    height: 56,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.85 },
});

function ChatButton({ cleanerSlug, cleanerName }: { cleanerSlug: string; cleanerName: string }) {
  const theme = useTheme();
  const router = useRouter();
  const getOrCreate = useMutation(api.threads.getOrCreate);
  const [opening, setOpening] = useState(false);

  async function handlePress() {
    setOpening(true);
    try {
      const threadId = await getOrCreate({ cleanerSlug, cleanerName });
      router.push(`/thread/${threadId}`);
    } catch (err) {
      Alert.alert('Kunne ikke åpne samtale', err instanceof Error ? err.message : 'Ukjent feil');
    } finally {
      setOpening(false);
    }
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={opening}
      style={({ pressed }) => [
        styles.chatBtn,
        { backgroundColor: theme.surfaceMuted },
        pressed && styles.pressed,
      ]}>
      {opening ? (
        <ActivityIndicator size="small" color={theme.text} />
      ) : (
        <Icon name="chatbubble-outline" size={20} color={theme.text} />
      )}
    </Pressable>
  );
}
