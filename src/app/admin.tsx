import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProfile } from '../profileContext';
import { supabase } from '../supabase';
import { colors } from '../theme';
import { useOrdering } from '../useOrdering';

const COMMISSION = 0.1; // your commission: 10% (change this number anytime)

export default function Admin() {
  const { signOut } = useProfile();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const ordering = useOrdering();
  const [orders, setOrders] = useState<any[]>([]);
  const [cooks, setCooks] = useState<any[]>([]);
  const [enabled, setEnabled] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*), cooks(name)')
      .order('created_at', { ascending: false })
      .limit(300);
    setOrders(data ?? []);
    const { data: cs } = await supabase.from('cooks').select('*').order('created_at', { ascending: false });
    setCooks(cs ?? []);
    const { data: s } = await supabase.from('app_settings').select('orders_enabled').eq('id', 1).single();
    if (s) setEnabled(s.orders_enabled);
  }, []);

  useEffect(() => {
    load();
    const ch = supabase.channel('admin-orders-' + Math.random())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load]);

  const toggle = async (v: boolean) => {
    setEnabled(v);
    const { error } = await supabase.from('app_settings').update({ orders_enabled: v }).eq('id', 1);
    if (error) { setEnabled(!v); Alert.alert('Could not change', error.message); }
  };

  const setApproval = async (id: string, approved: boolean) => {
    const { error } = await supabase.rpc('approve_cook', { p_cook_id: id, p_approved: approved });
    if (error) Alert.alert('Could not update', error.message);
    load();
  };

  const today = new Date().toDateString();
  const todays = orders.filter((o) => new Date(o.created_at).toDateString() === today);
  const valid = (o: any) => !['cancelled', 'rejected'].includes(o.status);
  const sum = (list: any[]) => list.reduce((s, o) => s + o.total, 0);
  const deliveredToday = todays.filter((o) => o.status === 'delivered');
  const deliveredAll = orders.filter((o) => o.status === 'delivered');
  const active = orders.filter((o) => ['placed', 'accepted', 'preparing', 'ready', 'picked_up'].includes(o.status)).length;
  const pendingCooks = cooks.filter((c) => !c.approved);
  const approvedCooks = cooks.filter((c) => c.approved);

  const stats = [
    { n: todays.filter(valid).length, l: 'Orders today' },
    { n: deliveredToday.length, l: 'Delivered today' },
    { n: `₹${sum(deliveredToday)}`, l: 'Revenue today' },
    { n: `₹${sum(deliveredAll)}`, l: 'Total revenue' },
    { n: `₹${Math.round(sum(deliveredAll) * COMMISSION)}`, l: `Your commission (${COMMISSION * 100}%)` },
    { n: active, l: 'Active orders' },
    { n: approvedCooks.length, l: 'Approved cooks' },
    { n: pendingCooks.length, l: 'Waiting for approval' },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 16, paddingTop: insets.top + 20, paddingBottom: insets.bottom + 120 }}
    >
      <Text style={styles.title}>Admin Panel 🛠️</Text>

      <Pressable style={[styles.card, { alignItems: 'center' }]} onPress={() => router.push('/delivery' as any)}>
        <Text style={[styles.bold, { color: colors.primary }]}>🛵 Open Delivery Mode</Text>
      </Pressable>

      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.bold}>Accept orders</Text>
          <Switch value={enabled} onValueChange={toggle} trackColor={{ true: colors.primary }} />
        </View>
        <Text style={styles.muted}>
          {ordering ? `${ordering.open ? '🟢 Open now' : '🔴 Closed now'} · ${ordering.text}` : 'Loading...'}
        </Text>
      </View>

      <View style={styles.grid}>
        {stats.map((s) => (
          <View key={s.l} style={styles.statBox}>
            <Text style={styles.statNum}>{s.n}</Text>
            <Text style={styles.statLabel}>{s.l}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.section}>Cooks</Text>
      {cooks.length === 0 && <Text style={styles.muted}>No cooks yet.</Text>}
      {[...pendingCooks, ...approvedCooks].map((c) => (
        <View key={c.id} style={styles.card}>
          <Text style={styles.bold}>{c.name}</Text>
          <Text style={styles.muted}>{c.speciality} · 📍 {c.area}</Text>
          <Text style={[styles.muted, { color: c.approved ? 'green' : 'orange', fontWeight: '700' }]}>
            {c.approved ? '✅ Approved' : '⏳ Waiting for approval'}
          </Text>
          <Pressable
            style={[styles.btn, c.approved && { backgroundColor: '#999' }]}
            onPress={() => setApproval(c.id, !c.approved)}
          >
            <Text style={styles.btnText}>{c.approved ? 'Suspend' : 'Approve'}</Text>
          </Pressable>
        </View>
      ))}

      <Text style={styles.section}>All Orders</Text>
      {orders.length === 0 && <Text style={styles.muted}>No orders yet.</Text>}
      {orders.map((o) => (
        <View key={o.id} style={styles.card}>
          <Text style={styles.bold}>{o.cooks?.name} → {o.customer_name}</Text>
          <Text style={styles.muted}>📞 {o.customer_phone} · 📍 {o.address}</Text>
          {o.order_items.map((i: any) => (
            <Text key={i.id} style={styles.item}>{i.qty} × {i.name}</Text>
          ))}
          <Text style={styles.bold}>₹{o.total} · {o.status}</Text>
          <Text style={styles.muted}>{new Date(o.created_at).toLocaleString()}</Text>
        </View>
      ))}

      <Pressable onPress={load}><Text style={styles.refresh}>🔄 Refresh</Text></Pressable>
      <Pressable onPress={signOut}><Text style={styles.logout}>Log Out</Text></Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, marginBottom: 14 },
  card: { backgroundColor: colors.card, padding: 14, borderRadius: 14, marginBottom: 10 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bold: { fontWeight: '700', color: colors.text, fontSize: 15 },
  muted: { color: colors.muted, marginTop: 4 },
  item: { color: colors.text, marginTop: 3 },
  btn: { backgroundColor: colors.primary, padding: 12, borderRadius: 10, marginTop: 10, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '800' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 6 },
  statBox: { width: '48%', backgroundColor: colors.card, padding: 14, borderRadius: 14 },
  statNum: { fontSize: 22, fontWeight: '800', color: colors.primary },
  statLabel: { fontSize: 12, color: colors.muted, marginTop: 4 },
  section: { fontSize: 18, fontWeight: '700', marginVertical: 12, color: colors.text },
  refresh: { color: colors.primary, textAlign: 'center', fontWeight: '800', marginTop: 16, padding: 8 },
  logout: { color: 'red', textAlign: 'center', fontWeight: '700', marginTop: 12, padding: 12 },
});