import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useProfile } from '../profileContext';
import { supabase } from '../supabase';
import { colors } from '../theme';

const labels: Record<string, string> = {
  placed: '⏳ Waiting for cook', accepted: '✅ Accepted', preparing: '🍳 Preparing',
  ready: '🛵 Ready / on the way', delivered: '🎉 Delivered', rejected: '❌ Rejected',
  cancelled: '🚫 Cancelled',
};

export default function Orders() {
  const { session } = useProfile();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);

  const load = useCallback(async () => {
    if (!session) return;
    const { data } = await supabase.from('orders')
      .select('*, order_items(*), cooks(name), reviews(id)')
      .eq('customer_id', session.user.id)
      .order('created_at', { ascending: false });
    setOrders(data ?? []);
  }, [session]);

  useEffect(() => {
    load();
    const ch = supabase.channel('student-orders-' + Math.random())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load]);

  const cancel = async (id: string) => {
    const { error } = await supabase.rpc('cancel_order', { p_order_id: id });
    if (error) Alert.alert('Could not cancel', error.message);
    load();
  };

  return (
    <FlatList
      style={styles.container}
      data={orders}
      keyExtractor={(o) => o.id}
      onRefresh={load}
      refreshing={false}
      ListEmptyComponent={<Text style={styles.muted}>No orders yet.</Text>}
      renderItem={({ item }) => {
        const reviewed = Array.isArray(item.reviews) ? item.reviews.length > 0 : !!item.reviews;
        return (
          <View style={styles.card}>
            <Text style={styles.cook}>{item.cooks?.name}</Text>
            <Text style={styles.status}>{labels[item.status]}</Text>
            {item.order_items.map((i: any) => (
              <Text key={i.id} style={styles.muted}>{i.qty} × {i.name}</Text>
            ))}
            <Text style={styles.total}>₹{item.total} · Cash on delivery</Text>
            {item.status === 'placed' && (
              <Pressable onPress={() => cancel(item.id)}>
                <Text style={{ color: 'red', fontWeight: '700', marginTop: 10 }}>Cancel order</Text>
              </Pressable>
            )}
            {item.status === 'delivered' && !reviewed && (
              <Pressable onPress={() => router.push({ pathname: '/rate', params: { orderId: item.id } } as any)}>
                <Text style={{ color: colors.primary, fontWeight: '800', marginTop: 10 }}>⭐ Rate this meal</Text>
              </Pressable>
            )}
            {item.status === 'delivered' && reviewed && (
              <Text style={[styles.muted, { marginTop: 10 }]}>Thanks for rating!</Text>
            )}
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  card: { backgroundColor: colors.card, padding: 16, borderRadius: 14, marginBottom: 12 },
  cook: { fontSize: 16, fontWeight: '700', color: colors.text },
  status: { color: colors.primary, fontWeight: '800', marginVertical: 6 },
  muted: { color: colors.muted, marginTop: 2 },
  total: { fontWeight: '800', marginTop: 8, color: colors.text },
});