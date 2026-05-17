import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/ui/icon';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/* ─── Types ─────────────────────────────────────────────── */
type Priority = 'HØY' | 'MEDIUM' | 'LAV';
type ReqStatus = 'new' | 'suggested' | 'confirmed' | 'declined';

interface Candidate {
  id: string;
  name: string;
  initials: string;
  tone: string;
  match: number;
  meta: string;
  available: boolean;
}

interface Request {
  id: string;
  orderNum: string;
  priority: Priority;
  minsAgo: number;
  client: string;
  area: string;
  service: string;
  recurring: string;
  address: string;
  valueKr: number;
  valuePeriod: string;
  dateLabel: string;
  timeRange: string;
  durationH: number;
  autoMatch: { name: string; initials: string; tone: string; area: string; match: number } | null;
  status: ReqStatus;
  candidates: Candidate[];
}

/* ─── Mock data ──────────────────────────────────────────── */
const REQUESTS: Request[] = [
  {
    id: 'req_1', orderNum: '2841', priority: 'HØY', minsAgo: 2,
    client: 'Lillian B.', area: 'Bygdøy', service: 'Hjemvask', recurring: 'ukentlig',
    address: 'Bygdøy allé 41', valueKr: 4560, valuePeriod: 'mnd',
    dateLabel: 'Tir 15. mar', timeRange: '11–14', durationH: 3,
    autoMatch: { name: 'Maja L.', initials: 'ML', tone: '#D6CCBA', area: 'Grünerlekka', match: 97 },
    status: 'new',
    candidates: [
      { id: 'c1', name: 'Maja L.',       initials: 'ML', tone: '#D6CCBA', match: 97, meta: 'Faste kunder · 11–14 ledig · Norsk', available: true  },
      { id: 'c2', name: 'Amir T.',       initials: 'AT', tone: '#D9D6CC', match: 88, meta: 'Tilgjengelig · Pet OK',               available: true  },
      { id: 'c3', name: 'Oleksandra K.', initials: 'OK', tone: '#C8D8E2', match: 64, meta: '11–13 ledig, må slutte tidlig',       available: true  },
      { id: 'c4', name: 'Liv M.',        initials: 'LM', tone: '#E2D8CC', match: 41, meta: 'Booket 12:00 — ikke ledig',           available: false },
    ],
  },
  {
    id: 'req_2', orderNum: '2842', priority: 'MEDIUM', minsAgo: 14,
    client: 'Aisha N.', area: 'Tøyen', service: 'Dypvask', recurring: '1 gang',
    address: 'Tøyengata 22', valueKr: 1680, valuePeriod: 'gang',
    dateLabel: 'Tor 17. mar', timeRange: '09–13', durationH: 4,
    autoMatch: { name: 'Amir T.', initials: 'AT', tone: '#D9D6CC', area: 'Sagene', match: 97 },
    status: 'new',
    candidates: [
      { id: 'c5', name: 'Amir T.',  initials: 'AT', tone: '#D9D6CC', match: 97, meta: 'Tilgjengelig · Dypvask-erfaring', available: true  },
      { id: 'c6', name: 'Nina S.',  initials: 'NS', tone: '#CCD4D8', match: 81, meta: 'Ledig 09–14',                     available: true  },
    ],
  },
];

type FilterTab = 'new' | 'suggested' | 'confirmed' | 'declined';
const TABS: { key: FilterTab; label: string }[] = [
  { key: 'new',       label: 'Nye (2)' },
  { key: 'suggested', label: 'Foreslått' },
  { key: 'confirmed', label: 'Bekreftet' },
  { key: 'declined',  label: 'Avvist' },
];

const PRIORITY_COLOR: Record<Priority, { bg: string; text: string }> = {
  HØY:    { bg: '#F5D4D4', text: '#B0413E' },
  MEDIUM: { bg: '#F5E6C8', text: '#7A4F00' },
  LAV:    { bg: '#D6EED9', text: '#2D6636' },
};

/* ─── StripedAvatar ──────────────────────────────────────── */
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

