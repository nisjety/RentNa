import { useMutation, useQuery } from 'convex/react';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { Icon } from '@/components/ui/icon';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api } from 'convex/_generated/api';

const DAY_SHORT = ['Søn', 'Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør'];
const TIME_SLOTS = [
  '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
];

function getWeekDays(offset: number): Date[] {
  const today = new Date();
  const monday = new Date(today);
  const dayOfWeek = today.getDay();
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  monday.setDate(today.getDate() + daysToMonday + offset * 7);
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function slotKey(date: Date, time: string): string {
  return `${date.toDateString()}|${time}`;
}

function weekStartISO(offset: number): string {
  return getWeekDays(offset)[0].toISOString().slice(0, 10);
}

export default function CalendarScreen() {
  const theme = useTheme();
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [localSlots, setLocalSlots] = useState<Set<string>>(new Set());
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const currentWeekStart = useMemo(() => weekStartISO(weekOffset), [weekOffset]);
  const data = useQuery(api.cleanerPro.availabilityWeek, { weekStart: currentWeekStart });
  const setAvailability = useMutation(api.cleanerPro.setAvailability);

  // Sync server slots into local state when week changes
  useEffect(() => {
    if (data) {
      setLocalSlots(new Set(data.slots));
      setDirty(false);
    }
  }, [data?.weekStart, data?.slots.join(',')]);

  const weekDays = getWeekDays(weekOffset);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  function weekLabel(): string {
    const first = weekDays[0];
    const last = weekDays[6];
    const months = ['jan', 'feb', 'mar', 'apr', 'mai', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'des'];
    if (first.getMonth() === last.getMonth()) {
      return `${first.getDate()}–${last.getDate()}. ${months[first.getMonth()]}`;
    }
    return `${first.getDate()}. ${months[first.getMonth()]} – ${last.getDate()}. ${months[last.getMonth()]}`;
  }

  function toggleSlot(time: string) {
    const key = slotKey(selectedDay, time);
    setLocalSlots((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    setDirty(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await setAvailability({
        weekStart: currentWeekStart,
        slots: Array.from(localSlots),
      });
      setDirty(false);
    } catch (err) {
      Alert.alert('Lagring feilet', err instanceof Error ? err.message : 'Ukjent feil');
    } finally {
      setSaving(false);
    }
  }

  const loading = data === undefined;
  const selectedDaySlots = TIME_SLOTS.map((t) => ({
    time: t,
    available: localSlots.has(slotKey(selectedDay, t)),
  }));
  const availableCount = selectedDaySlots.filter((s) => s.available).length;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.titleBar}>
        <Heading variant="title">Tilgjengelighet</Heading>
      </View>

      <View style={[styles.weekNav, { backgroundColor: theme.surface }]}>
        <Pressable
          onPress={() => setWeekOffset((w) => w - 1)}
          hitSlop={12}
          style={({ pressed }) => [styles.navBtn, pressed && { opacity: 0.6 }]}>
          <Icon name="chevron-back" size={20} color={theme.text} />
        </Pressable>
        <Text style={[styles.weekLabel, { color: theme.text }]}>{weekLabel()}</Text>
        <Pressable
          onPress={() => setWeekOffset((w) => w + 1)}
          hitSlop={12}
          style={({ pressed }) => [styles.navBtn, pressed && { opacity: 0.6 }]}>
          <Icon name="chevron-forward" size={20} color={theme.text} />
        </Pressable>
      </View>

      <View style={[styles.dayStrip, { borderBottomColor: theme.divider }]}>
        {weekDays.map((day) => {
          const isSelected = day.toDateString() === selectedDay.toDateString();
          const isToday = day.toDateString() === today.toDateString();
          const isPast = day < today;
          const hasSlots = TIME_SLOTS.some((t) => localSlots.has(slotKey(day, t)));

          return (
            <Pressable
              key={day.toISOString()}
              onPress={() => setSelectedDay(day)}
              style={styles.dayBtn}>
              <Text
                style={[
                  styles.dayName,
                  { color: isSelected ? theme.accent : isPast ? theme.textMuted : theme.textSecondary },
                ]}>
                {DAY_SHORT[day.getDay()]}
              </Text>
              <View
                style={[
                  styles.dayCircle,
                  isSelected && { backgroundColor: theme.text },
                  isToday && !isSelected && { borderWidth: 1.5, borderColor: theme.text },
                ]}>
                <Text
                  style={[
                    styles.dayNum,
                    { color: isSelected ? theme.background : isPast ? theme.textMuted : theme.text },
                  ]}>
                  {day.getDate()}
                </Text>
              </View>
              {hasSlots && (
                <View style={[styles.dot, { backgroundColor: isSelected ? theme.accent : '#3D9970' }]} />
              )}
            </Pressable>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.slotsScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.slotsMeta}>
          <Text style={[styles.slotsDay, { color: theme.text }]}>
            {DAY_SHORT[selectedDay.getDay()]} {selectedDay.getDate()}.
          </Text>
          <Text style={[styles.slotsCount, { color: theme.textSecondary }]}>
            {availableCount} tilgjengelige timer
          </Text>
        </View>

        {loading ? (
          <View style={{ paddingVertical: Spacing.eight, alignItems: 'center' }}>
            <ActivityIndicator color={theme.textSecondary} />
          </View>
        ) : (
          <View style={styles.slotsGrid}>
            {selectedDaySlots.map(({ time, available }) => (
              <Pressable
                key={time}
                onPress={() => toggleSlot(time)}
                style={({ pressed }) => [
                  styles.slot,
                  {
                    backgroundColor: available ? theme.text : theme.surface,
                    borderColor: available ? theme.text : theme.surfaceMuted,
                  },
                  pressed && { opacity: 0.8 },
                ]}>
                <Text style={[styles.slotTime, { color: available ? theme.background : theme.textMuted }]}>
                  {time}
                </Text>
                {available && <Icon name="checkmark" size={13} color={theme.background} />}
              </Pressable>
            ))}
          </View>
        )}

        <Button
          label={!dirty ? '✓ Lagret' : saving ? 'Lagrer…' : 'Lagre tilgjengelighet'}
          variant={!dirty ? 'secondary' : 'dark'}
          size="lg"
          onPress={handleSave}
          loading={saving}
          disabled={!dirty || saving}
          style={{ marginTop: Spacing.four }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  titleBar: { paddingHorizontal: Spacing.four, paddingVertical: Spacing.three },
  weekNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: Spacing.four, marginBottom: Spacing.three,
    paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderRadius: Radius.lg,
  },
  navBtn: { padding: Spacing.two },
  weekLabel: { ...Typography.callout, fontWeight: '600' },
  dayStrip: {
    flexDirection: 'row', paddingHorizontal: Spacing.two, paddingBottom: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth, marginBottom: Spacing.four,
  },
  dayBtn: { flex: 1, alignItems: 'center', gap: 4 },
  dayName: { ...Typography.micro, fontWeight: '600' },
  dayCircle: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  dayNum: { ...Typography.callout, fontWeight: '600' },
  dot: { width: 5, height: 5, borderRadius: 2.5 },
  slotsScroll: { paddingHorizontal: Spacing.four, paddingBottom: Spacing.ten },
  slotsMeta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: Spacing.three,
  },
  slotsDay: { ...Typography.subhead, fontWeight: '600' },
  slotsCount: { ...Typography.caption },
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  slot: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: Spacing.three, paddingVertical: 10,
    borderRadius: Radius.md, borderWidth: 1,
    width: '30%', justifyContent: 'center',
  },
  slotTime: { ...Typography.callout, fontWeight: '500' },
});
