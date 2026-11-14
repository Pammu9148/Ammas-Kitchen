import { decode } from 'base64-arraybuffer';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useProfile } from '../profileContext';
import { supabase } from '../supabase';
import { colors } from '../theme';

type Item = { id: string; name: string; price: number; veg: boolean; photo_url?: string | null };

export default function CookHome() {
  const router = useRouter();
  const { session, signOut } = useProfile();
  const uid = session?.user.id;
  const [kitchen, setKitchen] = useState({ name: '', area: '', speciality: '' });
  const [isOpen, setIsOpen] = useState(true);
  const [saved, setSaved] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [iName, setIName] = useState('');
  const [iPrice, setIPrice] = useState('');
  const [iVeg, setIVeg] = useState(true);
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoB64, setPhotoB64] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!uid) return;
    const { data: c } = await supabase.from('cooks').select('*').eq('id', uid).maybeSingle();
    if (c) {
      setKitchen({ name: c.name, area: c.area ?? '', speciality: c.speciality ?? '' });
      setIsOpen(c.is_open);
      setSaved(true);
    }
    const { data: m } = await supabase.from('menu_items').select('*').eq('cook_id', uid).order('created_at');
    setItems(m ?? []);
  }, [uid]);

  useEffect(() => { load(); }, [load]);

  const saveKitchen = async () => {
    if (!kitchen.name.trim()) return Alert.alert('Enter your kitchen name');
    const { error } = await supabase.from('cooks').upsert({ id: uid, ...kitchen, is_open: isOpen });
    if (error) Alert.alert('Could not save', error.message);
    else { setSaved(true); Alert.alert('Saved'); }
  };

  const toggleOpen = async (v: boolean) => {
    setIsOpen(v);
    if (saved) await supabase.from('cooks').update({ is_open: v }).eq('id', uid);
  };

  const pickPhoto = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], quality: 0.5, allowsEditing: true, aspect: [4, 3], base64: true,
    });
    if (!res.canceled) {
      setPhoto(res.assets[0].uri);
      setPhotoB64(res.assets[0].base64 ?? null);
    }
  };

  const addItem = async () => {
    const price = parseInt(iPrice, 10);
    if (!saved) return Alert.alert('Save your kitchen details first');
    if (!iName.trim() || !price) return Alert.alert('Enter item name and price');

    let photo_url: string | null = null;
    if (photo) {
      if (!photoB64) return Alert.alert('Photo problem', 'Please choose the photo again.');
      const path = `${uid}/${Date.now()}.jpg`;
      const { error: upErr } = await supabase.storage
        .from('dish-photos')
        .upload(path, decode(photoB64), { contentType: 'image/jpeg' });
      if (upErr) return Alert.alert('Photo upload failed', upErr.message);
      photo_url = supabase.storage.from('dish-photos').getPublicUrl(path).data.publicUrl;
    }

    const { error } = await supabase.from('menu_items').insert({ cook_id: uid, name: iName.trim(), price, veg: iVeg, photo_url });
    if (error) return Alert.alert('Could not add', error.message);
    setIName(''); setIPrice(''); setPhoto(null); setPhotoB64(null); load();
  };

  const del = async (id: string) => {
    await supabase.from('menu_items').delete().eq('id', id);
    load();
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>My Kitchen 👩‍🍳</Text>
      <Pressable style={styles.btn} onPress={() => router.push('/cook-orders' as any)}>
        <Text style={styles.btnText}>📋 View Orders</Text>
      </Pressable>

      <Text style={styles.label}>Kitchen name</Text>
      <TextInput style={styles.input} value={kitchen.name} onChangeText={(v) => setKitchen({ ...kitchen, name: v })} placeholder="e.g. Lakshmi Aunty's Kitchen" />
      <Text style={styles.label}>Your area</Text>
      <TextInput style={styles.input} value={kitchen.area} onChangeText={(v) => setKitchen({ ...kitchen, area: v })} placeholder="e.g. Tilakwadi" />
      <Text style={styles.label}>Speciality</Text>
      <TextInput style={styles.input} value={kitchen.speciality} onChangeText={(v) => setKitchen({ ...kitchen, speciality: v })} placeholder="e.g. North Karnataka meals" />

      <View style={styles.rowBetween}>
        <Text style={styles.label}>Accepting orders today</Text>
        <Switch value={isOpen} onValueChange={toggleOpen} trackColor={{ true: colors.primary }} />
      </View>

      <Pressable style={styles.btn} onPress={saveKitchen}><Text style={styles.btnText}>Save Kitchen Details</Text></Pressable>

      <Text style={styles.section}>My Menu</Text>
      {items.length === 0 && <Text style={{ color: colors.muted }}>No items yet. Add your first dish below.</Text>}
      {items.map((m) => (
        <View key={m.id} style={styles.item}>
          {m.photo_url ? <Image source={{ uri: m.photo_url }} style={styles.thumb} /> : null}
          <Text style={{ flex: 1, color: colors.text }}>{m.veg ? '🟢' : '🔴'} {m.name}</Text>
          <Text style={styles.price}>₹{m.price}</Text>
          <Pressable onPress={() => del(m.id)}><Text style={{ fontSize: 18, marginLeft: 14 }}>🗑️</Text></Pressable>
        </View>
      ))}

      <Text style={styles.label}>Add a dish</Text>
      <TextInput style={styles.input} value={iName} onChangeText={setIName} placeholder="Dish name" />
      <TextInput style={styles.input} value={iPrice} onChangeText={setIPrice} keyboardType="number-pad" placeholder="Price in ₹" />

      <Pressable onPress={pickPhoto} style={{ marginTop: 8 }}>
        <Text style={{ color: colors.primary, fontWeight: '800' }}>{photo ? '📷 Change photo' : '📷 Add dish photo'}</Text>
      </Pressable>
      {photo && <Image source={{ uri: photo }} style={{ width: 120, height: 90, borderRadius: 10, marginTop: 8 }} />}

      <View style={styles.rowBetween}>
        <Text style={styles.label}>{iVeg ? '🟢 Veg' : '🔴 Non-veg'}</Text>
        <Switch value={iVeg} onValueChange={setIVeg} trackColor={{ true: 'green' }} />
      </View>
      <Pressable style={styles.btn} onPress={addItem}><Text style={styles.btnText}>Add to Menu</Text></Pressable>

      <Pressable onPress={signOut}><Text style={styles.logout}>Log Out</Text></Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 20, paddingTop: 60 },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, marginBottom: 10 },
  label: { color: colors.muted, marginTop: 14, marginBottom: 6, fontSize: 13 },
  input: { backgroundColor: colors.card, borderRadius: 12, padding: 14, fontSize: 16, color: colors.text, marginBottom: 4 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  btn: { backgroundColor: colors.primary, padding: 16, borderRadius: 14, marginTop: 16 },
  btnText: { color: '#fff', textAlign: 'center', fontWeight: '800', fontSize: 16 },
  section: { fontSize: 18, fontWeight: '700', marginTop: 30, marginBottom: 10, color: colors.text },
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, padding: 14, borderRadius: 12, marginBottom: 8 },
  thumb: { width: 48, height: 48, borderRadius: 8, marginRight: 10 },
  price: { fontWeight: '700', color: colors.primary },
  logout: { color: 'red', textAlign: 'center', fontWeight: '700', marginTop: 30, marginBottom: 60 },
});