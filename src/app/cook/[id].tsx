import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useCart } from '../../cartContext';
import { supabase } from '../../supabase';
import { colors } from '../../theme';

export default function CookProfile() {
  const { id } = useLocalSearchParams();
  const cookId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const { items, add, remove, count, total } = useCart();
  const [cook, setCook] = useState<any>(null);
  const [menu, setMenu] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    if (!cookId) return;

    let active = true;
    (async () => {
      const { data: c } = await supabase.from('cooks').select('*').eq('id', cookId).maybeSingle();
      const { data: m } = await supabase.from('menu_items').select('*').eq('cook_id', cookId).order('created_at');
      const { data: rv } = await supabase
        .from('reviews')
        .select('*')
        .eq('cook_id', cookId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!active) return;
      setCook(c);
      setMenu(m ?? []);
      setReviews(rv ?? []);
    })();

    return () => {
      active = false;
    };
  }, [cookId]);

  if (!cook) return <Text style={{ padding: 20 }}>Loading...</Text>;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView style={styles.container}>
        <Text style={styles.emoji}>👩‍🍳</Text>
        <Text style={styles.name}>{cook.name}</Text>
        <Text style={styles.meta}>{cook.speciality} · {cook.area}</Text>
        {!cook.is_open && <Text style={styles.closed}>Currently closed. Not accepting orders.</Text>}

        <Text style={styles.section}>Today's Menu</Text>
        {menu.length === 0 && <Text style={styles.meta}>No items added yet.</Text>}
        {menu.map((m) => {
          const qty = items.find((i) => i.name === m.name)?.qty ?? 0;
          return (
            <View key={m.id} style={styles.item}>
              {m.photo_url ? <Image source={{ uri: m.photo_url }} style={styles.dishImg} /> : null}
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{m.veg ? '🟢' : '🔴'} {m.name}</Text>
                <Text style={styles.price}>₹{m.price}</Text>
              </View>
              {qty === 0 ? (
                <Pressable
                  style={[styles.addBtn, !cook.is_open && { opacity: 0.3 }]}
                  disabled={!cook.is_open}
                  onPress={() => add(m.name, m.price, cook.id)}
                >
                  <Text style={styles.addText}>ADD</Text>
                </Pressable>
              ) : (
                <View style={styles.qtyBox}>
                  <Pressable onPress={() => remove(m.name)}>
                    <Text style={styles.qtyBtn}>−</Text>
                  </Pressable>
                  <Text style={styles.qty}>{qty}</Text>
                  <Pressable onPress={() => add(m.name, m.price, cook.id)}>
                    <Text style={styles.qtyBtn}>+</Text>
                  </Pressable>
                </View>
              )}
            </View>
          );
        })}

        <Text style={styles.section}>Student Reviews</Text>
        {reviews.length === 0 && <Text style={styles.meta}>No reviews yet.</Text>}
        {reviews.map((r) => (
          <View key={r.id} style={styles.item}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{'⭐'.repeat(r.rating)} · {r.customer_name}</Text>
              {!!r.comment && <Text style={styles.meta}>{r.comment}</Text>}
            </View>
          </View>
        ))}
      </ScrollView>

      {count > 0 && (
        <Pressable style={styles.cartBar} onPress={() => router.push('/cart' as any)}>
          <Text style={styles.cartText}>{count} item(s) · ₹{total}</Text>
          <Text style={styles.cartText}>View Cart →</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  emoji: { fontSize: 64, textAlign: 'center' },
  name: { fontSize: 26, fontWeight: '800', textAlign: 'center', color: colors.text, marginTop: 8 },
  meta: { textAlign: 'center', color: colors.muted, marginTop: 4 },
  closed: { textAlign: 'center', color: 'red', fontWeight: '700', marginTop: 10 },
  section: { fontSize: 18, fontWeight: '700', marginTop: 28, marginBottom: 12, color: colors.text },
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, padding: 16, borderRadius: 14, marginBottom: 10 },
  dishImg: { width: 64, height: 64, borderRadius: 10, marginRight: 12 },
  itemName: { fontSize: 15, color: colors.text },
  price: { fontWeight: '700', color: colors.primary, marginTop: 4 },
  addBtn: { borderWidth: 1.5, borderColor: colors.primary, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 20 },
  addText: { color: colors.primary, fontWeight: '800' },
  qtyBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 8 },
  qtyBtn: { color: '#fff', fontSize: 22, fontWeight: '800', paddingHorizontal: 10, paddingVertical: 4 },
  qty: { color: '#fff', fontWeight: '800', minWidth: 20, textAlign: 'center' },
  cartBar: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.primary, margin: 16, padding: 18, borderRadius: 16 },
  cartText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});