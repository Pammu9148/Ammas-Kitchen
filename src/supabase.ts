import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

export const supabase = createClient('https://lltrbxoplojagikszhyt.supabase.co', 'sb_publishable_kh1D5n9J9qRiC63Zv4LcBQ_wKgVwaDH', {
  auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
});