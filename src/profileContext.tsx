import { Session } from '@supabase/supabase-js';
import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from './supabase';

export type Profile = { name: string; phone: string; pg: string; room: string };
type Ctx = {
  session: Session | null; loading: boolean; role: string; roleReady: boolean;
  profile: Profile; complete: boolean;
  saveProfile: (p: Profile) => Promise<string | null>;
  signOut: () => Promise<void>;
  setExpectedRole: (r: 'customer' | 'cook' | null) => void;
  loginError: string;
  clearLoginError: () => void;
};

const empty: Profile = { name: '', phone: '', pg: '', room: '' };
const ProfileContext = createContext<Ctx>(null as any);
export const useProfile = () => useContext(ProfileContext);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile>(empty);
  const [role, setRole] = useState('customer');
  const [roleReady, setRoleReady] = useState(false);
  const [loginError, setLoginError] = useState('');
  const expectedRole = useRef<'customer' | 'cook' | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const userId = session?.user.id;

  useEffect(() => {
    let cancelled = false;
    // a different person is logging in or out: forget everything about the previous one
    setRoleReady(false);
    setRole('customer');
    setProfile(empty);
    if (!userId) return;

    supabase.from('profiles').select('*').eq('id', userId).single()
      .then(({ data }) => {
        if (cancelled) return;
        const r = data?.role ?? 'customer';
        const wanted = expectedRole.current;
        expectedRole.current = null;

        // student account chosen as cook (or the other way round): refuse the login
        if (wanted && (r === 'customer' || r === 'cook') && r !== wanted) {
          setLoginError(
            r === 'cook'
              ? 'This is a home cook account. Please choose "I\'m a home cook" and log in again.'
              : 'This is a student account. Please choose "I\'m a student" and log in again.'
          );
          supabase.auth.signOut();
          return;
        }

        if (data) {
          setProfile({ name: data.name ?? '', phone: data.phone ?? '', pg: data.pg ?? '', room: data.room ?? '' });
          setRole(data.role);
        }
        setRoleReady(true);
      }, () => { if (!cancelled) setRoleReady(true); });

    return () => { cancelled = true; };
  }, [userId]);

  const saveProfile = async (p: Profile) => {
    if (!session) return 'Not logged in';
    const { error } = await supabase.from('profiles').update(p).eq('id', session.user.id);
    if (error) return error.message;
    setProfile(p);
    return null;
  };

  const signOut = async () => { await supabase.auth.signOut(); };
  const setExpectedRole = (r: 'customer' | 'cook' | null) => { expectedRole.current = r; };
  const clearLoginError = () => setLoginError('');
  const complete = !!(profile.name && profile.phone && profile.pg);

  return (
    <ProfileContext.Provider
      value={{
        session, loading, role, roleReady, profile, complete, saveProfile, signOut,
        setExpectedRole, loginError, clearLoginError,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}