import { useMutation, useQuery } from 'convex/react';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/ui/icon';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api } from 'convex/_generated/api';
import type { Doc } from 'convex/_generated/dataModel';

type Priority = 'HØY' | 'MEDIUM' | 'LAV';
type FilterTab = 'new' | 'suggested' | 'confirmed' | 'declined';

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'new',       label: 'Nye' },
  { key: 'suggested', label: 'Foreslått' },
  { key: 'confirmed', label: 'Bekreftet' },
  { key: 'declined',  label: 'Avvist' },
];

const PRIORITY_COLOR: Record<Priority, { bg: string; text: string }> = {
  HØY:    { bg: '#F5D4D4', text: '#B0413E' },
  MEDIUM: { bg: '#F5E6C8', text: '#7A4F00' },
  LAV:    { bg: '#D6EED9', text: '#2D6636' },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(createdAt: number): string {
  const mins = Math.max(0, Math.round((Date.now() - createdAt) / 60000));
  if (mins < 1) return 'akkurat nå';
  if (mins < 60) return `${mins} min siden`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} t siden`;
  const days = Math.round(hours / 24);
  return `${days} d siden`;
}

function formatDateRange(startISO: string, endISO: string) {
  const start = new Date(startISO);
  const end = new Date(endISO);
  const DAY = ['Søn', 'Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør'];
  const MONTH = ['jan', 'feb', 'mar', 'apr', 'mai', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'des'];
  const dateLabel = `${DAY[start.getDay()]} ${start.getDate()}. ${MONTH[start.getMonth()]}`;
  const sh = String(start.getHours()).padStart(2, '0');
  const eh = String(end.getHours()).padStart(2, '0');
  const timeRange = `${sh}–${eh}`;
  const durationH = Math.max(1, Math.round((end.getTime() - start.getTime()) / 3600000));
  return { dateLabel, timeRange, durationH };
}

function rankCandidates(
  members: Doc<'agencyMembers'>[],
  req: Doc<'requests'>,
): { member: Doc<'agencyMembers'>; score: number; meta: string; available: boolean }[] {
  return members
    .map((m) => {
      let score = 60;
      let meta: string[] = [];
      if (m.status === 'available') {
        score += 25;
        meta.push('Tilgjengelig');
      } else if (m.status === 'on_job') {
        score += 5;
        meta.push('På jobb');
      } else {
        score -= 10;
        meta.push(m.status === 'off' ? 'Off i dag' : 'Status ukjent');
      }
      if (m.area.toLowerCase() === req.area.toLowerCase()) {
        score += 12;
        meta.push(`${m.area} (nær)`);
      }
      if (m.area.startsWith(req.area[0])) score += 3;
      if (req.autoMatchCleanerSlug === m.cleanerSlug && req.autoMatchScore != null) {
        score = Math.max(score, req.autoMatchScore);
        meta.unshift('Beste match');
      }
      const available = m.status !== 'off';
      return {
        member: m,
        score: Math.min(99, score),
        meta: meta.slice(0, 2).join(' · '),
        available,
      };
    })
    .sort((a, b) => b.score - a.score);
}

// ─── StripedAvatar ───────────────────────────────────────────────────────────

function StripedAvatar({ initials, tone, size = 36 }: { initials: string; tone: string; size?: number }) {
  const theme = useTheme();
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: tone, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
      {[...Array(5)].map((_, i) => (
        <View key={i} style={{ position: 'absolute', width: size * 2, height: 2, backgroundColor: 'rgba(255,255,255,0.32)', transform: [{ rotate: '-45deg' }, { translateY: (i - 2.5) * 8 }] }} />
      ))}
      <Text style={{ fontSize: size * 0.34, fontWeight: '600', color: theme.text }}>{initials}</Text>
    </View>
  );
}

// ─── Tildel Sheet ────────────────────────────────────────────────────────────

function TildelSheet({
  req,
  members,
  onClose,
}: {
  req: Doc<'requests'>;
  members: Doc<'agencyMembers'>[];
  onClose: () => void;
}) {
  const theme = useTheme();
  const candidates = useMemo(() => rankCandidates(members, req), [members, req]);
  const [selectedSlug, setSelectedSlug] = useState(
    candidates[0]?.member.cleanerSlug ?? '',
  );
  const [submitting, setSubmitting] = useState(false);
  const selected = candidates.find((c) => c.member.cleanerSlug === selectedSlug);
  const assignMutation = useMutation(api.agency.assignRequest);
  const broadcastMutation = useMutation(api.agency.broadcastRequest);

  const { dateLabel, timeRange, durationH } = formatDateRange(req.startsAt, req.endsAt);
  const filterChips = ['Match: Best', `Ledig ${timeRange}`, `${req.area} ≤15 min`, 'Norsk'];
  const availableCount = candidates.filter((c) => c.available).length;

  async function handleAssign() {
    if (!selected) return;
    setSubmitting(true);
    try {
      await assignMutation({ requestId: req._id, cleanerSlug: selected.member.cleanerSlug });
      onClose();
    } catch (err) {
      Alert.alert('Tildeling feilet', err instanceof Error ? err.message : 'Ukjent feil');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleBroadcast() {
    setSubmitting(true);
    try {
      await broadcastMutation({ requestId: req._id });
      onClose();
    } catch (err) {
      Alert.alert('Kunne ikke sende', err instanceof Error ? err.message : 'Ukjent feil');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={[sheet.container, { backgroundColor: theme.background }]}>
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
        <View style={sheet.nav}>
          <Pressable onPress={onClose} hitSlop={12} style={({ pressed }) => [sheet.backBtn, { backgroundColor: theme.surface }, pressed && styles.pressed]}>
            <Icon name="chevron-back" size={18} color={theme.text} />
          </Pressable>
          <Text style={[sheet.navTitle, { color: theme.text }]}>Tildel renholder</Text>
          <View style={{ width: 34 }} />
        </View>

        <ScrollView contentContainerStyle={sheet.scroll} showsVerticalScrollIndicator={false}>
          <View style={[sheet.reqCard, { backgroundColor: '#1A2B1A' }]}>
            <View style={sheet.reqCardTop}>
              <View style={{ flex: 1 }}>
                <Text style={sheet.reqNum}>FORESPØRSEL #{req.orderNum}</Text>
                <Text style={sheet.reqClient}>{req.clientName}</Text>
                <Text style={sheet.reqMeta}>{req.service} · {req.recurring} · {req.address}</Text>
              </View>
              <View style={sheet.reqValueBlock}>
                <Text style={sheet.reqValueLabel}>Verdi / {req.valuePeriod}</Text>
                <Text style={sheet.reqValue}>{req.valueKr.toLocaleString('no-NO')} kr</Text>
              </View>
            </View>
            <View style={sheet.reqDateRow}>
              <Icon name="calendar-outline" size={13} color="rgba(255,255,255,0.6)" />
              <Text style={sheet.reqDate}>{dateLabel} · {timeRange}</Text>
              <Icon name="time-outline" size={13} color="rgba(255,255,255,0.6)" />
              <Text style={sheet.reqDate}>{durationH} timer</Text>
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={sheet.chipsRow}>
            {filterChips.map((c) => (
              <View key={c} style={[sheet.chip, { backgroundColor: theme.surface }]}>
                <Text style={[sheet.chipText, { color: theme.text }]}>{c}</Text>
              </View>
            ))}
          </ScrollView>

          <Text style={[sheet.sectionLabel, { color: theme.textMuted }]}>
            {availableCount} KANDIDATER
          </Text>
          <View style={[sheet.candidateList, { backgroundColor: theme.surface }]}>
            {candidates.map((c, i) => {
              const isSelected = c.member.cleanerSlug === selectedSlug;
              return (
                <View key={c.member._id}>
                  {i > 0 && <View style={[sheet.divider, { backgroundColor: theme.divider }]} />}
                  <Pressable
                    onPress={() => c.available && setSelectedSlug(c.member.cleanerSlug)}
                    style={({ pressed }) => [
                      sheet.candidate,
                      isSelected && { backgroundColor: theme.accent },
                      !c.available && { opacity: 0.45 },
                      pressed && c.available && styles.pressed,
                    ]}>
                    <StripedAvatar initials={c.member.initials} tone={c.member.tone} size={38} />
                    <View style={sheet.candidateBody}>
                      <View style={sheet.candidateTop}>
                        <Text style={[sheet.candidateName, { color: isSelected ? theme.accentText : theme.text }]}>
                          {c.member.name}
                        </Text>
                        <Text style={[sheet.matchPct, { color: isSelected ? theme.accentText : theme.text }]}>
                          {c.score}%
                        </Text>
                      </View>
                      <Text
                        style={[sheet.candidateMeta, { color: isSelected ? theme.accentText : theme.textSecondary, opacity: 0.8 }]}
                        numberOfLines={1}>
                        {c.meta}
                      </Text>
                    </View>
                  </Pressable>
                </View>
              );
            })}
          </View>
        </ScrollView>

        <View style={[sheet.footer, { backgroundColor: theme.background, borderTopColor: theme.divider }]}>
          <Pressable
            onPress={handleBroadcast}
            disabled={submitting}
            style={({ pressed }) => [sheet.ghostBtn, { borderColor: theme.border }, pressed && styles.pressed]}>
            <Text style={[sheet.ghostLabel, { color: theme.text }]}>
              Send til alle {availableCount}
            </Text>
          </Pressable>
          <Pressable
            onPress={handleAssign}
            disabled={submitting || !selected}
            style={({ pressed }) => [sheet.ctaBtn, { backgroundColor: theme.accent }, pressed && styles.pressed]}>
            {submitting ? (
              <ActivityIndicator color={theme.accentText} />
            ) : (
              <Text style={[sheet.ctaLabel, { color: theme.accentText }]}>
                Tildel {selected?.member.name.split(' ')[0]} · {selected?.score}% →
              </Text>
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function ForsporslerScreen() {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState<FilterTab>('new');
  const [openReq, setOpenReq] = useState<Doc<'requests'> | null>(null);

  const agency = useQuery(api.agency.getCurrent);
  const requests = useQuery(api.agency.listRequests, { status: activeTab });
  const counts = useQuery(api.agency.requestCounts);
  const members = useQuery(api.agency.listMembers, {});

  const loading = requests === undefined || members === undefined;
  const TABS_WITH_COUNTS: { key: FilterTab; label: string }[] = TABS.map((t) => ({
    key: t.key,
    label: counts ? `${t.label} (${counts[t.key]})` : t.label,
  }));

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.agencyLabel, { color: theme.textMuted }]}>
            {(agency?.name ?? 'BYRÅ').toUpperCase()} · BYRÅ
          </Text>
          <Text style={[styles.screenTitle, { color: theme.text }]}>
            Forespørsler · {counts ? counts.new + counts.suggested : ''}
          </Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
        {TABS_WITH_COUNTS.map((t) => (
          <Pressable
            key={t.key}
            onPress={() => setActiveTab(t.key)}
            style={({ pressed }) => [
              styles.tab,
              { backgroundColor: activeTab === t.key ? theme.text : theme.surface },
              pressed && styles.pressed,
            ]}>
            <Text style={[styles.tabLabel, { color: activeTab === t.key ? theme.background : theme.textSecondary }]}>
              {t.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={[styles.sortBar, { borderBottomColor: theme.divider }]}>
        <Text style={[styles.sortLabel, { color: theme.textSecondary }]}>Sortert: Prioritet</Text>
        <View style={[styles.autoTildel, { backgroundColor: theme.text }]}>
          <Text style={[styles.autoTildelLabel, { color: theme.background }]}>Auto-tildel +</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator color={theme.textSecondary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {requests.length === 0 ? (
            <Text style={[styles.empty, { color: theme.textSecondary }]}>Ingen forespørsler her</Text>
          ) : (
            requests.map((req) => (
              <RequestCard
                key={req._id}
                req={req}
                members={members ?? []}
                onTildel={() => setOpenReq(req)}
              />
            ))
          )}
        </ScrollView>
      )}

      <Modal visible={openReq !== null} animationType="slide" presentationStyle="pageSheet">
        {openReq && (
          <TildelSheet
            req={openReq}
            members={members ?? []}
            onClose={() => setOpenReq(null)}
          />
        )}
      </Modal>
    </SafeAreaView>
  );
}

function RequestCard({
  req,
  members,
  onTildel,
}: {
  req: Doc<'requests'>;
  members: Doc<'agencyMembers'>[];
  onTildel: () => void;
}) {
  const theme = useTheme();
  const pc = PRIORITY_COLOR[req.priority as Priority] ?? PRIORITY_COLOR.MEDIUM;
  const { dateLabel, timeRange } = formatDateRange(req.startsAt, req.endsAt);
  const autoMatch = members.find((m) => m.cleanerSlug === req.autoMatchCleanerSlug);
  const declineMutation = useMutation(api.agency.declineRequest);
  const assignMutation = useMutation(api.agency.assignRequest);
  const [acting, setActing] = useState(false);

  async function handleDecline() {
    setActing(true);
    try {
      await declineMutation({ requestId: req._id });
    } finally {
      setActing(false);
    }
  }

  async function handleQuickAssign() {
    if (!autoMatch) {
      onTildel();
      return;
    }
    setActing(true);
    try {
      await assignMutation({ requestId: req._id, cleanerSlug: autoMatch.cleanerSlug });
    } catch (err) {
      Alert.alert('Tildeling feilet', err instanceof Error ? err.message : 'Ukjent feil');
    } finally {
      setActing(false);
    }
  }

  return (
    <View style={[card.root, { backgroundColor: theme.surface }]}>
      <View style={card.topRow}>
        <View style={[card.priorityPill, { backgroundColor: pc.bg }]}>
          <Text style={[card.priorityText, { color: pc.text }]}>{req.priority}</Text>
        </View>
        <Text style={[card.minsAgo, { color: theme.textMuted }]}>{timeAgo(req.createdAt)}</Text>
        <View style={{ flex: 1 }} />
        <Text style={[card.valueLabel, { color: theme.textMuted }]}>Verdi</Text>
      </View>

      <View style={card.clientRow}>
        <Text style={[card.clientName, { color: theme.text }]}>{req.clientName} · {req.area}</Text>
        <Text style={[card.value, { color: theme.text }]}>{req.valueKr.toLocaleString('no-NO')} kr/{req.valuePeriod}</Text>
      </View>
      <Text style={[card.service, { color: theme.textSecondary }]}>{req.service} · {req.recurring}</Text>

      <View style={[card.dateChip, { backgroundColor: theme.surfaceMuted }]}>
        <Icon name="calendar-outline" size={13} color={theme.textSecondary} />
        <Text style={[card.dateText, { color: theme.text }]}>{dateLabel} · {timeRange}</Text>
      </View>

      {autoMatch && req.status === 'new' && (
        <View style={[card.suggestion, { backgroundColor: theme.surfaceMuted }]}>
          <Text style={[card.autoLabel, { color: theme.textMuted }]}>AUTO-FORESLÅTT</Text>
          <View style={card.suggestionInner}>
            <StripedAvatar initials={autoMatch.initials} tone={autoMatch.tone} size={28} />
            <Text style={[card.suggName, { color: theme.text }]}>
              {autoMatch.name} · {autoMatch.area}
            </Text>
            <Text style={[card.suggMatch, { color: theme.textSecondary }]}>
              {req.autoMatchScore ?? 90}% match
            </Text>
          </View>
        </View>
      )}

      {req.status === 'confirmed' && req.assignedCleanerSlug && (
        <View style={[card.suggestion, { backgroundColor: '#D6EED9' }]}>
          <Text style={[card.autoLabel, { color: '#2D6636' }]}>TILDELT</Text>
          <Text style={[card.suggName, { color: '#2D6636' }]}>
            {members.find((m) => m.cleanerSlug === req.assignedCleanerSlug)?.name ?? req.assignedCleanerSlug}
          </Text>
        </View>
      )}

      {req.status === 'new' && (
        <View style={card.actions}>
          <Pressable
            onPress={onTildel}
            style={({ pressed }) => [card.ghostAction, pressed && styles.pressed]}>
            <Text style={[card.ghostActionLabel, { color: theme.textSecondary }]}>Bytt</Text>
          </Pressable>
          <Pressable
            onPress={handleDecline}
            disabled={acting}
            style={({ pressed }) => [card.ghostAction, pressed && styles.pressed]}>
            <Text style={[card.ghostActionLabel, { color: theme.textSecondary }]}>Avslå</Text>
          </Pressable>
          <Pressable
            onPress={handleQuickAssign}
            disabled={acting}
            style={({ pressed }) => [card.ctaAction, { backgroundColor: theme.accent }, pressed && styles.pressed]}>
            {acting ? (
              <ActivityIndicator color={theme.accentText} />
            ) : (
              <Text style={[card.ctaLabel, { color: theme.accentText }]}>
                {autoMatch ? `Tildel ${autoMatch.name.split(' ')[0]}` : 'Tildel'}
              </Text>
            )}
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: Spacing.four, paddingTop: Spacing.two, paddingBottom: Spacing.three },
  agencyLabel: { ...Typography.micro, letterSpacing: 0.6, marginBottom: 2 },
  screenTitle: { ...Typography.title, fontWeight: '700' },
  tabsRow: { paddingHorizontal: Spacing.four, gap: Spacing.two, paddingBottom: Spacing.three },
  tab: { paddingHorizontal: Spacing.three, paddingVertical: 7, borderRadius: Radius.pill },
  tabLabel: { ...Typography.caption, fontWeight: '600' },
  sortBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.four, paddingBottom: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth, marginBottom: Spacing.three,
  },
  sortLabel: { ...Typography.caption },
  autoTildel: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.pill },
  autoTildelLabel: { ...Typography.micro, fontWeight: '700' },
  list: { paddingHorizontal: Spacing.four, paddingBottom: 120, gap: Spacing.three },
  empty: { ...Typography.body, textAlign: 'center', marginTop: Spacing.eight },
  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.82 },
});

const card = StyleSheet.create({
  root: { borderRadius: Radius.xl, padding: Spacing.four, gap: Spacing.two },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  priorityPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.pill },
  priorityText: { ...Typography.micro, fontWeight: '800', letterSpacing: 0.5 },
  minsAgo: { ...Typography.caption },
  valueLabel: { ...Typography.micro },
  clientRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  clientName: { ...Typography.bodyMedium, fontWeight: '700', flex: 1 },
  value: { ...Typography.bodyMedium, fontWeight: '700' },
  service: { ...Typography.caption },
  dateChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: Radius.md, alignSelf: 'flex-start', marginTop: 2 },
  dateText: { ...Typography.caption, fontWeight: '500' },
  suggestion: { borderRadius: Radius.md, padding: Spacing.three, gap: 5 },
  autoLabel: { ...Typography.micro, fontWeight: '700', letterSpacing: 0.5 },
  suggestionInner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  suggName: { ...Typography.caption, fontWeight: '600', flex: 1 },
  suggMatch: { ...Typography.caption },
  actions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginTop: 2 },
  ghostAction: { paddingHorizontal: Spacing.three, paddingVertical: 8 },
  ghostActionLabel: { ...Typography.caption, fontWeight: '600' },
  ctaAction: { flex: 1, paddingVertical: 10, borderRadius: Radius.pill, alignItems: 'center' },
  ctaLabel: { ...Typography.caption, fontWeight: '700' },
});

const sheet = StyleSheet.create({
  container: { flex: 1 },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.four, paddingVertical: Spacing.three },
  backBtn: { width: 34, height: 34, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center' },
  navTitle: { ...Typography.bodyMedium, fontWeight: '700' },
  scroll: { paddingHorizontal: Spacing.four, paddingBottom: 140, gap: Spacing.three },
  reqCard: { borderRadius: Radius.xl, padding: Spacing.four, gap: Spacing.three },
  reqCardTop: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.two },
  reqNum: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8, color: 'rgba(255,255,255,0.5)', marginBottom: 4 },
  reqClient: { ...Typography.subhead, fontWeight: '700', color: '#FFFFFF' },
  reqMeta: { ...Typography.caption, color: 'rgba(255,255,255,0.6)', marginTop: 3 },
  reqValueBlock: { alignItems: 'flex-end' },
  reqValueLabel: { fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: '600', letterSpacing: 0.4 },
  reqValue: { ...Typography.headline, fontWeight: '800', color: '#FFFFFF' },
  reqDateRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  reqDate: { ...Typography.caption, color: 'rgba(255,255,255,0.7)' },
  chipsRow: { gap: Spacing.two, paddingVertical: 2 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: Radius.pill },
  chipText: { ...Typography.caption, fontWeight: '600' },
  sectionLabel: { ...Typography.micro, fontWeight: '700', letterSpacing: 0.8, marginTop: 4 },
  candidateList: { borderRadius: Radius.xl, overflow: 'hidden' },
  divider: { height: StyleSheet.hairlineWidth },
  candidate: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, padding: Spacing.three },
  candidateBody: { flex: 1, gap: 2 },
  candidateTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  candidateName: { ...Typography.bodyMedium, fontWeight: '700' },
  matchPct: { ...Typography.bodyMedium, fontWeight: '700' },
  candidateMeta: { ...Typography.caption },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', gap: Spacing.two, padding: Spacing.four, paddingBottom: Spacing.eight, borderTopWidth: StyleSheet.hairlineWidth },
  ghostBtn: { flex: 1, paddingVertical: 14, borderRadius: Radius.pill, alignItems: 'center', borderWidth: 1.5 },
  ghostLabel: { ...Typography.caption, fontWeight: '700' },
  ctaBtn: { flex: 2, paddingVertical: 14, borderRadius: Radius.pill, alignItems: 'center' },
  ctaLabel: { ...Typography.caption, fontWeight: '700' },
});
