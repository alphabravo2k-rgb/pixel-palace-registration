import { createClient } from '@supabase/supabase-js';

let supabaseInstance = null;

function getSupabase() {
  if (supabaseInstance) return supabaseInstance;
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return null;
  }
  supabaseInstance = createClient(url, key);
  return supabaseInstance;
}

export class SupabaseRepository {
  static getSession() {
    const sb = getSupabase();
    if (!sb) return Promise.reject(new Error("Supabase client not configured."));
    return sb.auth.getSession();
  }

  static onAuthStateChange(callback) {
    const sb = getSupabase();
    if (!sb) return { data: { subscription: { unsubscribe: () => {} } } };
    return sb.auth.onAuthStateChange(callback);
  }

  static async fetchMatches() {
    const sb = getSupabase();
    if (!sb) return [];
    
    const { data, error } = await sb
      .from('matches')
      .select(`
        id, round, state, score, metadata,
        player1:player1_id(display_name, user_id),
        player2:player2_id(display_name, user_id),
        winner:winner_id(display_name)
      `)
      .order('round', { ascending: true });
      
    if (error) throw error;
    return data;
  }

  static subscribeToMatches(callback) {
    const sb = getSupabase();
    if (!sb) return { unsubscribe: () => {} };
    
    const channel = sb
      .channel('public:matches')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, callback)
      .subscribe();
    return channel;
  }

  static unsubscribe(channel) {
    const sb = getSupabase();
    if (!sb || !channel) return;
    sb.removeChannel(channel);
  }

  static loginViaDiscord() {
    const sb = getSupabase();
    if (!sb) return Promise.reject(new Error("Supabase client not configured."));
    return sb.auth.signInWithOAuth({ 
      provider: 'discord',
      options: { redirectTo: window.location.origin }
    });
  }

  static logout() {
    const sb = getSupabase();
    if (!sb) return Promise.resolve();
    return sb.auth.signOut();
  }

  static async updateMatchVeto(matchId, vetoLog, currentMeta) {
    const sb = getSupabase();
    if (!sb) return;
    
    const newMeta = { ...currentMeta, veto_log: vetoLog };
    const { error } = await sb
      .from('matches')
      .update({ metadata: newMeta })
      .eq('id', matchId);
    if (error) throw error;
  }

  static async forceWin(matchId) {
    const sb = getSupabase();
    if (!sb) return;
    
    const { error } = await sb
      .from('matches')
      .update({ state: 'complete', score: '1-0 (Forced)' })
      .eq('id', matchId);
    if (error) throw error;
  }
}
