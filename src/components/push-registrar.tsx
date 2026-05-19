import { useUser } from '@clerk/expo';
import { useMutation, useQuery } from 'convex/react';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { useRoleStore } from '@/stores/role-store';
import { api } from 'convex/_generated/api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Mounted once inside the auth-protected layout. Registers the device's
 * Expo push token with Convex once the user is signed in. Re-runs if the
 * user's active role flips (so we tag the token with the right slug).
 */
export function PushRegistrar() {
  const { isSignedIn } = useUser();
  const { activeRole } = useRoleStore();
  const cleanerProfile = useQuery(
    api.cleanerPro.getMyProfile,
    activeRole === 'cleaner' ? {} : 'skip',
  );
  const registerToken = useMutation(api.notificationsQueries.registerToken);

  useEffect(() => {
    if (!isSignedIn) return;
    if (!Device.isDevice) return; // simulator can't get a real token

    let cancelled = false;

    (async () => {
      const settings = await Notifications.getPermissionsAsync();
      let status = settings.status;
      if (status !== 'granted') {
        const req = await Notifications.requestPermissionsAsync();
        status = req.status;
      }
      if (status !== 'granted') return;

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.HIGH,
          sound: 'default',
        });
      }

      try {
        const tokenRes = await Notifications.getExpoPushTokenAsync();
        if (cancelled) return;
        await registerToken({
          token: tokenRes.data,
          platform: Platform.OS,
          cleanerSlug:
            activeRole === 'cleaner' ? cleanerProfile?.profile?.cleanerSlug : undefined,
        });
      } catch (err) {
        console.warn('Push token register failed:', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isSignedIn, activeRole, cleanerProfile?.profile?.cleanerSlug, registerToken]);

  return null;
}