/* ─── Tildel Sheet (Screen 18) ───────────────────────────── */
function TildelSheet({ req, onClose }: { req: Request; onClose: () => void }) {
  const theme = useTheme();
  const [selectedId, setSelectedId] = useState(req.candidates[0]?.id ?? '');
  const selected = req.candidates.find(c => c.id === selectedId);
  const filterChips = ['Match: Best', `Ledig ${req.timeRange}`, `${req.area} ≤15 min`, 'Norsk'];

  return (
    <View style={[sheet.container, { backgroundColor: theme.background }]}>
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
        {/* Nav */}
        <View style={sheet.nav}>
          <Pressable onPress={onClose} hitSlop={12} style={({ pressed }) => [sheet.backBtn, { backgroundColor: theme.surface }, pressed && styles.pressed]}>
            <Icon name="chevron-back" size={18} color={theme.text} />
          </Pressable>
          <Text style={[sheet.navTitle, { color: theme.text }]}>Tildel renholder</Text>
          <View style={{ width: 34 }} />
        </View>

        <ScrollView contentContainerStyle={sheet.scroll} showsVerticalScrollIndicator={false}>
          {/* Request summary card */}
          <View style={[sheet.reqCard, { backgroundColor: '#1A2B1A' }]}>
            <View style={sheet.reqCardTop}>
              <View>
                <Text style={sheet.reqNum}>FORESPØRSEL #{req.orderNum}</Text>
                <Text style={sheet.reqClient}>{req.client}</Text>
                <Text style={sheet.reqMeta}>{req.service} · {req.recurring} · {req.address}</Text>
              </View>
              <View style={sheet.reqValueBlock}>
                <Text style={sheet.reqValueLabel}>Verdi / {req.valuePeriod}</Text>
                <Text style={sheet.reqValue}>{req.valueKr.toLocaleString('no-NO')} kr</Text>
              </View>
            </View>
            <View style={sheet.reqDateRow}>
              <Icon name="calendar-outline" size={13} color="rgba(255,255,255,0.6)" />
              <Text style={sheet.reqDate}>{req.dateLabel} · {req.timeRange}</Text>
              <Icon name="time-outline" size={13} color="rgba(255,255,255,0.6)" />
              <Text style={sheet.reqDate}>{req.durationH} timer</Text>
            </View>
          </View>

          {/* Filter chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={sheet.chipsRow}>
            {filterChips.map(c => (
              <View key={c} style={[sheet.chip, { backgroundColor: theme.surface }]}>
                <Text style={[sheet.chipText, { color: theme.text }]}>{c}</Text>
              </View>
            ))}
          </ScrollView>

          {/* Candidates */}
          <Text style={[sheet.sectionLabel, { color: theme.textMuted }]}>
            {req.candidates.filter(c => c.available).length} KANDIDATER
          </Text>
          <View style={[sheet.candidateList, { backgroundColor: theme.surface }]}>
            {req.candidates.map((c, i) => {
              const isSelected = c.id === selectedId;
              return (
                <View key={c.id}>
                  {i > 0 && <View style={[sheet.divider, { backgroundColor: theme.divider }]} />}
                  <Pressable
                    onPress={() => c.available && setSelectedId(c.id)}
                    style={({ pressed }) => [
                      sheet.candidate,
                      isSelected && { backgroundColor: theme.accent },
                      !c.available && { opacity: 0.45 },
                      pressed && c.available && styles.pressed,
                    ]}>
                    <StripedAvatar initials={c.initials} tone={c.tone} size={38} />
                    <View style={sheet.candidateBody}>
                      <View style={sheet.candidateTop}>
                        <Text style={[sheet.candidateName, { color: isSelected ? theme.accentText : theme.text }]}>
                          {c.name}
                        </Text>
                        <Text style={[sheet.matchPct, { color: isSelected ? theme.accentText : theme.text }]}>
                          {c.match}%
                        </Text>
                      </View>
                      <Text style={[sheet.candidateMeta, { color: isSelected ? theme.accentText : theme.textSecondary, opacity: 0.8 }]} numberOfLines={1}>
                        {c.meta}
                      </Text>
                    </View>
                    {c.available && !isSelected && (
                      <Pressable style={[sheet.tildelBtn, { backgroundColor: theme.surfaceMuted }]}>
                        <Text style={[sheet.tildelBtnLabel, { color: theme.text }]}>Tildel</Text>
                      </Pressable>
                    )}
                  </Pressable>
                </View>
              );
            })}
          </View>
        </ScrollView>

        {/* Bottom actions */}
        <View style={[sheet.footer, { backgroundColor: theme.background, borderTopColor: theme.divider }]}>
          <Pressable style={({ pressed }) => [sheet.ghostBtn, { borderColor: theme.border }, pressed && styles.pressed]}>
            <Text style={[sheet.ghostLabel, { color: theme.text }]}>
              Send til alle {req.candidates.filter(c => c.available).length}
            </Text>
          </Pressable>
          <Pressable style={({ pressed }) => [sheet.ctaBtn, { backgroundColor: theme.accent }, pressed && styles.pressed]}>
            <Text style={[sheet.ctaLabel, { color: theme.accentText }]}>
              Tildel {selected?.name.split(' ')[0]} · {selected?.match}% →
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

/* ─── Main screen ────────────────────────────────────────── */
export default function ForsporslerScreen() {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState<FilterTab>('new');
  const [openReq, setOpenReq] = useState<Request | null>(null);

  const filtered = REQUESTS.filter(r =>
    activeTab === 'new'       ? r.status === 'new' :
    activeTab === 'suggested' ? r.status === 'suggested' :
    activeTab === 'confirmed' ? r.status === 'confirmed' :
    r.status === 'declined'
  );

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.agencyLabel, { color: theme.textMuted }]}>OSLO RENHOLD AS · BYRÅ</Text>
          <Text style={[styles.screenTitle, { color: theme.text }]}>Forespørsler · {REQUESTS.length}</Text>
        </View>
      </View>

      {/* Filter tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
        {TABS.map(t => (
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

      {/* Sort + auto-assign bar */}
      <View style={[styles.sortBar, { borderBottomColor: theme.divider }]}>
        <Text style={[styles.sortLabel, { color: theme.textSecondary }]}>Sortert: Prioritet</Text>
        <View style={[styles.autoTildel, { backgroundColor: theme.text }]}>
          <Text style={[styles.autoTildelLabel, { color: theme.background }]}>Auto-tildel +</Text>
        </View>
      </View>

      {/* Request cards */}
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <Text style={[styles.empty, { color: theme.textSecondary }]}>Ingen forespørsler her</Text>
        ) : (
          filtered.map(req => (
            <RequestCard key={req.id} req={req} onTildel={() => setOpenReq(req)} />
          ))
        )}
      </ScrollView>

      {/* Tildel modal */}
      <Modal visible={openReq !== null} animationType="slide" presentationStyle="pageSheet">
        {openReq && <TildelSheet req={openReq} onClose={() => setOpenReq(null)} />}
      </Modal>
    </SafeAreaView>
  );
}

