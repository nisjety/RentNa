import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { OnboardingShell } from '@/components/onboarding/onboarding-shell';
import { RoleCard } from '@/components/onboarding/role-card';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useRoleStore } from '@/stores/role-store';

export default function OnboardingStep2Pro() {
  const router = useRouter();
  const theme = useTheme();
  const { completeOnboarding } = useRoleStore();
  const [showAgencyInfo, setShowAgencyInfo] = useState(false);

  void showAgencyInfo; // unused branch — agency now has its own workspace

  return (
    <OnboardingShell
      prompt="Hvordan jobber du?"
      helper="Renholdere kan også høre til ett eller flere byråer."
      showBack>
      <RoleCard
        icon="sparkles-outline"
        iconBgColor="#E2EAEF"
        title="Renholder"
        subtitle="Administrer jobber og kalender"
        onPress={() => {
          completeOnboarding('cleaner');
          router.replace('/pro');
        }}
      />
      <RoleCard
        icon="grid-outline"
        iconBgColor="#E5DFD2"
        title="Byrå"
        subtitle="Roster, bemanning og teamadministrasjon"
        onPress={() => {
          completeOnboarding('agency');
          router.replace('/agency');
        }}
      />
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  infoCard: {
    borderRadius: Radius.xl,
    padding: Spacing.five,
    alignItems: 'center',
    gap: Spacing.three,
  },
  infoIcon: {
    width: 64,
    height: 64,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  infoTitle: { ...Typography.subhead, fontWeight: '700', textAlign: 'center' },
  infoBody: { ...Typography.body, textAlign: 'center', lineHeight: 22 },
});
