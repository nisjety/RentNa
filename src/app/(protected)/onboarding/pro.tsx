import { useRouter } from 'expo-router';
import React from 'react';

import { OnboardingShell } from '@/components/onboarding/onboarding-shell';
import { RoleCard } from '@/components/onboarding/role-card';
import { useRoleStore } from '@/stores/role-store';

export default function OnboardingStep2Pro() {
  const router = useRouter();
  const { completeOnboarding } = useRoleStore();

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
          router.replace('/role-stub');
        }}
      />
      <RoleCard
        icon="grid-outline"
        iconBgColor="#E5DFD2"
        title="Byrå"
        subtitle="Roster og bemanning"
        onPress={() => {
          completeOnboarding('agency');
          router.replace('/role-stub');
        }}
      />
    </OnboardingShell>
  );
}
