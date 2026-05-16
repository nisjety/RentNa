import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/ui/avatar';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { CleanerReview } from '@/data/mock-cleaners';

interface Props {
  review: CleanerReview;
}

export function ReviewCard({ review }: Props) {
  const theme = useTheme();
  const fullStars = Math.floor(review.rating);
  const hasHalf = review.rating - fullStars >= 0.25 && review.rating - fullStars < 0.75;
  const stars = Array.from({ length: 5 }, (_, i) => i);

  return (
    <View style={[styles.card, { backgroundColor: theme.surface }]}>
      <Text style={[styles.text, { color: theme.text }]}>{review.text}</Text>
      <View style={styles.footer}>
        <View style={styles.left}>
          <View style={styles.starsRow}>
            {stars.map((i) => {
              const filled = i < fullStars;
              const half = i === fullStars && hasHalf;
              return (
                <Ionicons
                  key={i}
                  name={filled ? 'star' : half ? 'star-half' : 'star-outline'}
                  size={13}
                  color="#F1DD38"
                />
              );
            })}
            <Text style={[styles.rating, { color: theme.text }]}>{review.rating.toFixed(1)}</Text>
          </View>
          <Text style={[styles.author, { color: theme.textSecondary }]}>{review.authorName}</Text>
        </View>
        <Avatar
          uri={review.authorAvatarUrl}
          initials={review.authorName[0]}
          size={36}
          tone="taupe"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.four,
    borderRadius: Radius.lg,
    gap: Spacing.three,
  },
  text: { ...Typography.body },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: { gap: 4, flex: 1 },
  starsRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rating: { ...Typography.callout, fontWeight: '600', marginLeft: 4 },
  author: { ...Typography.caption },
});
