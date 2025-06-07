// lib/notificationService.ts
import messaging from '@react-native-firebase/messaging';
import { client } from './http';

export async function registerPushToken(userId: string) {
  try {
    const token = await messaging().getToken();
    console.log('Push token retrieved:', token);

    await client.post('/user/token', {
      uid: userId,
      fcm_token: token,
    });

    console.log('Push token registered with backend');
  } catch (err) {
    console.error('Failed to register push token:', err);
  }
}

export function listenForTokenRefresh(userId: string) {
  messaging().onTokenRefresh(async (newToken: string) => {
    console.log('Push token refreshed:', newToken);
    await client.post('/user/token', {
      uid: userId,
      fcm_token: newToken,
    });
  });
}
