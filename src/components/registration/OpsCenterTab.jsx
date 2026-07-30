import React, { useState, useEffect } from 'react';
import { 
  Activity, Play, CheckCircle2, Clock, ShieldCheck, Users, 
  Tv, Server, ChevronRight, Zap, RefreshCw, Trophy, ExternalLink, Flame, Calendar 
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const OpsCenterTab = ({ 
  tournament, 
  teams = [], 
  bracketData, 
  slots, 
  playHover, 
  playClick, 
  onSelectTeam,
  onGenerateDiscordSheet
}) => {
  const [liveMatches, setLiveMatches] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [completedMatches, setCompletedMatches] = useState([]);
  const [lastSyncTime, setLastSyncTime] = useState(new Date());

  // Extract live, upcoming, and completed matches directly from live bracket API
  useEffect(() => {
    if (!bracketData?.matches) return;
    const matches = bracketData.matches || [];
    
    const live = matches.filter(m => m.lotMatchStatus === 'live' || m.lotMatchStatus === 'warmup' || m.match_status === 'live');
    const upcoming = matches.filter(m => (!m.lotMatchStatus || m.lotMatchStatus === 'scheduled') && m.match_status !== 'completed' && !m.is_bye && m.has_lot_data);
    const completed = matches.filter(m => m.lotMatchStatus === 'completed' || m.match_status === 'completed');

    setLiveMatches(live);
    setUpcomingMatches(upcoming.slice(0, 5));
    setCompletedMatches(completed.slice(0, 5));
    setLastSyncTime(new Date());
  }, [bracketData]);

  const totalTeams = teams.length || (slots?.totalConfirmed || bracketData?.team_count || 0);
  const verifiedTeams = teams.filter(t => t.status === 'VERIFIED').length;
  const totalMatchesCount = bracketData?.matches?.filter(m => !m.is_bye)?.length || 0;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 font-mono">
      
      {/* Real-time Tournament Operations Header Banner */}
      <div className="glass-panel p-6 border-l-4 border-l-neon-cyan flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-neon-cyan uppercase tracking-widest mb-1">
            <Activity className="w-4 h-4 text-neon-cyan animate-pulse" /> TOURNAMENT OPERATIONS CENTER
          </div>
          <h2 className="text-2xl font-bold font-heading text-white uppercase tracking-wider">
            Live Season Command Hub
          </h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-xl">
            Real-time status monitor connected directly to official match servers, live brackets, and broadcast streams.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <span className="text-[10px] text-zinc-500 uppercase block font-bold">API PULSE</span>
            <span className="text-xs text-emerald-400 font-bold flex items-center gap-1.5 justify-end">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
              {lastSyncTime.toLocaleTimeString()}
            </span>
          </div>
          <Link
            to="/match-center"
            onClick={playClick}
            className="bg-neon-pink hover:bg-neon-pink/80 text-white font-bold text-xs px-4 py-2.5 rounded flex items-center gap-2 shadow-[0_0_15px_rgba(240,0,255,0.4)] transition-all uppercase"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>MATCH CENTER</span>
          </Link>
        </div>
      </div>

      {/* Operations Quick Stats Matrix */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-black/50 border border-white/10 p-4 rounded-xl text-center">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block mb-1">REGISTERED TEAMS</span>
          <span className="text-2xl font-bold text-white font-heading">{totalTeams} / 30</span>
          <span className="text-[9px] text-emerald-400 block font-bold mt-1">✓ {verifiedTeams} VERIFIED</span>
        </div>

        <div className="bg-black/50 border border-white/10 p-4 rounded-xl text-center">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block mb-1">TOTAL MATCHES</span>
          <span className="text-2xl font-bold text-neon-cyan font-heading">{totalMatchesCount > 0 ? `${totalMatchesCount} MATCHES` : 'BRACKET READY'}</span>
          <span className="text-[9px] text-zinc-400 block font-bold mt-1">SINGLE ELIMINATION</span>
        </div>

        <div className="bg-black/50 border border-neon-pink/30 p-4 rounded-xl text-center bg-neon-pink/5">
          <span className="text-[10px] text-neon-pink font-bold uppercase tracking-widest block mb-1">LIVE MATCHES</span>
          <span className="text-2xl font-bold text-neon-pink font-heading flex items-center justify-center gap-2">
            <Flame className="w-5 h-5 text-neon-pink animate-pulse" />
            {liveMatches.length} LIVE
          </span>
          <span className="text-[9px] text-zinc-400 block font-bold mt-1">REAL-TIME SCORES</span>
        </div>

        <div className="bg-black/50 border border-white/10 p-4 rounded-xl text-center">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block mb-1">ANTI-CHEAT ENGINE</span>
          <span className="text-2xl font-bold text-green-400 font-heading">AKROS V3.2</span>
          <span className="text-[9px] text-green-400 block font-bold mt-1">🟢 CLIENT MANDATORY</span>
        </div>
      </div>

      {/* Main Grid: Live Scoreboards & Stage Timeline */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left Column: Live Matches & Scoreboard Cards */}
        <div className="md:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 font-heading">
              <span className="w-2.5 h-2.5 bg-neon-pink rounded-full animate-ping" />
              LIVE MATCHES ON SERVER ({liveMatches.length})
            </h3>
            <span className="text-[10px] text-zinc-500 font-bold">PROTECTED MATCH INFRASTRUCTURE</span>
          </div>

          {liveMatches.length > 0 ? (
            liveMatches.map((m, idx) => (
              <div key={m.id || idx} className="bg-black/60 border border-neon-pink/40 p-5 rounded-2xl relative overflow-hidden shadow-[0_0_30px_rgba(240,0,255,0.15)]">
                <div className="absolute top-0 right-0 bg-neon-pink text-white text-[9px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-widest flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" /> LIVE MAP // {m.current_map || m.map || 'CS2 SERVER'}
                </div>

                <div className="text-[10px] text-zinc-400 uppercase font-bold mb-4">{m.matchStage || `Round ${m.round_id || 1}`}</div>

                <div className="flex items-center justify-between gap-4">
                  {/* Team 1 */}
                  <button
                    onClick={() => onSelectTeam && onSelectTeam({ name: m.team1?.name || "TBD", tag: m.team1?.tag || "" })}
                    className="flex flex-col items-center gap-2 group flex-1 text-center"
                  >
                    <div className="w-14 h-14 bg-zinc-900 border border-white/20 rounded-xl flex items-center justify-center p-2 group-hover:border-neon-cyan transition-colors">
                      {m.team1?.logo ? (
                        <img src={m.team1.logo} alt="Team 1" className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-neon-cyan font-bold text-sm font-heading">{m.team1?.tag || m.team1?.name?.substring(0, 3) || 'T1'}</span>
                      )}
                    </div>
                    <span className="text-xs font-bold text-white group-hover:text-neon-cyan transition-colors uppercase truncate max-w-[140px]">
                      {m.team1?.name || 'TBD'}
                    </span>
                  </button>

                  {/* Live Score */}
                  <div className="flex flex-col items-center justify-center px-4">
                    <div className="text-3xl sm:text-4xl font-heading font-black text-white tracking-widest bg-zinc-900/90 border border-white/10 px-4 py-2 rounded-xl text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan via-white to-neon-pink">
                      {m.score1 ?? m.team1?.score ?? 0} : {m.score2 ?? m.team2?.score ?? 0}
                    </div>
                    <span className="text-[10px] text-zinc-400 font-bold uppercase mt-2">{m.lotMatchStatus ? m.lotMatchStatus.toUpperCase() : 'LIVE MATCH'}</span>
                  </div>

                  {/* Team 2 */}
                  <button
                    onClick={() => onSelectTeam && onSelectTeam({ name: m.team2?.name || "TBD", tag: m.team2?.tag || "" })}
                    className="flex flex-col items-center gap-2 group flex-1 text-center"
                  >
                    <div className="w-14 h-14 bg-zinc-900 border border-white/20 rounded-xl flex items-center justify-center p-2 group-hover:border-neon-cyan transition-colors">
                      {m.team2?.logo ? (
                        <img src={m.team2.logo} alt="Team 2" className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-neon-pink font-bold text-sm font-heading">{m.team2?.tag || m.team2?.name?.substring(0, 3) || 'T2'}</span>
                      )}
                    </div>
                    <span className="text-xs font-bold text-white group-hover:text-neon-cyan transition-colors uppercase truncate max-w-[140px]">
                      {m.team2?.name || 'TBD'}
                    </span>
                  </button>
                </div>

                {/* Server & Action Footer */}
                <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <Server className="w-3.5 h-3.5" />
                    <span className="text-[11px]">Protected Tournament Server</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {onGenerateDiscordSheet && (
                      <button
                        onClick={() => onGenerateDiscordSheet(m)}
                        className="bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 font-bold text-[11px] px-3 py-1.5 rounded flex items-center gap-1.5 transition"
                      >
                        <Tv className="w-3.5 h-3.5" />
                        <span>DISCORD SHEET</span>
                      </button>
                    )}

                    <Link
                      to="/match-center"
                      onClick={playClick}
                      className="bg-white/10 hover:bg-white/20 text-white font-bold text-[11px] px-3.5 py-1.5 rounded flex items-center gap-1.5 transition"
                    >
                      <span>SPECTATE IN MATCH CENTER</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-black/40 border border-white/10 p-8 rounded-2xl text-center space-y-3">
              <Calendar className="w-8 h-8 text-zinc-600 mx-auto" />
              <h4 className="text-sm font-bold text-white uppercase font-heading">No Matches Currently Live</h4>
              <p className="text-xs text-zinc-400 max-w-md mx-auto">
                All scheduled bracket matches are monitored in real time. As soon as match servers launch, live scores will stream here automatically.
              </p>
              <div className="pt-2">
                <Link
                  to="/match-center"
                  onClick={playClick}
                  className="inline-flex items-center gap-2 bg-neon-cyan/15 hover:bg-neon-cyan/25 border border-neon-cyan/40 text-neon-cyan text-xs font-bold px-4 py-2 rounded transition"
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>VIEW MATCH CENTER</span>
                </Link>
              </div>
            </div>
          )}

          {/* Upcoming Matches List */}
          {upcomingMatches.length > 0 && (
            <div className="bg-black/50 border border-white/10 p-5 rounded-2xl space-y-3 mt-6">
              <h4 className="text-xs font-bold text-white uppercase font-heading tracking-wider">
                Upcoming Bracket Matches ({upcomingMatches.length})
              </h4>
              <div className="space-y-2">
                {upcomingMatches.map((m, idx) => (
                  <div key={m.id || idx} className="bg-black/40 border border-white/5 p-3 rounded-xl flex items-center justify-between text-xs">
                    <span className="text-zinc-400 font-bold uppercase">{m.matchStage || `Match #${m.id}`}</span>
                    <span className="text-white font-bold">{m.team1?.name || 'TBD'} vs {m.team2?.name || 'TBD'}</span>
                    <span className="text-indigo-400 text-[10px] font-bold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/30">SCHEDULED</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Stage Timeline & Quick Actions */}
        <div className="md:col-span-4 space-y-6">
          
          {/* Tournament Stage Timeline */}
          <div className="bg-black/50 border border-white/10 p-5 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-heading flex items-center gap-2">
              <Clock className="w-4 h-4 text-neon-cyan" /> SEASON PROGRESSION
            </h3>

            <div className="space-y-4 relative pl-4 border-l border-white/10 text-xs">
              <div className="relative">
                <div className="absolute -left-[21px] top-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-black" />
                <span className="text-[10px] text-emerald-400 font-bold block uppercase">COMPLETED</span>
                <span className="text-white font-bold block">Roster Registration & Verification</span>
                <span className="text-[9px] text-zinc-500">Official Roster Lock</span>
              </div>

              <div className="relative pt-1">
                <div className="absolute -left-[21px] top-2 w-3 h-3 bg-neon-cyan rounded-full border-2 border-black animate-ping" />
                <span className="text-[10px] text-neon-cyan font-bold block uppercase">ACTIVE STAGE</span>
                <span className="text-white font-bold block">Single Elimination Playoff Draw</span>
                <span className="text-[9px] text-zinc-400">{tournament?.displayDate || 'July 31 - August 03'}</span>
              </div>

              <div className="relative pt-1 opacity-50">
                <div className="absolute -left-[21px] top-2 w-3 h-3 bg-zinc-700 rounded-full border-2 border-black" />
                <span className="text-[10px] text-zinc-500 font-bold block uppercase">UPCOMING STAGE</span>
                <span className="text-white font-bold block">Grand Finals BO3</span>
                <span className="text-[9px] text-zinc-500">{tournament?.displayTime || '8:00 PM PKT'}</span>
              </div>
            </div>
          </div>

          {/* Quick Broadcast Links */}
          <div className="bg-black/50 border border-white/10 p-5 rounded-2xl space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-heading flex items-center gap-2">
              <Tv className="w-4 h-4 text-[#9146FF]" /> OFFICIAL BROADCASTS
            </h3>
            <a
              href="https://www.twitch.tv/pXpLgg"
              target="_blank"
              rel="noreferrer"
              className="bg-[#6441a5]/20 hover:bg-[#6441a5]/30 border border-[#9146FF]/40 text-white p-3 rounded-xl flex items-center justify-between text-xs font-bold transition group"
            >
              <div className="flex items-center gap-2.5">
                <Tv className="w-4 h-4 text-[#9146FF]" />
                <span>Twitch Stream (Official)</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white transition" />
            </a>
          </div>

        </div>

      </div>
    </div>
  );
};
