import { useRouter } from 'expo-router';
import React from 'react';

import { OnboardingShell } from '@/components/onboarding/onboarding-shell';
import { RoleCard } from '@/components/onboarding/role-card';
import { useRoleStore } from '@/stores/role-store';

export default function OnboardingStep1() {
  const router = useRouter();
  const { completeOnboarding } = useRoleStore();

  return (
    <OnboardingShell
      prompt="Hvem er du i dag?"
      helper="Du kan bytte når som helst.">
      <RoleCard
        icon="home-outline"
        iconBgColor="#F1DD38"
        iconColor="#172713"
        title="Kunde"
        subtitle="Finn og bestill renhold"
        onPress={() => {
          completeOnboarding('customer');
          router.replace('/');
        }}
      />
      <RoleCard
        icon="briefcase-outline"
        iconBgColor="#D6CCBA"
        title="Jeg jobber i renhold"
        subtitle="Renholder eller byrå"
        onPress={() => router.push('/onboarding/pro')}
      />
    </OnboardingShell>
  );
}
