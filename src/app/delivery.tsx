import { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useProfile } from '../profileContext';
import { supabase } from '../supabase';
import { colors } from '../theme';

export default function Delivery() {
  const { session, signOut } = useProfile();
  const uid = session?.user.id;
  const [orders, setOrders] = useState<any[]>([]);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*), cooks(name, area)')
      .order('created_at', { ascending: false })
      .limit(200);
    setOrders(data ?? []);
  }, []);

  useEffect(() => {
    load();
    const ch = supabase.channel('delivery-orders-' + Math.random())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load]);

  const act = async (fn: 'pickup_order' | 'deliver_order', id: string) => {
    const { error } = await supabase.rpc(fn, { p_order_id: id });
    if (error) Alert.alert('Could not update', error.message);
    load();
  };

  const today = new Date().toDateString();
  const ready = orders.filter((o) => o.status === 'ready');
  const mine = orders.filter((o) => o.status === 'picked_up' && o.delivery_partner_id === uid);
  const doneToday = orders.filter(
    (o) => o.status === 'delivered' && o.delivery_partner_id === uid && new Date(o.created_at).toDateString() === today
  );

  const Items = ({ o }: { o: any }) => (
    <>{o.order_items.map((i: any) => <Text key={i.id} style={styles.item}>{i.qty} × {i.name}</Text>)}</>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Deliveries 🛵</Text>
      <View style={styles.summary}>
        <View style={styles.sumBox}><Text style={styles.sumNum}>{doneToday.length}</Text><Text style={styles.sumLabel}>Delivered today</Text></View>
        <View style={styles.sumBox}><Text style={styles.sumNum}>{ready.length}</Text><Text style={styles.sumLabel}>Ready for pickup</Text></View>
        <View style={styles.sumBox}><Text style={styles.sumNum}>{mine.length}</Text><Text style={styles.sumLabel}>On my way</Text></View>
      </View>

      <Text style={styles.section}>My Deliveries</Text>
      {mine.length === 0 && <Text style={styles.muted}>Nothing on the way right now.</Text>}
      {mine.map((o) => (
        <View key={o.id} style={styles.card}>
          <Text style={styles.bold}>Deliver to {o.customer_name}</Text>
          <Text style={styles.muted}>📍 {o.address}</Text>
          <Items o={o} />
          <Text style={styles.cash}>💵 Collect ₹{o.total} cash</Text>
          <View style={styles.row}>
            <Pressable style={styles.btnOutline} onPress={() => Linking.openURL(`tel:${o.customer_phone}`)}>
              <Text style={styles.btnOutlineText}>📞 Call</Text>
            </Pressable>
            <Pressable
              style={styles.btnOutline}
              onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(o.address + ' Belgaum')}`)}
            >
              <Text style={styles.btnOutlineText}>🗺️ Map</Text>
            </Pressable>
            <Pressable style={styles.btn} onPress={() => act('deliver_order', o.id)}>
              <Text style={styles.btnText}>Delivered</Text>
            </Pressable>
          </View>
        </View>
      ))}

      <Text style={styles.section}>Ready for Pickup</Text>
      {ready.length === 0 && <Text style={styles.muted}>No food is ready yet.</Text>}
      {ready.map((o) => (
        <View key={o.id} style={styles.card}>
          <Text style={styles.bold}>Pickup: {o.cooks?.name}</Text>
          <Text style={styles.muted}>📍 {o.cooks?.area}</Text>
          <Text style={[styles.muted, { marginTop: 8 }]}>Deliver to: {o.customer_name} · {o.address}</Text>
          <Items o={o} />
          <Text style={styles.cash}>💵 Collect ₹{o.total} cash</Text>
          <Pressable style={[styles.btn, { marginTop: 12 }]} onPress={() => act('pickup_order', o.id)}>
            <Text style={styles.btnText}>Pick up this order</Text>
          </Pressable>
        </View>
      ))}

      <Pressable onPress={load}><Text style={styles.refresh}>🔄 Refresh</Text></Pressable>
      <Pressable onPress={signOut}><Text style={styles.logout}>Log Out</Text></Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16, paddingTop: 20 },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, marginBottom: 12 },
  summary: { flexDirection: 'row', gap: 8 },
  sumBox: { flex: 1, backgroundColor: colors.card, padding: 12, borderRadius: 14, alignItems: 'center' },
  sumNum: { fontSize: 22, fontWeight: '800', color: colors.primary },
  sumLabel: { fontSize: 11, color: colors.muted, marginTop: 4, textAlign: 'center' },
  section: { fontSize: 18, fontWeight: '700', marginTop: 22, marginBottom: 10, color: colors.text },
  card: { backgroundColor: colors.card, padding: 14, borderRadius: 14, marginBottom: 10 },
  bold: { fontWeight: '700', color: colors.text, fontSize: 15 },
  muted: { color: colors.muted, marginTop: 4 },
  item: { color: colors.text, marginTop: 3 },
  cash: { fontWeight: '800', color: colors.text, marginTop: 10 },
  row: { flexDirection: 'row', gap: 8, marginTop: 12 },
  btn: { backgroundColor: colors.primary, paddingVertical: 12, paddingHorizontal: 18, borderRadius: 10, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '800' },
  btnOutline: { borderWidth: 1.5, borderColor: colors.primary, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10 },
  btnOutlineText: { color: colors.primary, fontWeight: '800' },
  refresh: { color: colors.primary, textAlign: 'center', fontWeight: '800', marginTop: 16 },
  logout: { color: 'red', textAlign: 'center', fontWeight: '700', marginTop: 20, marginBottom: 60 },
});