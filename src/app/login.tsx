import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { supabase } from '../supabase';
import { colors } from '../theme';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'customer' | 'cook'>('customer');
  const [busy, setBusy] = useState(false);

  const signUp = async () => {
    const e = email.trim();
    if (!e || password.length < 6) {
      Alert.alert('Check details', 'Enter your email and a password of at least 6 characters.');
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signUp({ email: e, password, options: { data: { role } } });
    setBusy(false);
    if (error) Alert.alert('Sign up failed', error.message);
  };

  const logIn = async () => {
    const e = email.trim();
    if (!e || !password) {
      Alert.alert('Check details', 'Enter your email and password.');
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: e, password });
    setBusy(false);
    if (error) Alert.alert('Login failed', error.message);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Amma's Kitchen</Text>
      <Text style={styles.sub}>Home food for PG and hostel students</Text>

      <View style={styles.roles}>
        <Pressable style={[styles.chip, role === 'customer' && styles.chipOn]} onPress={() => setRole('customer')}>
          <Text style={[styles.chipText, role === 'customer' && { color: '#fff' }]}>🧑‍🎓 I'm a student</Text>
        </Pressable>
        <Pressable style={[styles.chip, role === 'cook' && styles.chipOn]} onPress={() => setRole('cook')}>
          <Text style={[styles.chipText, role === 'cook' && { color: '#fff' }]}>👩‍🍳 I'm a home cook</Text>
        </Pressable>
      </View>

      <TextInput style={styles.input} placeholder="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
      <TextInput style={styles.input} placeholder="Password (min 6 characters)" secureTextEntry value={password} onChangeText={setPassword} />

      <Pressable style={[styles.btn, busy && { opacity: 0.5 }]} disabled={busy} onPress={logIn}>
        <Text style={styles.btnText}>Log In</Text>
      </Pressable>
      <Pressable style={styles.outline} disabled={busy} onPress={signUp}>
        <Text style={styles.outlineText}>Create New Account</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 24, justifyContent: 'center' },
  title: { fontSize: 32, fontWeight: '800', color: colors.text, textAlign: 'center' },
  sub: { color: colors.muted, textAlign: 'center', marginBottom: 28, marginTop: 6 },
  roles: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  chip: { flex: 1, padding: 12, borderRadius: 12, borderWidth: 1.5, borderColor: colors.primary, alignItems: 'center' },
  chipOn: { backgroundColor: colors.primary },
  chipText: { color: colors.primary, fontWeight: '700' },
  input: { backgroundColor: colors.card, borderRadius: 12, padding: 14, fontSize: 16, marginBottom: 12 },
  btn: { backgroundColor: colors.primary, padding: 16, borderRadius: 14, marginTop: 8 },
  btnText: { color: '#fff', textAlign: 'center', fontWeight: '800', fontSize: 16 },
  outline: { padding: 16, borderRadius: 14, marginTop: 10, borderWidth: 1.5, borderColor: colors.primary },
  outlineText: { color: colors.primary, textAlign: 'center', fontWeight: '800', fontSize: 16 },
});