function RequestCard({ req, onTildel }: { req: Request; onTildel: () => void }) {
  const theme = useTheme();
  const pc = PRIORITY_COLOR[req.priority];

  return (
    <View style={[card.root, { backgroundColor: theme.surface }]}>
      {/* Top row */}
      <View style={card.topRow}>
        <View style={[card.priorityPill, { backgroundColor: pc.bg }]}>
          <Text style={[card.priorityText, { color: pc.text }]}>{req.priority}</Text>
        </View>
        <Text style={[card.minsAgo, { color: theme.textMuted }]}>{req.minsAgo} min siden</Text>
        <View style={{ flex: 1 }} />
        <Text style={[card.valueLabel, { color: theme.textMuted }]}>Verdi</Text>
      </View>

      {/* Client + value */}
      <View style={card.clientRow}>
        <Text style={[card.clientName, { color: theme.text }]}>{req.client} · {req.area}</Text>
        <Text style={[card.value, { color: theme.text }]}>{req.valueKr.toLocaleString('no-NO')} kr/{req.valuePeriod}</Text>
      </View>
      <Text style={[card.service, { color: theme.textSecondary }]}>{req.service} · {req.recurring}</Text>

      {/* Date chip */}
      <View style={[card.dateChip, { backgroundColor: theme.surfaceMuted }]}>
        <Icon name="calendar-outline" size={13} color={theme.textSecondary} />
        <Text style={[card.dateText, { color: theme.text }]}>{req.dateLabel} · {req.timeRange}</Text>
      </View>

      {/* Auto match suggestion */}
      {req.autoMatch && (
        <View style={[card.suggestion, { backgroundColor: theme.surfaceMuted }]}>
          <Text style={[card.autoLabel, { color: theme.textMuted }]}>AUTO-FORESLÅTT</Text>
          <View style={card.suggestionInner}>
            <StripedAvatar initials={req.autoMatch.initials} tone={req.autoMatch.tone} size={28} />
            <Text style={[card.suggName, { color: theme.text }]}>{req.autoMatch.name} · {req.autoMatch.area}</Text>
            <Text style={[card.suggMatch, { color: theme.textSecondary }]}>{req.autoMatch.match}% match</Text>
          </View>
        </View>
      )}

      {/* Actions */}
      <View style={card.actions}>
        <Pressable style={({ pressed }) => [card.ghostAction, pressed && styles.pressed]}>
          <Text style={[card.ghostActionLabel, { color: theme.textSecondary }]}>Bytt</Text>
        </Pressable>
        <Pressable style={({ pressed }) => [card.ghostAction, pressed && styles.pressed]}>
          <Text style={[card.ghostActionLabel, { color: theme.textSecondary }]}>Avslå</Text>
        </Pressable>
        <Pressable
          onPress={onTildel}
          style={({ pressed }) => [card.ctaAction, { backgroundColor: theme.accent }, pressed && styles.pressed]}>
          <Text style={[card.ctaLabel, { color: theme.accentText }]}>
            Tildel {req.autoMatch?.name.split(' ')[0]}
          </Text>
        </Pressable>
      </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: Spacing.three,
  },
  sortLabel: { ...Typography.caption },
  autoTildel: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.pill },
  autoTildelLabel: { ...Typography.micro, fontWeight: '700' },
  list: { paddingHorizontal: Spacing.four, paddingBottom: 120, gap: Spacing.three },
  empty: { ...Typography.body, textAlign: 'center', marginTop: Spacing.eight },
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
  tildelBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.pill },
  tildelBtnLabel: { ...Typography.caption, fontWeight: '700' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', gap: Spacing.two, padding: Spacing.four, paddingBottom: Spacing.eight, borderTopWidth: StyleSheet.hairlineWidth },
  ghostBtn: { flex: 1, paddingVertical: 14, borderRadius: Radius.pill, alignItems: 'center', borderWidth: 1.5 },
  ghostLabel: { ...Typography.caption, fontWeight: '700' },
  ctaBtn: { flex: 2, paddingVertical: 14, borderRadius: Radius.pill, alignItems: 'center' },
  ctaLabel: { ...Typography.caption, fontWeight: '700' },
});
