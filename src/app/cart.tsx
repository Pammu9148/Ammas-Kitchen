import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useCart } from '../cartContext';
import { useProfile } from '../profileContext';
import { supabase } from '../supabase';
import { colors } from '../theme';

export default function Cart() {
  const { items, cookId, add, remove, clear, total } = useCart();
  const { profile, complete, session } = useProfile();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

    const place = async () => {
    if (!cookId || !session) {
      Alert.alert('Cart problem', 'Please remove the items and add them again from the cook\'s page.');
      return;
    }
    setBusy(true);
    const { error } = await supabase.rpc('place_order', {
      p_cook_id: cookId,
      p_items: items.map((i) => ({ name: i.name, qty: i.qty })),
    });
    setBusy(false);
    if (error) return Alert.alert('Could not place order', error.message);
    clear();
    router.replace('/orders' as any);
  };

  return (
    <View style={styles.container}>
      {items.length === 0 && <Text style={styles.empty}>Your cart is empty</Text>}
      {items.map((i) => (
        <View key={i.name} style={styles.row}>
          <Text style={styles.name}>{i.name}</Text>
          <View style={styles.qtyBox}>
            <Pressable onPress={() => remove(i.name)}><Text style={styles.btn}>−</Text></Pressable>
            <Text style={styles.qty}>{i.qty}</Text>
            <Pressable onPress={() => add(i.name, i.price)}><Text style={styles.btn}>+</Text></Pressable>
          </View>
          <Text style={styles.price}>₹{i.qty * i.price}</Text>
        </View>
      ))}

      {items.length > 0 && (
        <>
          <Text style={styles.total}>Total: ₹{total} (Cash on delivery)</Text>
          <View style={styles.addressBox}>
            <Text style={styles.label}>Deliver to</Text>
            {complete ? (
              <Text style={styles.addr}>
                {profile.name} · {profile.phone}{'\n'}{profile.pg}{profile.room ? `, Room ${profile.room}` : ''}
              </Text>
            ) : (
              <Text style={styles.addr}>No delivery details yet</Text>
            )}
            <Pressable onPress={() => router.push('/profile' as any)}>
              <Text style={styles.link}>{complete ? 'Change' : 'Add details'}</Text>
            </Pressable>
          </View>
          <Pressable style={[styles.order, (!complete || busy) && { opacity: 0.4 }]} disabled={!complete || busy} onPress={place}>
            <Text style={styles.orderText}>{busy ? 'Placing...' : 'Place Order'}</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 20 },
  empty: { textAlign: 'center', marginTop: 60, color: colors.muted, fontSize: 16 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, padding: 16, borderRadius: 14, marginBottom: 10 },
  name: { flex: 1, color: colors.text, fontWeight: '600' },
  qtyBox: { flexDirection: 'row', alignItems: 'center', marginRight: 12 },
  btn: { color: colors.primary, fontSize: 22, fontWeight: '800', paddingHorizontal: 10 },
  qty: { fontWeight: '700', minWidth: 20, textAlign: 'center' },
  price: { fontWeight: '800', color: colors.text },
  total: { fontSize: 18, fontWeight: '800', marginTop: 16, color: colors.text },
  addressBox: { backgroundColor: colors.card, padding: 16, borderRadius: 14, marginTop: 16 },
  label: { color: colors.muted, fontSize: 12 },
  addr: { color: colors.text, marginTop: 6, fontSize: 15 },
  link: { color: colors.primary, fontWeight: '800', marginTop: 8 },
  order: { backgroundColor: colors.primary, padding: 18, borderRadius: 16, marginTop: 20 },
  orderText: { color: '#fff', textAlign: 'center', fontWeight: '800', fontSize: 16 },
});