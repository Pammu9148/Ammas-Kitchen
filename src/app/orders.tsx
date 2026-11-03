import { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useProfile } from '../profileContext';
import { supabase } from '../supabase';
import { colors } from '../theme';

const labels: Record<string, string> = {
  placed: '⏳ Waiting for cook', accepted: '✅ Accepted', preparing: '🍳 Preparing',
  ready: '🛵 Ready / on the way', delivered: '🎉 Delivered', rejected: '❌ Rejected',
};

export default function Orders() {
  const { session } = useProfile();
  const [orders, setOrders] = useState<any[]>([]);

  const load = useCallback(async () => {
    if (!session) return;
    const { data } = await supabase.from('orders')
      .select('*, order_items(*), cooks(name)')
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

  return (
    <FlatList
      style={styles.container}
      data={orders}
      keyExtractor={(o) => o.id}
      onRefresh={load}
      refreshing={false}
      ListEmptyComponent={<Text style={styles.muted}>No orders yet.</Text>}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.cook}>{item.cooks?.name}</Text>
          <Text style={styles.status}>{labels[item.status]}</Text>
          {item.order_items.map((i: any) => (
            <Text key={i.id} style={styles.muted}>{i.qty} × {i.name}</Text>
          ))}
          <Text style={styles.total}>₹{item.total} · Cash on delivery</Text>
        </View>
      )}
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