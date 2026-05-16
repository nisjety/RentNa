import { useOAuth } from '@clerk/expo';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect } from 'react';
import { Alert, Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

interface Props {
  onComplete?: () => void;
}

export function GoogleSignInButton({ onComplete }: Props) {
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);

  const handlePress = async () => {
    try {
      const { createdSessionId, setActive } = await startOAuthFlow({
        redirectUrl: Linking.createURL('/', { scheme: 'rentna' }),
      });
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        onComplete ? onComplete() : router.replace('/');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Google sign-in failed');
    }
  };

  return (
    <View style={styles.wrapper}>
      <Pressable
        style={({ pressed }) => [
          styles.button,
          isDark ? styles.buttonDark : styles.buttonLight,
          pressed && styles.pressed,
        ]}
        onPress={handlePress}
        accessibilityLabel="Continue with Google"
        accessibilityRole="button">
        <Text style={[styles.label, isDark ? styles.labelDark : styles.labelLight]}>
          Continue with Google
        </Text>
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
    borderWidth: 1,
  },
  buttonLight: {
    backgroundColor: '#ffffff',
    borderColor: '#D1D5DB',
  },
  buttonDark: {
    backgroundColor: '#1C1C1E',
    borderColor: '#3A3A3C',
  },
  pressed: {
    opacity: 0.75,
  },
  label: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.4,
  },
  labelLight: {
    color: '#000000',
  },
  labelDark: {
    color: '#ffffff',
  },
});
