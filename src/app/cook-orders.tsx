import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useProfile } from '../profileContext';
import { supabase } from '../supabase';
import { colors } from '../theme';

const next: Record<string, { label: string; to: string }[]> = {
  placed: [{ label: 'Accept', to: 'accepted' }, { label: 'Reject', to: 'rejected' }],
  accepted: [{ label: 'Start Preparing', to: 'preparing' }],
  preparing: [{ label: 'Food Ready', to: 'ready' }],
};

export default function CookOrders() {
  const { session } = useProfile();
  const [orders, setOrders] = useState<any[]>([]);

  const load = useCallback(async () => {
    if (!session) return;
    const { data } = await supabase.from('orders')
      .select('*, order_items(*)')
      .eq('cook_id', session.user.id)
      .order('created_at', { ascending: false });
    setOrders(data ?? []);
  }, [session]);

  useEffect(() => {
    load();
    const ch = supabase.channel('cook-orders-' + Math.random())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load]);

  const setStatus = async (id: string, to: string) => {
    const { error } = await supabase.from('orders').update({ status: to }).eq('id', id);
    if (error) Alert.alert('Could not update', error.message);
    load();
  };

  const today = new Date().toDateString();
  const delivered = orders.filter((o) => o.status === 'delivered');
  const todays = delivered.filter((o) => new Date(o.created_at).toDateString() === today);
  const earnedToday = todays.reduce((s, o) => s + o.total, 0);
  const earnedTotal = delivered.reduce((s, o) => s + o.total, 0);
  const pending = orders.filter((o) => o.status === 'placed').length;

  return (
    <FlatList
      style={styles.container}
      data={orders}
      keyExtractor={(o) => o.id}
      onRefresh={load}
      refreshing={false}
      ListHeaderComponent={
        <View style={{ marginBottom: 12 }}>
          <View style={styles.summary}>
            <View style={styles.sumBox}><Text style={styles.sumNum}>{todays.length}</Text><Text style={styles.sumLabel}>Delivered today</Text></View>
            <View style={styles.sumBox}><Text style={styles.sumNum}>₹{earnedToday}</Text><Text style={styles.sumLabel}>Earned today</Text></View>
            <View style={styles.sumBox}><Text style={styles.sumNum}>₹{earnedTotal}</Text><Text style={styles.sumLabel}>Total earned</Text></View>
          </View>
          {pending > 0 && <Text style={styles.pending}>🔔 {pending} new order(s) waiting for you</Text>}
        </View>
      }
      ListEmptyComponent={<Text style={styles.muted}>No orders yet.</Text>}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.name}>{item.customer_name} · {item.customer_phone}</Text>
          <Text style={styles.muted}>📍 {item.address}</Text>
          {item.order_items.map((i: any) => (
            <Text key={i.id} style={styles.item}>{i.qty} × {i.name}</Text>
          ))}
          <Text style={styles.total}>₹{item.total} · Cash on delivery</Text>
          <Text style={styles.status}>Status: {item.status}</Text>
          <View style={styles.row}>
            {(next[item.status] ?? []).map((b) => (
              <Pressable key={b.to} style={[styles.btn, b.to === 'rejected' && { backgroundColor: '#999' }]} onPress={() => setStatus(item.id, b.to)}>
                <Text style={styles.btnText}>{b.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  summary: { flexDirection: 'row', gap: 8 },
  sumBox: { flex: 1, backgroundColor: colors.card, padding: 12, borderRadius: 14, alignItems: 'center' },
  sumNum: { fontSize: 20, fontWeight: '800', color: colors.primary },
  sumLabel: { fontSize: 11, color: colors.muted, marginTop: 4, textAlign: 'center' },
  pending: { marginTop: 12, color: colors.text, fontWeight: '700' },
  card: { backgroundColor: colors.card, padding: 16, borderRadius: 14, marginBottom: 12 },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  muted: { color: colors.muted, marginTop: 4 },
  item: { color: colors.text, marginTop: 4 },
  total: { fontWeight: '800', marginTop: 8, color: colors.text },
  status: { color: colors.primary, fontWeight: '700', marginTop: 6 },
  row: { flexDirection: 'row', gap: 10, marginTop: 12 },
  btn: { backgroundColor: colors.primary, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10 },
  btnText: { color: '#fff', fontWeight: '800' },
});