import { useEffect, useState } from 'react';
import { supabase } from './supabase';

const fmt = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};

export function useOrdering() {
  const [state, setState] = useState<{ open: boolean; text: string } | null>(null);

  useEffect(() => {
    const check = async () => {
      const { data: s } = await supabase.from('app_settings').select('*').eq('id', 1).single();
      const { data: open } = await supabase.rpc('ordering_open');
      if (!s) return;
      setState({ open: !!open, text: `${s.meal_name} orders: ${fmt(s.open_time)} to ${fmt(s.close_time)}` });
    };
    check();
    const t = setInterval(check, 60000);
    return () => clearInterval(t);
  }, []);

  return state;
}