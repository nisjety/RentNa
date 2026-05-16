/**
 * Vipps authentication — placeholder for future implementation.
 * Vipps uses OIDC/OAuth 2.0. Wire up once Clerk adds Vipps as a social provider
 * or implement a custom OAuth strategy via useOAuth({ strategy: 'oauth_custom_vipps' }).
 * Docs: https://developer.vippsmobilepay.com/docs/APIs/login-api/
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface Props {
  onComplete?: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function VippsSignInButton({ onComplete }: Props) {
  return (
    <View style={styles.wrapper}>
      <Pressable
        style={[styles.button, styles.disabled]}
        disabled
        accessibilityLabel="Continue with Vipps (coming soon)"
        accessibilityRole="button"
        accessibilityState={{ disabled: true }}>
        <Text style={styles.label}>Continue with Vipps</Text>
        <Text style={styles.badge}>Coming soon</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  button: {
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    backgroundColor: '#FF5B24',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  disabled: {
    opacity: 0.4,
  },
  label: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.4,
  },
  badge: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
});
