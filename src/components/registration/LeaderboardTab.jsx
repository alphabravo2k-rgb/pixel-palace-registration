import React, { useState, useEffect, useCallback } from 'react';
import { Trophy, Flame, Zap, Award, Search, TrendingUp, ShieldAlert, Target, X, User, ChevronUp, ChevronDown } from 'lucide-react';
import { LotGamingAdapter } from '../../match-center/infrastructure/LotGamingAdapter.js';
import { getTeamLogoUrl, getTeamTag } from '../../utils/teamResolver.js';

// ── Player Detail Modal ──────────────────────────────────────────────────────
function PlayerDetailModal({ player, rank, onClose }) {
  if (!player) return null;

  const statRows = [
    { label: 'HLTV 2.0 Rating', value: player.hltv_rating, color: '#f59e0b', highlight: true },
    { label: 'FLUX Impact Rating', value: player.rating, color: '#00f0ff', highlight: true },
    { label: 'Total Kills', value: player.kills, color: '#34d399' },
    { label: 'Total Deaths', value: player.deaths, color: '#f43f5e' },
    { label: 'Assists', value: player.assists, color: '#a78bfa' },
    { label: 'K/D Ratio', value: player.kd, color: player.kd >= 1.0 ? '#34d399' : '#f43f5e' },
    { label: 'ADR', value: player.adr, color: '#e2e8f0' },
    { label: 'KAST %', value: `${player.kast_pct}%`, color: '#e2e8f0' },
    { label: 'HS %', value: `${player.hs_percent}%`, color: '#34d399' },
    { label: 'Entry Kills', value: player.entry_kills, color: '#fbbf24' },
    { label: 'Opening Deaths', value: player.opening_deaths, color: '#f43f5e' },
    { label: 'Matches Played', value: player.matches, color: '#e2e8f0' },
    { label: 'Rounds Played', value: player.rounds, color: '#94a3b8' },
  ];

  const multikills = [
    { label: '2K Rounds', value: player.multikill_2k, color: '#6366f1' },
    { label: '3K Rounds', value: player.multikill_3k, color: '#8b5cf6' },
    { label: '4K Rounds', value: player.multikill_4k, color: '#f59e0b' },
    { label: 'ACES (5K)', value: player.multikill_5k, color: '#ef4444' },
  ].filter(m => m.value > 0);

  const teamLogo = getTeamLogoUrl(player.team_name);
  const rankColors = { 1: '#f59e0b', 2: '#94a3b8', 3: '#b45309' };
  const rankColor = rankColors[rank] || '#6366f1';

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative bg-[#0a0d1a] border border-violet-500/40 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto custom-scrollbar shadow-[0_0_60px_rgba(139,92,246,0.3)]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="p-5 border-b border-white/10 sticky top-0 z-10"
          style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(10,13,26,0.98))' }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Rank Badge */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black font-mono border-2 shrink-0"
                style={{ borderColor: rankColor, color: rankColor, background: `${rankColor}15` }}
              >
                {rank <= 3 ? ['🥇','🥈','🥉'][rank-1] : `#${rank}`}
              </div>
              {/* Team + Player */}
              <div>
                <div className="flex items-center gap-2">
                  {teamLogo && <img src={teamLogo} alt={player.team_name} className="w-6 h-6 object-contain" />}
                  <span className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest font-mono">{player.team_name}</span>
                </div>
                <h2 className="text-xl font-black text-white font-heading uppercase tracking-tight leading-none mt-0.5">{player.name}</h2>
                <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{player.steam_id}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg p-1.5 transition shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Headline stats: HLTV + FLUX */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-center">
              <div className="text-[9px] text-amber-400 font-bold uppercase tracking-widest">HLTV 2.0</div>
              <div className="text-2xl font-black text-amber-400 font-mono">{player.hltv_rating}</div>
            </div>
            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-3 text-center">
              <div className="text-[9px] text-cyan-400 font-bold uppercase tracking-widest">FLUX IMPACT</div>
              <div className="text-2xl font-black text-cyan-400 font-mono">{player.rating}</div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {statRows.slice(2).map(({ label, value, color }) => (
              <div key={label} className="bg-black/40 border border-white/5 rounded-lg p-2.5 flex flex-col">
                <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">{label}</span>
                <span className="text-sm font-black font-mono mt-0.5" style={{ color }}>{value ?? '—'}</span>
              </div>
            ))}
          </div>

          {/* Multikill section */}
          {multikills.length > 0 && (
            <div className="bg-black/40 border border-white/10 rounded-xl p-3 space-y-2">
              <span className="text-[9px] text-zinc-400 uppercase tracking-widest font-bold block">🔥 MULTIKILL ROUNDS</span>
              <div className="flex gap-2 flex-wrap">
                {multikills.map(({ label, value, color }) => (
                  <div key={label} className="flex-1 text-center bg-black/60 border border-white/10 rounded-lg p-2">
                    <div className="text-lg font-black font-mono" style={{ color }}>{value}</div>
                    <div className="text-[8px] text-zinc-500 font-bold uppercase">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Entry diff */}
          <div className="text-center text-[10px] font-mono text-zinc-500">
            Entry Diff: <span className={`font-bold ${ (player.entry_kills - player.opening_deaths) > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {(player.entry_kills - player.opening_deaths) >= 0 ? '+' : ''}{player.entry_kills - player.opening_deaths}
            </span> · {player.matches} match{player.matches !== 1 ? 'es' : ''} · {player.rounds} rounds
          </div>
        </div>
      </div>
    </div>
  );
}

export function LeaderboardTab() {
  const [leaderboardData, setLeaderboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('kills'); // Default locked to 'kills' as requested!
  const [stageFilter, setStageFilter] = useState('all'); // 'all' | 'semis_plus' | 'playoffs' | 'group'
  const [minMatches, setMinMatches] = useState(0); // 0 | 2 | 3
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [selectedPlayerRank, setSelectedPlayerRank] = useState(null);

  useEffect(() => {
    let active = true;
    const loadLeaderboard = async () => {
      setLoading(true);
      const data = await LotGamingAdapter.fetchSeasonLeaderboard(1);
      if (active) {
        setLeaderboardData(data);
        setLoading(false);
      }
    };
    loadLeaderboard();
    return () => { active = false; };
  }, []);

  const players = leaderboardData?.players || [];

  const filteredPlayers = players.filter(p => {
    const query = searchQuery.toLowerCase().trim();
    const matchesMatch = (p.matches || 0) >= minMatches;
    const textMatch = !query || p.name.toLowerCase().includes(query) || p.team_name.toLowerCase().includes(query) || p.steam_id.includes(query);
    
    let stageMatch = true;
    if (stageFilter === 'semis_plus') {
      stageMatch = p.played_semis === true || p.stage === 'semis' || p.stage === 'finals' || (p.matches || 0) >= 3;
    } else if (stageFilter === 'playoffs') {
      stageMatch = p.played_playoffs === true || p.stage === 'playoffs' || (p.matches || 0) >= 2;
    } else if (stageFilter === 'group') {
      stageMatch = p.stage === 'group' || (p.matches || 0) >= 1;
    }

    return matchesMatch && textMatch && stageMatch;
  });

  const sortedPlayers = [...filteredPlayers].sort((a, b) => {
    const valA = parseFloat(a[sortBy] ?? 0);
    const valB = parseFloat(b[sortBy] ?? 0);
    if (valB !== valA) return valB - valA;
    return parseFloat(b.hltv_rating ?? 0) - parseFloat(a.hltv_rating ?? 0);
  });

  const topScorer = players.reduce((max, p) => (p.kills > (max?.kills || 0) ? p : max), null);
  const topMvp = players.reduce((max, p) => (p.hltv_rating > (max?.hltv_rating || 0) ? p : max), null);
  const topEntry = players.reduce((max, p) => (p.entry_kills > (max?.entry_kills || 0) ? p : max), null);
  const topHs = players.reduce((max, p) => (p.hs_percent > (max?.hs_percent || 0) ? p : max), null);

  // Player of the Tournament (Filtered from Semis & Finals as specified by owners)
  const semisEligiblePlayers = players.filter(p => p.played_semis === true || p.stage === 'semis' || p.stage === 'finals' || (p.matches || 0) >= 3);
  const playerOfTheTournament = (semisEligiblePlayers.length > 0 ? semisEligiblePlayers : players).reduce((max, p) => {
    const scoreP = ((p.kills || 0) * 1.2) + (parseFloat(p.hltv_rating || 0) * 15) + (parseFloat(p.rating || 0) * 10);
    const scoreMax = max ? (((max.kills || 0) * 1.2) + (parseFloat(max.hltv_rating || 0) * 15) + (parseFloat(max.rating || 0) * 10)) : -1;
    return scoreP > scoreMax ? p : max;
  }, null);

  const exportCsv = () => {
    if (!players.length) return;
    const headers = ['Rank', 'Player', 'SteamID', 'Team', 'Matches', 'Rounds', 'HLTV Rating', 'Impact Rating', 'Kills', 'Deaths', 'Assists', 'KD', 'ADR', 'KAST Pct', 'HS Pct', 'Entry Kills'];
    const rows = sortedPlayers.map((p, idx) => [
      idx + 1,
      `"${p.name}"`,
      `"${p.steam_id}"`,
      `"${p.team_name}"`,
      p.matches,
      p.rounds,
      p.hltv_rating,
      p.rating,
      p.kills,
      p.deaths,
      p.assists,
      p.kd,
      p.adr,
      p.kast_pct,
      p.hs_percent,
      p.entry_kills
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `pixel_palace_season1_leaderboard.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ── Summary Stats Bar ──────────────────────────────────────────────────────
  const summaryStats = (() => {
    if (!players.length) return null;
    const totalKills = players.reduce((s, p) => s + (p.kills || 0), 0);
    const totalRounds = players.reduce((s, p) => s + (p.rounds || 0), 0) / Math.max(players.length, 1);
    const avgRating = (players.reduce((s, p) => s + parseFloat(p.hltv_rating || 0), 0) / players.length).toFixed(2);
    const avgKd = (players.reduce((s, p) => s + parseFloat(p.kd || 0), 0) / players.length).toFixed(2);
    const totalAces = players.reduce((s, p) => s + (p.multikill_5k || 0), 0);
    const avgAdr = (players.reduce((s, p) => s + parseFloat(p.adr || 0), 0) / players.length).toFixed(1);
    return { totalKills, avgRating, avgKd, totalAces, avgAdr, totalRounds: Math.round(totalRounds) };
  })();

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-mono animate-in fade-in duration-300">
      {/* Player Detail Modal */}
      {selectedPlayer && (
        <PlayerDetailModal
          player={selectedPlayer}
          rank={selectedPlayerRank}
          onClose={() => { setSelectedPlayer(null); setSelectedPlayerRank(null); }}
        />
      )}
      
      {/* Header Banner */}
      <div className="glass-panel p-6 border-l-4 border-l-amber-500 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-widest mb-1">
            <Trophy className="w-4 h-4 text-amber-400 animate-pulse" /> OFFICIAL SEASON LEADERBOARD
          </div>
          <h2 className="text-2xl font-bold font-heading text-white uppercase tracking-wider">
            {leaderboardData?.season?.name || 'PixelPalace Community Cup 2'}
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Ranked player performance matrix across {leaderboardData?.match_count || 27} official bracket matches. Default locked to Kills.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportCsv}
            className="bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition"
          >
            <span>EXPORT CSV</span>
          </button>
          <div className="bg-black/60 border border-white/10 px-4 py-2 rounded-xl text-right">
            <span className="text-[10px] text-zinc-500 uppercase block font-bold">TOTAL PLAYERS</span>
            <span className="text-lg font-bold text-amber-400 font-heading">{sortedPlayers.length} / {players.length}</span>
          </div>
        </div>
      </div>

      {/* ── Tournament Summary Stat Bar ── */}
      {summaryStats && (
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
          {[
            { label: 'TOTAL KILLS', value: summaryStats.totalKills.toLocaleString(), color: '#34d399', icon: '💥' },
            { label: 'AVG HLTV 2.0', value: summaryStats.avgRating, color: '#f59e0b', icon: '📊' },
            { label: 'AVG K/D', value: summaryStats.avgKd, color: '#00f0ff', icon: '⚔️' },
            { label: 'AVG ADR', value: summaryStats.avgAdr, color: '#a78bfa', icon: '💣' },
            { label: 'TOTAL ACES', value: summaryStats.totalAces, color: '#ef4444', icon: '🎯' },
            { label: 'AVG ROUNDS', value: summaryStats.totalRounds, color: '#94a3b8', icon: '🔄' },
          ].map(({ label, value, color, icon }) => (
            <div key={label} className="bg-black/50 border border-white/5 hover:border-white/10 rounded-xl p-3 text-center transition group">
              <div className="text-base mb-0.5">{icon}</div>
              <div className="font-black font-mono text-base" style={{ color }}>{value}</div>
              <div className="text-[8px] text-zinc-500 uppercase tracking-widest font-bold mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Featured MVP & Tournament Award Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
        {playerOfTheTournament && (
          <div className="bg-gradient-to-b from-amber-500/20 via-purple-900/30 to-black/80 border-2 border-amber-400/60 p-4 rounded-2xl flex items-center gap-3 relative overflow-hidden shadow-[0_0_25px_rgba(245,158,11,0.25)] sm:col-span-1">
            <div className="w-10 h-10 rounded-xl bg-amber-400/30 border border-amber-400/60 flex items-center justify-center text-amber-300 shrink-0">
              <Award className="w-6 h-6 animate-bounce" />
            </div>
            <div className="min-w-0">
              <span className="text-[8px] font-extrabold text-amber-400 uppercase tracking-widest block">PLAYER OF TOURNAMENT</span>
              <span className="text-[7px] text-amber-300 font-bold block">(SEMIS & FINALS POOL)</span>
              <h3 className="text-xs font-black text-white uppercase font-heading truncate">{playerOfTheTournament.name}</h3>
              <span className="text-[10px] text-zinc-300 block font-bold truncate">{playerOfTheTournament.team_name} · {playerOfTheTournament.kills} K</span>
            </div>
          </div>
        )}

        {topMvp && (
          <div className="bg-gradient-to-b from-amber-500/10 to-black/60 border border-amber-500/40 p-4 rounded-2xl flex items-center gap-3 relative overflow-hidden shadow-[0_0_20px_rgba(245,158,11,0.15)]">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <Trophy className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[8px] font-bold text-amber-400 uppercase tracking-widest block">SEASON MVP</span>
              <h3 className="text-xs font-bold text-white uppercase font-heading truncate">{topMvp.name}</h3>
              <span className="text-[10px] text-zinc-400 block font-bold truncate">{topMvp.team_name} · {topMvp.hltv_rating}</span>
            </div>
          </div>
        )}

        {topScorer && (
          <div className="bg-gradient-to-b from-neon-pink/10 to-black/60 border border-neon-pink/40 p-4 rounded-2xl flex items-center gap-3 relative overflow-hidden shadow-[0_0_20px_rgba(240,0,255,0.15)]">
            <div className="w-10 h-10 rounded-xl bg-neon-pink/20 border border-neon-pink/40 flex items-center justify-center text-neon-pink shrink-0">
              <Flame className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[8px] font-bold text-neon-pink uppercase tracking-widest block">TOP FRAGGER</span>
              <h3 className="text-xs font-bold text-white uppercase font-heading truncate">{topScorer.name}</h3>
              <span className="text-[10px] text-zinc-400 block font-bold truncate">{topScorer.team_name} · {topScorer.kills} KILLS</span>
            </div>
          </div>
        )}

        {topEntry && (
          <div className="bg-gradient-to-b from-neon-cyan/10 to-black/60 border border-neon-cyan/40 p-4 rounded-2xl flex items-center gap-3 relative overflow-hidden shadow-[0_0_20px_rgba(0,240,255,0.15)]">
            <div className="w-10 h-10 rounded-xl bg-neon-cyan/20 border border-neon-cyan/40 flex items-center justify-center text-neon-cyan shrink-0">
              <Target className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[8px] font-bold text-neon-cyan uppercase tracking-widest block">ENTRY KING</span>
              <h3 className="text-xs font-bold text-white uppercase font-heading truncate">{topEntry.name}</h3>
              <span className="text-[10px] text-zinc-400 block font-bold truncate">{topEntry.team_name} · {topEntry.entry_kills} OPENINGS</span>
            </div>
          </div>
        )}

        {topHs && (
          <div className="bg-gradient-to-b from-emerald-500/10 to-black/60 border border-emerald-500/40 p-4 rounded-2xl flex items-center gap-3 relative overflow-hidden shadow-[0_0_20px_rgba(16,185,129,0.15)]">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest block">SHARPSHOOTER</span>
              <h3 className="text-xs font-bold text-white uppercase font-heading truncate">{topHs.name}</h3>
              <span className="text-[10px] text-zinc-400 block font-bold truncate">{topHs.team_name} · {topHs.hs_percent}% HS</span>
            </div>
          </div>
        )}
      </div>

      {/* Filter & Sort Control Bar */}
      <div className="bg-black/60 border border-white/10 p-4 rounded-2xl space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4 flex-wrap">
        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search player, team or Steam ID..."
            className="w-full bg-zinc-900 border border-white/10 text-white text-xs pl-9 pr-3 py-2 rounded-xl focus:border-amber-400 focus:outline-none transition-colors"
          />
        </div>

        {/* Stage Wise Filter */}
        <div className="flex items-center gap-1.5 text-xs font-bold">
          <span className="text-zinc-500 uppercase tracking-widest shrink-0 text-[10px]">STAGE:</span>
          {[
            { id: 'all', label: 'ALL STAGES' },
            { id: 'semis_plus', label: 'SEMIS & FINALS' },
            { id: 'playoffs', label: 'PLAYOFFS' },
            { id: 'group', label: 'GROUP STAGE' },
          ].map(stg => (
            <button
              key={stg.id}
              onClick={() => setStageFilter(stg.id)}
              className={`px-2.5 py-1.5 rounded-lg border text-[11px] transition-all shrink-0 font-mono ${
                stageFilter === stg.id
                  ? 'bg-purple-500/20 border-purple-400 text-purple-300 font-bold'
                  : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'
              }`}
            >
              {stg.label}
            </button>
          ))}
        </div>

        {/* Min Matches Filter */}
        <div className="flex items-center gap-1.5 text-xs font-bold">
          <span className="text-zinc-500 uppercase tracking-widest shrink-0 text-[10px]">MIN MATCHES:</span>
          {[
            { num: 0, label: 'ALL' },
            { num: 2, label: '2+ MATCHES' },
            { num: 3, label: '3+ MATCHES' },
          ].map(m => (
            <button
              key={m.num}
              onClick={() => setMinMatches(m.num)}
              className={`px-2 py-1.5 rounded-lg border text-[10px] transition-all shrink-0 font-mono ${
                minMatches === m.num
                  ? 'bg-blue-500/20 border-blue-400 text-blue-300 font-bold'
                  : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-1.5 text-xs font-bold w-full sm:w-auto overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
          <span className="text-zinc-500 uppercase tracking-widest shrink-0 text-[10px]">SORT BY:</span>
          {[
            { id: 'kills', label: 'KILLS (DEFAULT)' },
            { id: 'hltv_rating', label: 'HLTV 2.0' },
            { id: 'rating', label: 'FLUX IMPACT' },
            { id: 'kd', label: 'K/D' },
            { id: 'adr', label: 'ADR' },
            { id: 'hs_percent', label: 'HS %' },
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => setSortBy(opt.id)}
              className={`px-2.5 py-1.5 rounded-lg border text-[11px] transition-all shrink-0 uppercase ${
                sortBy === opt.id
                  ? 'bg-amber-500/20 border-amber-400 text-amber-400 font-bold'
                  : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard Data Table */}
      <div className="bg-[#080b18] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        {loading ? (
          <div className="p-12 text-center text-zinc-500 uppercase font-bold text-xs animate-pulse">
            Loading Official Season Leaderboard Matrix...
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-zinc-900/80 text-[10px] text-zinc-400 uppercase tracking-widest font-bold">
                  <th className="py-3 px-4 text-center">#</th>
                  <th className="py-3 px-4">PLAYER</th>
                  <th className="py-3 px-4">TEAM</th>
                  <th className="py-3 px-4 text-center">MATCHES</th>
                  <th className="py-3 px-4 text-center">HLTV 2.0</th>
                  <th className="py-3 px-4 text-center">FLUX IMPACT</th>
                  <th className="py-3 px-4 text-center">K - D</th>
                  <th className="py-3 px-4 text-center">K/D</th>
                  <th className="py-3 px-4 text-center">ADR</th>
                  <th className="py-3 px-4 text-center">KAST%</th>
                  <th className="py-3 px-4 text-center">HS%</th>
                  <th className="py-3 px-4 text-center">ENTRY</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {sortedPlayers.map((p, idx) => {
                  const rank = idx + 1;
                  const rankColor = rank === 1 ? '#f59e0b' : rank === 2 ? '#94a3b8' : rank === 3 ? '#b45309' : '#64748b';

                  // Computed Tactical Math
                  const totalMultikills = (p.multikill_2k || 0) + (p.multikill_3k || 0) + (p.multikill_4k || 0) + (p.multikill_5k || 0);
                  const entryDiff = (p.entry_kills || 0) - (p.opening_deaths || 0);

                  return (
                    <tr
                      key={p.steam_id || idx}
                      className="hover:bg-white/[0.06] transition-colors cursor-pointer group"
                      onClick={() => { setSelectedPlayer(p); setSelectedPlayerRank(rank); }}
                      title={`Click to view ${p.name}'s detailed stats`}
                    >
                      <td className="py-3.5 px-4 text-center font-bold" style={{ color: rankColor }}>
                        {rank === 1 ? '🥇 1' : rank === 2 ? '🥈 2' : rank === 3 ? '🥉 3' : rank}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white text-sm flex items-center gap-1.5">
                          <span>{p.name}</span>
                          {p.multikill_5k > 0 && (
                            <span className="text-[9px] bg-red-500/20 border border-red-500/40 text-red-400 font-mono px-1 py-0.2 rounded" title={`${p.multikill_5k} ACE (5K)`}>
                              ACE x{p.multikill_5k}
                            </span>
                          )}
                          {p.multikill_4k > 0 && (
                            <span className="text-[9px] bg-amber-500/20 border border-amber-500/40 text-amber-400 font-mono px-1 py-0.2 rounded" title={`${p.multikill_4k} 4-Kills`}>
                              4K x{p.multikill_4k}
                            </span>
                          )}
                        </div>
                        <div className="text-[9px] text-zinc-500 font-mono">{p.steam_id}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          {getTeamLogoUrl(p.team_name) ? (
                            <img src={getTeamLogoUrl(p.team_name)} alt={p.team_name} className="w-5 h-5 object-contain" />
                          ) : null}
                          <span className="font-bold text-zinc-300 uppercase">{p.team_name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center text-zinc-400 font-bold">{p.matches} ({p.rounds}R)</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-black text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-lg border border-amber-400/30 text-sm">
                          {p.hltv_rating}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-black text-neon-cyan bg-neon-cyan/10 px-2 py-1 rounded border border-neon-cyan/30">
                          {p.rating}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold">
                        <span className="text-emerald-400">{p.kills}</span>
                        <span className="text-zinc-600 mx-1">-</span>
                        <span className="text-rose-400">{p.deaths}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold" style={{ color: p.kd >= 1.0 ? '#34d399' : '#f43f5e' }}>
                        {p.kd}
                      </td>
                      <td className="py-3.5 px-4 text-center text-zinc-200 font-bold">{p.adr}</td>
                      <td className="py-3.5 px-4 text-center text-zinc-300 font-bold">{p.kast_pct}%</td>
                      <td className="py-3.5 px-4 text-center text-zinc-400 font-bold">{p.hs_percent}%</td>
                      <td className="py-3.5 px-4 text-center font-bold">
                        <span className="text-amber-300">{p.entry_kills}</span>
                        {entryDiff !== 0 && (
                          <span className={`text-[10px] ml-1 ${entryDiff > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            ({entryDiff > 0 ? `+${entryDiff}` : entryDiff})
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
