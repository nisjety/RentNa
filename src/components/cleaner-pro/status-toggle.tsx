import { useMutation, useQuery } from 'convex/react';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, AppState, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/ui/icon';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api } from 'convex/_generated/api';
import type { Doc } from 'convex/_generated/dataModel';

type StatusKey = 'available' | 'en_route' | 'working' | 'available_in' | 'offline';

const STATUS_META: Record<StatusKey, {
  label: string;
  short: string;
  icon: React.ComponentProps<typeof Icon>['name'];
  color: string;
  bg: string;
}> = {
  available:    { label: 'Ledig nå',         short: 'Ledig',       icon: 'radio-button-on',       color: '#0F7A3E', bg: '#D6EED9' },
  en_route:     { label: 'På vei',           short: 'På vei',      icon: 'navigate',              color: '#7A4F00', bg: '#F5E6C8' },
  working:      { label: 'Jobber nå',        short: 'Jobber',      icon: 'sparkles',              color: '#7A2E00', bg: '#F5D9C8' },
  available_in: { label: 'Ledig om noen timer', short: 'Ledig om…', icon: 'time-outline',          color: '#4A5A6A', bg: '#D8DEE5' },
  offline:      { label: 'Offline',          short: 'Offline',     icon: 'power',                 color: '#5A5A5A', bg: '#E5E5E5' },
};

const HEARTBEAT_INTERVAL_MS = 60_000;

/**
 * Card + sheet for the cleaner to set their live status.
 * Also keeps a heartbeat ticking while the app is foregrounded.
 */
export function StatusToggle() {
  const theme = useTheme();
  const status = useQuery(api.cleanerStatus.getMine);
  const setStatus = useMutation(api.cleanerStatus.setStatus);
  const heartbeat = useMutation(api.cleanerStatus.heartbeat);
  const upcomingJob = useQuery(api.cleanerPro.activeJob);
  const todayJobs = useQuery(api.cleanerPro.todayJobs);
  const [sheetOpen, setSheetOpen] = useState(false);
  const beatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Heartbeat while foregrounded
  useEffect(() => {
    heartbeat({}).catch(() => null);
    const start = () => {
      heartbeat({}).catch(() => null);
      if (beatRef.current) clearInterval(beatRef.current);
      beatRef.current = setInterval(() => {
        heartbeat({}).catch(() => null);
      }, HEARTBEAT_INTERVAL_MS);
    };
    const stop = () => {
      if (beatRef.current) {
        clearInterval(beatRef.current);
        beatRef.current = null;
      }
    };
    start();
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') start();
      else stop();
    });
    return () => {
      stop();
      sub.remove();
    };
  }, [heartbeat]);

  const current = (status?.status ?? 'offline') as StatusKey;
  const meta = STATUS_META[current] ?? STATUS_META.offline;

  const subtitle =
    current === 'en_route' && status?.etaMinutes != null
      ? `${status.etaMinutes} min unna ${jobName(upcomingJob, todayJobs)}`
      : current === 'working'
        ? `Hos ${jobName(upcomingJob, todayJobs)}`
        : current === 'available_in' && status?.availableInHours != null
          ? `Ledig om ${status.availableInHours} t`
          : current === 'available'
            ? 'Synlig for kunder'
            : 'Du tar ikke imot oppdrag';

  return (
    <>
      <Pressable
        onPress={() => setSheetOpen(true)}
        style={({ pressed }) => [
          styles.card,
          { backgroundColor: theme.surface, borderColor: meta.bg },
          pressed && { opacity: 0.92 },
        ]}>
        <View style={[styles.iconWrap, { backgroundColor: meta.bg }]}>
          <Icon name={meta.icon} size={18} color={meta.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>STATUS</Text>
          <Text style={[styles.value, { color: theme.text }]}>{meta.label}</Text>
          <Text style={[styles.sub, { color: theme.textSecondary }]} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
        <Icon name="chevron-forward" size={18} color={theme.textMuted} />
      </Pressable>

      <Modal
        visible={sheetOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSheetOpen(false)}>
        <StatusSheet
          current={status}
          activeBookingId={upcomingJob?._id ? undefined : undefined}
          onClose={() => setSheetOpen(false)}
          onSelect={async (next) => {
            try {
              await setStatus(next as any);
              setSheetOpen(false);
            } catch (err) {
              Alert.alert(
                'Kunne ikke endre status',
                err instanceof Error ? err.message : 'Ukjent feil',
              );
            }
          }}
        />
      </Modal>
    </>
  );
}

function jobName(active: any, today: any[] | undefined): string {
  if (active?.customerName) return active.customerName;
  if (today && today.length > 0) return today[0].customerName;
  return 'kunden';
}

interface SheetNext {
  status: StatusKey;
  etaMinutes?: number;
  availableInHours?: number;
}

