import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import { useProfile } from '../profileContext';
import { colors } from '../theme';

export default function ProfileScreen() {
  const { profile, saveProfile, signOut, role } = useProfile();
  const router = useRouter();
  const [form, setForm] = useState(profile);
  const set = (k: keyof typeof form) => (v: string) => setForm({ ...form, [k]: v });

  const save = async () => {
    const err = await saveProfile(form);
    if (err) Alert.alert('Could not save', err);
    else router.back();
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.emoji}>{role === 'cook' ? '👩‍🍳' : '🧑‍🎓'}</Text>

      <Text style={styles.label}>Your name</Text>
      <TextInput style={styles.input} value={form.name} onChangeText={set('name')} placeholder="e.g. Rahul" />

      <Text style={styles.label}>Phone number</Text>
      <TextInput style={styles.input} value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" maxLength={10} placeholder="10-digit number" />

      <Text style={styles.label}>PG / Hostel name</Text>
      <TextInput style={styles.input} value={form.pg} onChangeText={set('pg')} placeholder="e.g. Sai Boys PG, Tilakwadi" />

      <Text style={styles.label}>Room number (optional)</Text>
      <TextInput style={styles.input} value={form.room} onChangeText={set('room')} placeholder="e.g. 204" />

      <Pressable style={styles.save} onPress={save}>
        <Text style={styles.saveText}>Save Profile</Text>
      </Pressable>
      <Pressable onPress={signOut}>
        <Text style={styles.logout}>Log Out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 20 },
  emoji: { fontSize: 64, textAlign: 'center', marginVertical: 12 },
  label: { color: colors.muted, marginTop: 16, marginBottom: 6, fontSize: 13 },
  input: { backgroundColor: colors.card, borderRadius: 12, padding: 14, fontSize: 16, color: colors.text },
  save: { backgroundColor: colors.primary, padding: 18, borderRadius: 16, marginTop: 30 },
  saveText: { color: '#fff', textAlign: 'center', fontWeight: '800', fontSize: 16 },
  logout: { color: 'red', textAlign: 'center', fontWeight: '700', marginTop: 24, marginBottom: 40 },
});