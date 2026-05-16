import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Radius, Spacing, Typography } from '@/constants/theme';
import {
  getCleanerById,
  SERVICE_LABEL,
  type CleanerService,
} from '@/data/mock-cleaners';
import { useTheme } from '@/hooks/use-theme';

// ─── Types & constants ────────────────────────────────────────────────────────

type Frequency = 'once' | 'weekly' | 'biweekly' | 'monthly';

const SERVICE_DURATION: Record<CleanerService, number> = {
  regular: 2.5,
  deep: 4,
  move: 5,
  office: 3,
  windows: 1.5,
};

const SERVICE_DESC: Record<CleanerService, string> = {
  regular: 'Støvsuging, mopping og overflater',
  deep: 'Grundig vask av alle rom inkl. kjøkken',
  move: 'Totalvask ved inn- eller utflytting',
  office: 'Profesjonell rengjøring av kontor',
  windows: 'Vindusvask inn- og utvendig',
};

const FREQUENCY_OPTS: {
  key: Frequency;
  label: string;
  sub: string;
  discount: number;
}[] = [
  { key: 'once', label: 'Én gang', sub: 'Engangsbestilling', discount: 0 },
  { key: 'weekly', label: 'Hver uke', sub: 'Spar 10 %', discount: 0.1 },
  { key: 'biweekly', label: 'Annenhver uke', sub: 'Spar 7 %', discount: 0.07 },
  { key: 'monthly', label: 'Hver måned', sub: 'Spar 5 %', discount: 0.05 },
];

const STEPS = ['Tjeneste', 'Dato & tid', 'Hyppighet', 'Sammendrag'];
const DAY_SHORT = ['Søn', 'Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør'];
const MONTH_SHORT = [
  'jan', 'feb', 'mar', 'apr', 'mai', 'jun',
  'jul', 'aug', 'sep', 'okt', 'nov', 'des',
];

function getAvailableSlots(date: Date): string[] {
  const dow = date.getDay();
  if (dow === 0) return ['10:00', '13:00'];
  if (dow === 6) return ['09:00', '11:00', '14:00'];
  return ['08:00', '09:00', '11:00', '13:00', '14:00', '15:00'];
}

function fmtDate(d: Date): string {
  return `${DAY_SHORT[d.getDay()]} ${d.getDate()}. ${MONTH_SHORT[d.getMonth()]}`;
}

