import { useAuth } from '@clerk/expo';
import { useMutation, useQuery } from 'convex/react';
import { format, isToday, isYesterday } from 'date-fns';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/avatar';
import { Icon } from '@/components/ui/icon';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api } from 'convex/_generated/api';
import type { Doc, Id } from 'convex/_generated/dataModel';

export default function ThreadScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { userId: clerkUserId } = useAuth();

  const threadId = id as Id<'threads'>;
  const thread = useQuery(api.threads.getById, id ? { threadId } : 'skip');
  const messages = useQuery(api.threads.listMessages, id ? { threadId } : 'skip');
  const sendMessage = useMutation(api.threads.sendMessage);
  const markRead = useMutation(api.threads.markRead);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList<ListItem>>(null);

  // Mark read on open + whenever new messages arrive
  useEffect(() => {
    if (!id) return;
    markRead({ threadId }).catch(() => null);
  }, [id, threadId, markRead, messages?.length]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (!messages || messages.length === 0) return;
    const t = setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    return () => clearTimeout(t);
  }, [messages?.length]);

  const headerTitle = thread?.cleanerShortName ?? 'Samtale';

  async function handleSend() {
    const text = draft.trim();
    if (!text || !id) return;
    setSending(true);
    try {
      await sendMessage({ threadId, text });
      setDraft('');
    } catch (err) {
      Alert.alert('Kunne ikke sende', err instanceof Error ? err.message : 'Ukjent feil');
    } finally {
      setSending(false);
    }
  }

  const items = useMemo(() => withDayDividers(messages ?? []), [messages]);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.divider }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}>
          <Icon name="chevron-back" size={24} color={theme.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Avatar initials={thread?.cleanerInitials ?? '..'} size={32} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerName, { color: theme.text }]} numberOfLines={1}>
              {headerTitle}
            </Text>
            {thread?.role === 'customer' && (
              <Text style={[styles.headerSub, { color: theme.textSecondary }]}>
                Renholder
              </Text>
            )}
            {thread?.role === 'cleaner' && (
              <Text style={[styles.headerSub, { color: theme.textSecondary }]}>
                Kunde
              </Text>
            )}
          </View>
        </View>
        <View style={{ width: 32 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        style={{ flex: 1 }}>
        {thread === undefined || messages === undefined ? (
          <View style={styles.center}>
            <ActivityIndicator color={theme.textSecondary} />
          </View>
        ) : thread === null ? (
          <View style={styles.center}>
            <Text style={{ color: theme.textSecondary }}>Samtalen ble ikke funnet.</Text>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={items}
            keyExtractor={(item) => item.kind === 'msg' ? item.message._id : `d-${item.label}`}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => {
              if (item.kind === 'divider') {
                return (
                  <View style={styles.dayDivider}>
                    <Text style={[styles.dayDividerText, { color: theme.textMuted }]}>
                      {item.label}
                    </Text>
                  </View>
                );
              }
              const isMine = clerkUserId === item.message.senderId;
              return <Bubble message={item.message} isMine={isMine} />;
            }}
            ListEmptyComponent={
              <View style={styles.emptyBlock}>
                <Icon name="chatbubble-outline" size={32} color={theme.textMuted} />
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                  Start samtalen — si hei!
                </Text>
              </View>
            }
          />
        )}

        <View style={[styles.composer, { borderTopColor: theme.divider }]}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Skriv en melding…"
            placeholderTextColor={theme.textMuted}
            multiline
            style={[styles.input, { backgroundColor: theme.surface, color: theme.text }]}
            maxLength={2000}
          />
          <Pressable
            onPress={handleSend}
            disabled={!draft.trim() || sending}
            hitSlop={8}
            style={({ pressed }) => [
              styles.sendBtn,
              {
                backgroundColor:
                  !draft.trim() || sending ? theme.surfaceMuted : theme.text,
              },
              pressed && { opacity: 0.7 },
            ]}>
            {sending ? (
              <ActivityIndicator size="small" color={theme.background} />
            ) : (
              <Icon
                name="arrow-up"
                size={18}
                color={!draft.trim() ? theme.textMuted : theme.background}
              />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Bubble({ message, isMine }: { message: Doc<'messages'>; isMine: boolean }) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.bubbleRow,
        { justifyContent: isMine ? 'flex-end' : 'flex-start' },
      ]}>
      <View
        style={[
          styles.bubble,
          isMine
            ? { backgroundColor: theme.text, borderBottomRightRadius: 4 }
            : { backgroundColor: theme.surface, borderBottomLeftRadius: 4 },
        ]}>
        <Text
          style={[
            styles.bubbleText,
            { color: isMine ? theme.background : theme.text },
          ]}
          selectable>
          {message.text}
        </Text>
        <Text
          style={[
            styles.bubbleTime,
            {
              color: isMine
                ? 'rgba(255,255,255,0.55)'
                : theme.textMuted,
            },
          ]}>
          {format(new Date(message.createdAt), 'HH:mm')}
        </Text>
      </View>
    </View>
  );
}

type ListItem =
  | { kind: 'msg'; message: Doc<'messages'> }
  | { kind: 'divider'; label: string };

function withDayDividers(messages: Doc<'messages'>[]): ListItem[] {
  const out: ListItem[] = [];
  let lastDay = '';
  for (const m of messages) {
    const date = new Date(m.createdAt);
    const dayKey = date.toDateString();
    if (dayKey !== lastDay) {
      out.push({ kind: 'divider', label: formatDay(date) });
      lastDay = dayKey;
    }
    out.push({ kind: 'msg', message: m });
  }
  return out;
}

function formatDay(d: Date): string {
  if (isToday(d)) return 'I dag';
  if (isYesterday(d)) return 'I går';
  return format(d, 'EEE d. MMM');
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerName: { ...Typography.bodyMedium, fontWeight: '700' },
  headerSub: { ...Typography.caption, marginTop: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: Spacing.three, paddingTop: Spacing.three, paddingBottom: Spacing.two, gap: 6 },
  dayDivider: { alignItems: 'center', paddingVertical: Spacing.two },
  dayDividerText: { ...Typography.micro, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase' },
  bubbleRow: { flexDirection: 'row', paddingHorizontal: 4, marginVertical: 2 },
  bubble: { maxWidth: '78%', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18 },
  bubbleText: { ...Typography.body, lineHeight: 20 },
  bubbleTime: { ...Typography.micro, marginTop: 2, alignSelf: 'flex-end' },
  emptyBlock: { paddingTop: Spacing.eight, alignItems: 'center', gap: Spacing.two },
  emptyText: { ...Typography.callout },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    ...Typography.body,
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radius.lg,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
