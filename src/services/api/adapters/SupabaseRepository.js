import { createClient } from '@supabase/supabase-js';

let supabaseInstance = null;

function getSupabase() {
  if (supabaseInstance) return supabaseInstance;
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('Supabase client is not configured. Please define VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
  }
  supabaseInstance = createClient(url, key);
  return supabaseInstance;
}

export class SupabaseRepository {
  static getSession() {
    return getSupabase().auth.getSession();
  }

  static onAuthStateChange(callback) {
    return getSupabase().auth.onAuthStateChange(callback);
  }

  static async fetchMatches() {
    const { data, error } = await getSupabase()
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
    const channel = getSupabase()
      .channel('public:matches')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, callback)
      .subscribe();
    return channel;
  }

  static unsubscribe(channel) {
    getSupabase().removeChannel(channel);
  }

  static loginViaDiscord() {
    return getSupabase().auth.signInWithOAuth({ 
      provider: 'discord',
      options: { redirectTo: window.location.origin }
    });
  }

  static logout() {
    return getSupabase().auth.signOut();
  }

  static async updateMatchVeto(matchId, vetoLog, currentMeta) {
    const newMeta = { ...currentMeta, veto_log: vetoLog };
    const { error } = await getSupabase()
      .from('matches')
      .update({ metadata: newMeta })
      .eq('id', matchId);
    if (error) throw error;
  }

  static async forceWin(matchId) {
    const { error } = await getSupabase()
      .from('matches')
      .update({ state: 'complete', score: '1-0 (Forced)' })
      .eq('id', matchId);
    if (error) throw error;
  }
}
