import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { supabase } from '../supabase';
import { colors } from '../theme';

export default function Rate() {
  const { orderId } = useLocalSearchParams();
  const router = useRouter();
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (stars === 0) return Alert.alert('Please choose a rating');
    setBusy(true);
    const { error } = await supabase.rpc('submit_review', {
      p_order_id: orderId, p_rating: stars, p_comment: comment,
    });
    setBusy(false);
    if (error) return Alert.alert('Could not submit', error.message);
    Alert.alert('Thank you!', 'Your rating was submitted.');
    router.back();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>How was your meal?</Text>
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable key={n} onPress={() => setStars(n)}>
            <Text style={styles.star}>{n <= stars ? '⭐' : '☆'}</Text>
          </Pressable>
        ))}
      </View>
      <TextInput
        style={styles.input}
        placeholder="Write a short review (optional)"
        value={comment}
        onChangeText={setComment}
        multiline
        maxLength={300}
      />
      <Pressable style={[styles.btn, busy && { opacity: 0.5 }]} disabled={busy} onPress={submit}>
        <Text style={styles.btnText}>Submit Rating</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 24 },
  title: { fontSize: 24, fontWeight: '800', color: colors.text, textAlign: 'center', marginTop: 20 },
  stars: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginVertical: 24 },
  star: { fontSize: 40 },
  input: { backgroundColor: colors.card, borderRadius: 12, padding: 14, fontSize: 16, minHeight: 90, textAlignVertical: 'top' },
  btn: { backgroundColor: colors.primary, padding: 18, borderRadius: 16, marginTop: 24 },
  btnText: { color: '#fff', textAlign: 'center', fontWeight: '800', fontSize: 16 },
});