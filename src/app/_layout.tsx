import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { CartProvider } from '../cartContext';
import { ProfileProvider, useProfile } from '../profileContext';

function Gate() {
  const { session, loading } = useProfile();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const onLogin = segments[0] === 'login';
    if (!session && !onLogin) router.replace('/login' as any);
    if (session && onLogin) router.replace('/' as any);
  }, [session, loading, segments]);

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="cook/[id]" options={{ title: 'Cook' }} />
      <Stack.Screen name="cart" options={{ title: 'Your Cart' }} />
      <Stack.Screen name="profile" options={{ title: 'My Profile' }} />
      <Stack.Screen name="cook-home" options={{ headerShown: false }} />
      <Stack.Screen name="orders" options={{ title: 'My Orders' }} />
      <Stack.Screen name="cook-orders" options={{ title: 'Orders' }} />
      <Stack.Screen name="rate" options={{ title: 'Rate your meal' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ProfileProvider>
      <CartProvider>
        <Gate />
      </CartProvider>
    </ProfileProvider>
  );
}