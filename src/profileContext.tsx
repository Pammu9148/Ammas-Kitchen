import { Session } from '@supabase/supabase-js';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';

export type Profile = { name: string; phone: string; pg: string; room: string };
type Ctx = {
  session: Session | null; loading: boolean; role: string;
  profile: Profile; complete: boolean;
  saveProfile: (p: Profile) => Promise<string | null>;
  signOut: () => Promise<void>;
};

const empty: Profile = { name: '', phone: '', pg: '', room: '' };
const ProfileContext = createContext<Ctx>(null as any);
export const useProfile = () => useContext(ProfileContext);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile>(empty);
  const [role, setRole] = useState('customer');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) { setProfile(empty); return; }
    supabase.from('profiles').select('*').eq('id', session.user.id).single()
      .then(({ data }) => {
        if (data) {
          setProfile({ name: data.name ?? '', phone: data.phone ?? '', pg: data.pg ?? '', room: data.room ?? '' });
          setRole(data.role);
        }
      });
  }, [session]);

  const saveProfile = async (p: Profile) => {
    if (!session) return 'Not logged in';
    const { error } = await supabase.from('profiles').update(p).eq('id', session.user.id);
    if (error) return error.message;
    setProfile(p);
    return null;
  };

  const signOut = async () => { await supabase.auth.signOut(); };
  const complete = !!(profile.name && profile.phone && profile.pg);

  return (
    <ProfileContext.Provider value={{ session, loading, role, profile, complete, saveProfile, signOut }}>
      {children}
    </ProfileContext.Provider>
  );
}