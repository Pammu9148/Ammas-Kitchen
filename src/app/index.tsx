import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useProfile } from '../profileContext';
import { supabase } from '../supabase';
import { colors } from '../theme';

export default function Home() {
  const router = useRouter();
  const { role, session } = useProfile();
  const [cooks, setCooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('cooks').select('*').order('created_at', { ascending: false });
    const { data: r } = await supabase.from('cook_ratings').select('*');
    const map = new Map((r ?? []).map((x: any) => [x.cook_id, x]));
    setCooks((data ?? []).map((c: any) => ({ ...c, rating: map.get(c.id) })));
    setLoading(false);
  }, []);

  useEffect(() => { if (role === 'cook') router.replace('/cook-home' as any); }, [role]);
  useEffect(() => { if (session) load(); }, [session, load]);

  return (
    <View style={styles.container}>
      <Pressable style={{ position: 'absolute', top: 55, right: 20, zIndex: 1 }} onPress={() => router.push('/profile' as any)}>
        <Text style={{ fontSize: 28 }}>👤</Text>
      </Pressable>
      <Pressable style={{ position: 'absolute', top: 55, right: 64, zIndex: 1 }} onPress={() => router.push('/orders' as any)}>
        <Text style={{ fontSize: 28 }}>🧾</Text>
      </Pressable>
      <Text style={styles.small}>Delivering to</Text>
      <Text style={styles.location}>Belgaum, Karnataka</Text>
      <Text style={styles.title}>Home food, made with love</Text>

      <FlatList
        data={cooks}
        keyExtractor={(c) => c.id}
        refreshing={loading}
        onRefresh={load}
              ListEmptyComponent={() =>
          loading ? null : (
            <Text style={styles.meta}>No home cooks have joined yet. Pull down to refresh.</Text>
          )
        }
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => router.push(`/cook/${item.id}` as any)}>
            <Text style={styles.emoji}>👩‍🍳</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.meta}>{item.speciality}</Text>
              <Text style={styles.meta}>📍 {item.area}</Text>
              <Text style={styles.meta}>{item.rating ? `⭐ ${item.rating.avg_rating} (${item.rating.review_count})` : '⭐ New'}</Text>
            </View>
            <Text style={{ color: item.is_open ? 'green' : 'red' }}>{item.is_open ? 'Open' : 'Closed'}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 20, paddingTop: 60 },
  small: { color: colors.muted, fontSize: 12 },
  location: { color: colors.text, fontSize: 16, fontWeight: '600' },
  title: { color: colors.text, fontSize: 26, fontWeight: '800', marginVertical: 20 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.card, padding: 16, borderRadius: 16, marginBottom: 12 },
  emoji: { fontSize: 36 },
  name: { color: colors.text, fontSize: 16, fontWeight: '700' },
  meta: { color: colors.muted, marginTop: 3 },
});