import { useSignInWithApple } from '@clerk/expo/apple';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

interface Props {
  onComplete?: () => void;
}

export function AppleSignInButton({ onComplete }: Props) {
  const { startAppleAuthenticationFlow } = useSignInWithApple();
  const router = useRouter();

  if (Platform.OS !== 'ios') return null;

  const handlePress = async () => {
    try {
      const { createdSessionId, setActive } = await startAppleAuthenticationFlow();
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        onComplete ? onComplete() : router.replace('/');
      }
    } catch (err: any) {
      if (err.code === 'ERR_REQUEST_CANCELED') return;
      Alert.alert('Error', err.message ?? 'Apple sign-in failed');
    }
  };

  return (
    <View style={styles.wrapper}>
      <Pressable
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        onPress={handlePress}
        accessibilityLabel="Continue with Apple"
        accessibilityRole="button">
        <Text style={styles.label}>Continue with Apple</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  button: {
    backgroundColor: '#000000',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.75,
  },
  label: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.4,
  },
});
