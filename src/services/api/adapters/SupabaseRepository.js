import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export class SupabaseRepository {
  static getSession() {
    return supabase.auth.getSession();
  }

  static onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback);
  }

  static async fetchMatches() {
    const { data, error } = await supabase
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
    const channel = supabase
      .channel('public:matches')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, callback)
      .subscribe();
    return channel;
  }

  static unsubscribe(channel) {
    supabase.removeChannel(channel);
  }

  static loginViaDiscord() {
    return supabase.auth.signInWithOAuth({ 
      provider: 'discord',
      options: { redirectTo: window.location.origin }
    });
  }

  static logout() {
    return supabase.auth.signOut();
  }

  static async updateMatchVeto(matchId, vetoLog, currentMeta) {
    const newMeta = { ...currentMeta, veto_log: vetoLog };
    const { error } = await supabase
      .from('matches')
      .update({ metadata: newMeta })
      .eq('id', matchId);
    if (error) throw error;
  }

  static async forceWin(matchId) {
    const { error } = await supabase
      .from('matches')
      .update({ state: 'complete', score: '1-0 (Forced)' })
      .eq('id', matchId);
    if (error) throw error;
  }
}