function StatusSheet({
  current,
  onClose,
  onSelect,
}: {
  current: Doc<'cleanerStatus'> | null | undefined;
  activeBookingId?: string;
  onClose: () => void;
  onSelect: (next: SheetNext) => void;
}) {
  const theme = useTheme();
  const [selecting, setSelecting] = useState<StatusKey | null>(null);
  const [etaInput, setEtaInput] = useState('10');
  const [hoursInput, setHoursInput] = useState('2');

  function commit(s: StatusKey) {
    if (s === 'en_route') {
      const eta = parseInt(etaInput, 10);
      if (!Number.isFinite(eta) || eta < 1 || eta > 180) {
        Alert.alert('Ugyldig ETA', 'Skriv et tall mellom 1 og 180 minutter.');
        return;
      }
      onSelect({ status: 'en_route', etaMinutes: eta });
      return;
    }
    if (s === 'available_in') {
      const h = parseFloat(hoursInput);
      if (!Number.isFinite(h) || h <= 0 || h > 24) {
        Alert.alert('Ugyldig tid', 'Skriv et tall mellom 0.5 og 24 timer.');
        return;
      }
      onSelect({ status: 'available_in', availableInHours: h });
      return;
    }
    onSelect({ status: s });
  }

  const options: StatusKey[] = ['available', 'en_route', 'working', 'available_in', 'offline'];

  return (
    <SafeAreaView style={[sheet.root, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <View style={sheet.header}>
        <Pressable onPress={onClose} hitSlop={10}>
          <Icon name="close" size={24} color={theme.text} />
        </Pressable>
        <Text style={[sheet.title, { color: theme.text }]}>Sett status</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={sheet.scroll}>
        {options.map((key) => {
          const meta = STATUS_META[key];
          const isCurrent = current?.status === key;
          const isExpanded = selecting === key && (key === 'en_route' || key === 'available_in');
          return (
            <View key={key} style={[sheet.row, { backgroundColor: theme.surface }]}>
              <Pressable
                onPress={() => {
                  if (key === 'en_route' || key === 'available_in') {
                    setSelecting(selecting === key ? null : key);
                  } else {
                    commit(key);
                  }
                }}
                style={({ pressed }) => [
                  sheet.rowInner,
                  pressed && { opacity: 0.85 },
                ]}>
                <View style={[sheet.iconWrap, { backgroundColor: meta.bg }]}>
                  <Icon name={meta.icon} size={18} color={meta.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[sheet.label, { color: theme.text }]}>{meta.label}</Text>
                  <Text style={[sheet.sub, { color: theme.textSecondary }]}>
                    {key === 'available'    ? 'Synlig for kunder, kan motta booking nå'
                      : key === 'en_route'     ? 'På vei til kunden — ETA i minutter'
                      : key === 'working'      ? 'Hos kunden, jobber'
                      : key === 'available_in' ? 'Ledig om noen timer'
                      :                          'Ikke synlig for nye bookinger'}
                  </Text>
                </View>
                {isCurrent && <Icon name="checkmark-circle" size={20} color={meta.color} />}
              </Pressable>

              {isExpanded && key === 'en_route' && (
                <View style={sheet.expand}>
                  <Text style={[sheet.expandLabel, { color: theme.textSecondary }]}>ETA (minutter)</Text>
                  <View style={sheet.expandRow}>
                    <TextInput
                      value={etaInput}
                      onChangeText={setEtaInput}
                      keyboardType="number-pad"
                      style={[sheet.input, { backgroundColor: theme.surfaceMuted, color: theme.text }]}
                      placeholder="10"
                      placeholderTextColor={theme.textMuted}
                    />
                    <Pressable
                      onPress={() => commit('en_route')}
                      style={({ pressed }) => [
                        sheet.confirm,
                        { backgroundColor: theme.text },
                        pressed && { opacity: 0.85 },
                      ]}>
                      <Text style={[sheet.confirmLabel, { color: theme.background }]}>Sett som på vei</Text>
                    </Pressable>
                  </View>
                </View>
              )}

              {isExpanded && key === 'available_in' && (
                <View style={sheet.expand}>
                  <Text style={[sheet.expandLabel, { color: theme.textSecondary }]}>Tilgjengelig om (timer)</Text>
                  <View style={sheet.expandRow}>
                    <TextInput
                      value={hoursInput}
                      onChangeText={setHoursInput}
                      keyboardType="decimal-pad"
                      style={[sheet.input, { backgroundColor: theme.surfaceMuted, color: theme.text }]}
                      placeholder="2"
                      placeholderTextColor={theme.textMuted}
                    />
                    <Pressable
                      onPress={() => commit('available_in')}
                      style={({ pressed }) => [
                        sheet.confirm,
                        { backgroundColor: theme.text },
                        pressed && { opacity: 0.85 },
                      ]}>
                      <Text style={[sheet.confirmLabel, { color: theme.background }]}>Bekreft</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
          );
        })}

        <Text style={[sheet.legal, { color: theme.textMuted }]}>
          Du går automatisk offline hvis du ikke har vært aktiv i appen på 30 minutter.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginHorizontal: Spacing.four,
    marginBottom: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
  },
  iconWrap: { width: 44, height: 44, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center' },
  label: { ...Typography.micro, fontWeight: '700', letterSpacing: 0.4 },
  value: { ...Typography.subhead, fontWeight: '700', marginTop: 1 },
  sub: { ...Typography.caption, marginTop: 1 },
});

const sheet = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  title: { ...Typography.subhead, fontWeight: '700' },
  scroll: { padding: Spacing.four, gap: Spacing.two },
  row: { borderRadius: Radius.lg, overflow: 'hidden' },
  rowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
  },
  iconWrap: { width: 40, height: 40, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center' },
  label: { ...Typography.bodyMedium, fontWeight: '600' },
  sub: { ...Typography.caption, marginTop: 2 },
  expand: { padding: Spacing.three, paddingTop: 0, gap: Spacing.two },
  expandLabel: { ...Typography.caption, fontWeight: '700', letterSpacing: 0.3 },
  expandRow: { flexDirection: 'row', gap: Spacing.two },
  input: {
    ...Typography.bodyMedium,
    flex: 0.4,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    borderRadius: Radius.md,
  },
  confirm: { flex: 0.6, paddingVertical: 12, borderRadius: Radius.pill, alignItems: 'center' },
  confirmLabel: { ...Typography.bodyMedium, fontWeight: '700' },
  legal: { ...Typography.caption, textAlign: 'center', marginTop: Spacing.four },
});