function fmtKr(kr: number): string {
  return kr.toLocaleString('nb-NO') + ' kr';
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function BookScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const scrollRef = useRef<ScrollView>(null);

  const cleaner = id ? getCleanerById(id) : undefined;

  const [step, setStep] = useState(0);
  const [service, setService] = useState<CleanerService>(
    cleaner?.services[0] ?? 'regular',
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [frequency, setFrequency] = useState<Frequency>('once');
  const [confirmed, setConfirmed] = useState(false);

  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + 1 + i);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const duration = SERVICE_DURATION[service];
  const basePrice = Math.round(duration * (cleaner?.hourlyRateKr ?? 380));
  const discountPct = FREQUENCY_OPTS.find((f) => f.key === frequency)?.discount ?? 0;
  const savings = Math.round(basePrice * discountPct);
  const totalPrice = basePrice - savings;

  const canContinue =
    step === 1 ? selectedDate !== null && selectedTime !== null : true;

  function goNext() {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    } else {
      setConfirmed(true);
    }
  }

  function goBack() {
    if (step > 0) {
      setStep((s) => s - 1);
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    } else {
      router.back();
    }
  }

  if (!cleaner) {
    return (
      <SafeAreaView
        style={[styles.notFound, { backgroundColor: theme.background }]}
        edges={['top', 'bottom']}>
        <Text style={{ color: theme.textSecondary }}>Fant ikke renholderen.</Text>
        <Button label="Tilbake" variant="ghost" onPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  // ── Success state ──────────────────────────────────────────────────────────
  if (confirmed) {
    const refNum = `RN-${new Date().getFullYear()}-${String(1000 + (cleaner.id.charCodeAt(3) % 9000)).padStart(4, '0')}`;
    return (
      <SafeAreaView
        style={[styles.successRoot, { backgroundColor: theme.background }]}
        edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.successContent} showsVerticalScrollIndicator={false}>
          <View style={[styles.successCircle, { backgroundColor: '#3D9970' + '22' }]}>
            <Icon name="checkmark" size={44} color="#3D9970" />
          </View>
          <Text style={[styles.successTitle, { color: theme.text }]}>Bestilling sendt!</Text>
          <Text style={[styles.successSub, { color: theme.textSecondary }]}>
            {cleaner.shortName.replace('.', '')} bekrefter innen kort tid.{'\n'}Du får varsel på SMS og e-post.
          </Text>

          <View style={[styles.refChip, { backgroundColor: theme.surfaceMuted }]}>
            <Text style={[styles.refLabel, { color: theme.textSecondary }]}>Referanse</Text>
            <Text style={[styles.refNum, { color: theme.text }]}>#{refNum}</Text>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: theme.surface }]}>
            <SummaryRow icon="person-outline" label={cleaner.name} value={`${cleaner.hourlyRateKr} kr/t`} />
            <SummaryRow
              icon="briefcase-outline"
              label={SERVICE_LABEL[service]}
              value={`${duration}t`}
            />
            {selectedDate && selectedTime && (
              <SummaryRow
                icon="calendar-outline"
                label={fmtDate(selectedDate)}
                value={selectedTime}
              />
            )}
            <SummaryRow
              icon="refresh-outline"
              label={FREQUENCY_OPTS.find((f) => f.key === frequency)?.label ?? 'Én gang'}
              value={savings > 0 ? `−${fmtKr(savings)}` : undefined}
              valueAccent={savings > 0}
            />
            <View style={[styles.divider, { backgroundColor: theme.divider }]} />
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: theme.textSecondary }]}>Totalt</Text>
              <Text style={[styles.totalAmt, { color: theme.text }]}>{fmtKr(totalPrice)}</Text>
            </View>
          </View>
        </ScrollView>

        <View style={[styles.successFooter, { backgroundColor: theme.background }]}>
          <Button
            label="Tilbake til hjem"
            variant="primary"
            size="lg"
            onPress={() => router.replace('/')}
          />
          <Button
            label="Se mine bestillinger"
            variant="ghost"
            size="md"
            onPress={() => router.replace('/bookings')}
          />
        </View>
      </SafeAreaView>
    );
  }

  // ── Wizard ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={goBack}
          hitSlop={12}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}>
          <Icon name="chevron-back" size={26} color={theme.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Bestill {cleaner.shortName.replace('.', '')}
          </Text>
          <Text style={[styles.headerSub, { color: theme.textSecondary }]}>{STEPS[step]}</Text>
        </View>
        <Avatar initials={cleaner.initials} size={36} tone="taupe" />
      </View>

      {/* Progress bar */}
      <View style={styles.progressRow}>
        {STEPS.map((_, i) => (
          <View
            key={i}
            style={[
              styles.progressSeg,
              {
                backgroundColor:
                  i < step ? theme.text : i === step ? theme.accent : theme.surfaceMuted,
                flex: i === step ? 2 : 1,
              },
            ]}
          />
        ))}
      </View>

      {/* Step content */}
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {step === 0 && (
          <StepService
            services={cleaner.services}
            selected={service}
            onSelect={setService}
            hourlyRate={cleaner.hourlyRateKr}
          />
        )}
        {step === 1 && (
          <StepDateTime
            dates={dates}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            onSelectDate={(d) => { setSelectedDate(d); setSelectedTime(null); }}
            onSelectTime={setSelectedTime}
          />
        )}
        {step === 2 && (
          <StepFrequency
            selected={frequency}
            onSelect={setFrequency}
            basePrice={basePrice}
          />
        )}
        {step === 3 && (
          <StepSummary
            cleaner={cleaner}
            service={service}
            duration={duration}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            frequency={frequency}
            basePrice={basePrice}
            savings={savings}
            totalPrice={totalPrice}
          />
        )}
      </ScrollView>

      {/* Footer */}
      <SafeAreaView edges={['bottom']} style={[styles.footer, { backgroundColor: theme.background }]}>
        <View style={styles.footerRow}>
          {step > 0 && (
            <Pressable
              onPress={goBack}
              style={({ pressed }) => [
                styles.backTextBtn,
                { backgroundColor: theme.surfaceMuted },
                pressed && { opacity: 0.7 },
              ]}>
              <Text style={[styles.backTextLabel, { color: theme.text }]}>Tilbake</Text>
            </Pressable>
          )}
          <View style={{ flex: 1 }}>
            <Button
              label={
                step === STEPS.length - 1
                  ? 'Bekreft bestilling'
                  : step === 1 && !canContinue
                    ? selectedDate
                      ? 'Velg tidspunkt'
                      : 'Velg dato'
                    : 'Fortsett'
              }
              variant={canContinue ? 'primary' : 'secondary'}
              size="lg"
              onPress={canContinue ? goNext : undefined}
            />
          </View>
        </View>
      </SafeAreaView>
    </SafeAreaView>
  );
}

