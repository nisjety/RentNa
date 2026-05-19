import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const DAY_HEADERS = ['M', 'T', 'O', 'T', 'F', 'L', 'S'];
const MONTH_NAMES = [
  'Januar', 'Februar', 'Mars', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Desember',
];

interface AirbnbCalendarProps {
  selected: Date | null;
  onSelect: (date: Date) => void;
  monthsAhead?: number;
  minDate?: Date;
  style?: ViewStyle;
}

interface MonthData {
  year: number;
  month: number;
  weeks: (Date | null)[][];
}

function buildMonth(year: number, month: number): MonthData {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  // Adjust so Monday = 0
  let dayOffset = firstDay.getDay() - 1;
  if (dayOffset < 0) dayOffset = 6;

  const weeks: (Date | null)[][] = [];
  let week: (Date | null)[] = Array(dayOffset).fill(null);

  for (let day = 1; day <= lastDay.getDate(); day++) {
    week.push(new Date(year, month, day));
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }

  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }

  return { year, month, weeks };
}

export function AirbnbCalendar({
  selected,
  onSelect,
  monthsAhead = 6,
  minDate,
  style,
}: AirbnbCalendarProps) {
  const theme = useTheme();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const earliest = minDate ?? today;

  const months: MonthData[] = useMemo(() => {
    const list: MonthData[] = [];
    const startYear = today.getFullYear();
    const startMonth = today.getMonth();
    for (let i = 0; i < monthsAhead; i++) {
      const m = startMonth + i;
      const year = startYear + Math.floor(m / 12);
      const month = m % 12;
      list.push(buildMonth(year, month));
    }
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthsAhead]);

  return (
    <ScrollView
      style={[styles.root, style]}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scroll}>
      {/* Sticky weekday header */}
      <View style={[styles.headerRow, { backgroundColor: theme.background }]}>
        {DAY_HEADERS.map((d, idx) => (
          <View key={`${d}-${idx}`} style={styles.headerCell}>
            <Text style={[styles.headerText, { color: theme.textMuted }]}>{d}</Text>
          </View>
        ))}
      </View>

      {months.map((m) => (
        <View key={`${m.year}-${m.month}`} style={styles.monthBlock}>
          <Text style={[styles.monthTitle, { color: theme.text }]}>
            {MONTH_NAMES[m.month]} {m.year}
          </Text>

          {m.weeks.map((week, wi) => (
            <View key={wi} style={styles.weekRow}>
              {week.map((date, di) => {
                if (!date) return <View key={di} style={styles.dayCell} />;

                const isPast = date < earliest;
                const isToday = date.toDateString() === today.toDateString();
                const isSelected =
                  selected !== null && date.toDateString() === selected.toDateString();

                return (
                  <Pressable
                    key={di}
                    onPress={() => !isPast && onSelect(date)}
                    disabled={isPast}
                    style={({ pressed }) => [
                      styles.dayCell,
                      isSelected && [styles.dayCellSelected, { backgroundColor: theme.text }],
                      pressed && !isPast && { opacity: 0.7 },
                    ]}>
                    <Text
                      style={[
                        styles.dayNumber,
                        {
                          color: isSelected
                            ? theme.background
                            : isPast
                            ? theme.textMuted
                            : theme.text,
                          fontWeight: isSelected || isToday ? '700' : '400',
                          textDecorationLine: isPast ? 'line-through' : 'none',
                        },
                      ]}>
                      {date.getDate()}
                    </Text>
                    {isToday && !isSelected && (
                      <View style={[styles.todayDot, { backgroundColor: theme.text }]} />
                    )}
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingBottom: Spacing.eight },
  headerRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.06)',
    marginBottom: Spacing.three,
  },
  headerCell: { flex: 1, alignItems: 'center' },
  headerText: { ...Typography.caption, fontWeight: '600', letterSpacing: 0.4 },
  monthBlock: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.five,
  },
  monthTitle: { ...Typography.subhead, fontWeight: '700', marginBottom: Spacing.three },
  weekRow: { flexDirection: 'row' },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dayCellSelected: {
    borderRadius: 999,
  },
  dayNumber: { ...Typography.body, fontVariant: ['tabular-nums'] },
  todayDot: {
    position: 'absolute',
    bottom: 6,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