// ─── Step components ─────────────────────────────────────────────────────────

function StepService({
  services,
  selected,
  onSelect,
  hourlyRate,
}: {
  services: CleanerService[];
  selected: CleanerService;
  onSelect: (s: CleanerService) => void;
  hourlyRate: number;
}) {
  const theme = useTheme();
  return (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepHint, { color: theme.textSecondary }]}>
        Velg hvilken type rengjøring du trenger
      </Text>
      {services.map((s) => {
        const isSelected = s === selected;
        const dur = SERVICE_DURATION[s];
        const price = Math.round(dur * hourlyRate);
        return (
          <Pressable
            key={s}
            onPress={() => onSelect(s)}
            style={({ pressed }) => [
              styles.serviceCard,
              {
                backgroundColor: isSelected ? theme.text : theme.surface,
                borderColor: isSelected ? theme.text : theme.surfaceMuted,
              },
              pressed && { opacity: 0.85 },
            ]}>
            <View style={styles.serviceCardTop}>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.serviceCardName,
                    { color: isSelected ? theme.background : theme.text },
                  ]}>
                  {SERVICE_LABEL[s]}
                </Text>
                <Text
                  style={[
                    styles.serviceCardDesc,
                    { color: isSelected ? theme.surfaceMuted : theme.textSecondary },
                  ]}>
                  {SERVICE_DESC[s]}
                </Text>
              </View>
              {isSelected && (
                <View style={[styles.serviceCheck, { backgroundColor: theme.accent }]}>
                  <Icon name="checkmark" size={14} color={theme.accentText} />
                </View>
              )}
            </View>
            <View style={styles.serviceCardBottom}>
              <View
                style={[
                  styles.durationChip,
                  {
                    backgroundColor: isSelected
                      ? 'rgba(255,255,255,0.15)'
                      : theme.surfaceMuted,
                  },
                ]}>
                <Icon
                  name="time-outline"
                  size={12}
                  color={isSelected ? theme.background : theme.textSecondary}
                />
                <Text
                  style={[
                    styles.durationText,
                    { color: isSelected ? theme.background : theme.textSecondary },
                  ]}>
                  Ca. {dur}t
                </Text>
              </View>
              <Text
                style={[
                  styles.servicePrice,
                  { color: isSelected ? theme.accent : theme.text },
                ]}>
                Fra {fmtKr(price)}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

function StepDateTime({
  dates,
  selectedDate,
  selectedTime,
  onSelectDate,
  onSelectTime,
}: {
  dates: Date[];
  selectedDate: Date | null;
  selectedTime: string | null;
  onSelectDate: (d: Date) => void;
  onSelectTime: (t: string) => void;
}) {
  const theme = useTheme();
  const availableSlots = selectedDate ? getAvailableSlots(selectedDate) : [];

  return (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepSectionTitle, { color: theme.text }]}>Velg dato</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dateScroll}>
        {dates.map((d) => {
          const isSelected =
            selectedDate !== null && d.toDateString() === selectedDate.toDateString();
          return (
            <Pressable
              key={d.toISOString()}
              onPress={() => onSelectDate(d)}
              style={({ pressed }) => [
                styles.dateChip,
                {
                  backgroundColor: isSelected ? theme.text : theme.surface,
                  borderColor: isSelected ? theme.text : theme.surfaceMuted,
                },
                pressed && { opacity: 0.8 },
              ]}>
              <Text
                style={[
                  styles.dateDayName,
                  { color: isSelected ? theme.surfaceMuted : theme.textSecondary },
                ]}>
                {DAY_SHORT[d.getDay()]}
              </Text>
              <Text
                style={[
                  styles.dateDayNum,
                  { color: isSelected ? theme.background : theme.text },
                ]}>
                {d.getDate()}
              </Text>
              <Text
                style={[
                  styles.dateMonth,
                  { color: isSelected ? theme.surfaceMuted : theme.textMuted },
                ]}>
                {MONTH_SHORT[d.getMonth()]}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {selectedDate && (
        <>
          <Text style={[styles.stepSectionTitle, { color: theme.text, marginTop: Spacing.five }]}>
            Tidspunkter · {fmtDate(selectedDate)}
          </Text>
          <View style={styles.slotsGrid}>
            {availableSlots.map((t) => {
              const isSelected = t === selectedTime;
              return (
                <Pressable
                  key={t}
                  onPress={() => onSelectTime(t)}
                  style={({ pressed }) => [
                    styles.slotChip,
                    {
                      backgroundColor: isSelected ? theme.text : theme.surface,
                      borderColor: isSelected ? theme.text : theme.surfaceMuted,
                    },
                    pressed && { opacity: 0.8 },
                  ]}>
                  <Text
                    style={[
                      styles.slotTime,
                      { color: isSelected ? theme.background : theme.text },
                    ]}>
                    {t}
                  </Text>
                  {isSelected && (
                    <Icon name="checkmark" size={12} color={theme.background} />
                  )}
                </Pressable>
              );
            })}
          </View>
        </>
      )}
    </View>
  );
}

function StepFrequency({
  selected,
  onSelect,
  basePrice,
}: {
  selected: Frequency;
  onSelect: (f: Frequency) => void;
  basePrice: number;
}) {
  const theme = useTheme();
  return (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepHint, { color: theme.textSecondary }]}>
        Velg hyppighet og spar med fast abonnement
      </Text>
      {FREQUENCY_OPTS.map((opt) => {
        const isSelected = opt.key === selected;
        const discountedPrice = Math.round(basePrice * (1 - opt.discount));
        return (
          <Pressable
            key={opt.key}
            onPress={() => onSelect(opt.key)}
            style={({ pressed }) => [
              styles.freqCard,
              {
                backgroundColor: isSelected ? theme.text : theme.surface,
                borderColor: isSelected ? theme.text : theme.surfaceMuted,
              },
              pressed && { opacity: 0.85 },
            ]}>
            <View
              style={[
                styles.freqRadio,
                {
                  borderColor: isSelected ? theme.accent : theme.textMuted,
                  backgroundColor: isSelected ? theme.accent : 'transparent',
                },
              ]}>
              {isSelected && <View style={styles.freqRadioDot} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.freqLabel,
                  { color: isSelected ? theme.background : theme.text },
                ]}>
                {opt.label}
              </Text>
              <Text
                style={[
                  styles.freqSub,
                  { color: isSelected ? theme.surfaceMuted : theme.textSecondary },
                ]}>
                {opt.sub}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text
                style={[
                  styles.freqPrice,
                  { color: isSelected ? theme.accent : theme.text },
                ]}>
                {fmtKr(discountedPrice)}
              </Text>
              {opt.discount > 0 && (
                <Text
                  style={[
                    styles.freqOrigPrice,
                    { color: isSelected ? theme.surfaceMuted : theme.textMuted },
                  ]}>
                  {fmtKr(basePrice)}
                </Text>
              )}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

function StepSummary({
  cleaner,
  service,
  duration,
  selectedDate,
  selectedTime,
  frequency,
  basePrice,
  savings,
  totalPrice,
}: {
  cleaner: ReturnType<typeof getCleanerById>;
  service: CleanerService;
  duration: number;
  selectedDate: Date | null;
  selectedTime: string | null;
  frequency: Frequency;
  basePrice: number;
  savings: number;
  totalPrice: number;
}) {
  const theme = useTheme();
  if (!cleaner) return null;
  const freqOpt = FREQUENCY_OPTS.find((f) => f.key === frequency)!;

  return (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepHint, { color: theme.textSecondary }]}>
        Gjennomgå bestillingen din
      </Text>

      {/* Cleaner mini-card */}
      <View style={[styles.cleanerMini, { backgroundColor: theme.surface }]}>
        <Avatar initials={cleaner.initials} size={44} tone="taupe" />
        <View style={{ flex: 1 }}>
          <Text style={[styles.cleanerMiniName, { color: theme.text }]}>{cleaner.name}</Text>
          <Text style={[styles.cleanerMiniSub, { color: theme.textSecondary }]}>
            {cleaner.area} · {cleaner.hourlyRateKr} kr/t
          </Text>
        </View>
        <View style={styles.ratingRow}>
          <Icon name="star" size={13} color={theme.accent} />
          <Text style={[styles.ratingText, { color: theme.text }]}>
            {cleaner.rating.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Details */}
      <View style={[styles.summaryCard, { backgroundColor: theme.surface }]}>
        <SummaryRow
          icon="briefcase-outline"
          label="Tjeneste"
          value={`${SERVICE_LABEL[service]} · ${duration}t`}
        />
        {selectedDate && selectedTime ? (
          <SummaryRow
            icon="calendar-outline"
            label="Dato & tid"
            value={`${fmtDate(selectedDate)} · ${selectedTime}`}
          />
        ) : (
          <SummaryRow icon="calendar-outline" label="Dato & tid" value="Ikke valgt" />
        )}
        <SummaryRow icon="refresh-outline" label="Hyppighet" value={freqOpt.label} />
        <View style={[styles.divider, { backgroundColor: theme.divider }]} />
        <SummaryRow icon="cash-outline" label="Grunnpris" value={fmtKr(basePrice)} />
        {savings > 0 && (
          <SummaryRow
            icon="pricetag-outline"
            label={`Rabatt (${Math.round(freqOpt.discount * 100)} %)`}
            value={`−${fmtKr(savings)}`}
            valueAccent
          />
        )}
        <View style={[styles.divider, { backgroundColor: theme.divider }]} />
        <View style={styles.totalRow}>
          <Text style={[styles.totalLabel, { color: theme.text }]}>Totalt</Text>
          <Text style={[styles.totalAmt, { color: theme.text }]}>{fmtKr(totalPrice)}</Text>
        </View>
      </View>

      <Text style={[styles.disclaimer, { color: theme.textMuted }]}>
        Betaling skjer etter fullført vask via Vipps eller kort. Avbestilling er gratis inntil 24 timer før.
      </Text>
    </View>
  );
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function SummaryRow({
  icon,
  label,
  value,
  valueAccent,
}: {
  icon: React.ComponentProps<typeof Icon>['name'];
  label: string;
  value?: string;
  valueAccent?: boolean;
}) {
  const theme = useTheme();
  return (
    <View style={styles.summaryRow}>
      <Icon name={icon} size={16} color={theme.textSecondary} />
      <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>{label}</Text>
      {value && (
        <Text
          style={[
            styles.summaryValue,
            { color: valueAccent ? '#3D9970' : theme.text },
          ]}>
          {value}
        </Text>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  backBtn: { width: 36, alignItems: 'center' },
  headerTitle: { ...Typography.subhead, fontWeight: '700' },
  headerSub: { ...Typography.caption, marginTop: 2 },

  progressRow: {
    flexDirection: 'row',
    gap: 3,
    paddingHorizontal: Spacing.four,
    marginBottom: Spacing.four,
    height: 4,
  },
  progressSeg: { borderRadius: Radius.pill, height: 4 },

  scroll: { paddingBottom: Spacing.twelve },

  stepContainer: { paddingHorizontal: Spacing.four, gap: Spacing.three },
  stepHint: { ...Typography.body, marginBottom: Spacing.one },
  stepSectionTitle: { ...Typography.subhead, fontWeight: '600', marginBottom: Spacing.two },

  // Service cards
  serviceCard: {
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  serviceCardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.three },
  serviceCardName: { ...Typography.subhead, fontWeight: '600' },
  serviceCardDesc: { ...Typography.caption, marginTop: 2 },
  serviceCheck: {
    width: 26,
    height: 26,
    borderRadius: Radius.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceCardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  durationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  durationText: { ...Typography.micro },
  servicePrice: { ...Typography.callout, fontWeight: '700' },

  // Date chips
  dateScroll: { gap: Spacing.two, paddingBottom: Spacing.one },
  dateChip: {
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    minWidth: 52,
    gap: 2,
  },
  dateDayName: { ...Typography.micro },
  dateDayNum: { ...Typography.subhead, fontWeight: '700' },
  dateMonth: { ...Typography.micro },

  // Time slots
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  slotChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    width: '30%',
    justifyContent: 'center',
  },
  slotTime: { ...Typography.callout, fontWeight: '500' },

  // Frequency cards
  freqCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
  },
  freqRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  freqRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#172713',
  },
  freqLabel: { ...Typography.bodyMedium },
  freqSub: { ...Typography.caption, marginTop: 2 },
  freqPrice: { ...Typography.callout, fontWeight: '700' },
  freqOrigPrice: { ...Typography.micro, textDecorationLine: 'line-through', marginTop: 2 },

  // Summary
  cleanerMini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
    borderRadius: Radius.lg,
  },
  cleanerMiniName: { ...Typography.bodyMedium, fontWeight: '600' },
  cleanerMiniSub: { ...Typography.caption, marginTop: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { ...Typography.callout, fontWeight: '600' },

  summaryCard: { borderRadius: Radius.lg, overflow: 'hidden', gap: 1 },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingVertical: 13,
  },
  summaryLabel: { ...Typography.body, flex: 1 },
  summaryValue: { ...Typography.body, fontWeight: '500' },
  divider: { height: StyleSheet.hairlineWidth },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
  },
  totalLabel: { ...Typography.subhead, fontWeight: '600' },
  totalAmt: { ...Typography.headline, fontWeight: '700' },

  disclaimer: {
    ...Typography.caption,
    lineHeight: 18,
    textAlign: 'center',
    paddingHorizontal: Spacing.four,
  },

  // Footer
  footer: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  backTextBtn: {
    paddingHorizontal: Spacing.four,
    paddingVertical: 18,
    borderRadius: Radius.lg,
  },
  backTextLabel: { ...Typography.bodyMedium, fontWeight: '600' },

  // Success
  successRoot: { flex: 1 },
  successContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.ten,
    paddingBottom: Spacing.ten,
    gap: Spacing.four,
  },
  successCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  successTitle: { ...Typography.title, fontWeight: '700', textAlign: 'center' },
  successSub: { ...Typography.body, textAlign: 'center', lineHeight: 22 },
  refChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
  },
  refLabel: { ...Typography.caption },
  refNum: { ...Typography.callout, fontWeight: '700' },
  successFooter: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.four,
    gap: Spacing.two,
  },
});
