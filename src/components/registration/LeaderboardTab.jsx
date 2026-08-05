import React, { useState, useEffect } from 'react';
import { Trophy, Flame, Zap, Award, Search, TrendingUp, ShieldAlert, Target } from 'lucide-react';
import { LotGamingAdapter } from '../../match-center/infrastructure/LotGamingAdapter.js';
import { getTeamLogoUrl, getTeamTag } from '../../utils/teamResolver.js';

export function LeaderboardTab() {
  const [leaderboardData, setLeaderboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('hltv_rating'); // 'hltv_rating' | 'rating' (Impact) | 'kd' | 'adr' | 'kills' | 'hs_percent'

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
    return !query || p.name.toLowerCase().includes(query) || p.team_name.toLowerCase().includes(query) || p.steam_id.includes(query);
  });

  const sortedPlayers = [...filteredPlayers].sort((a, b) => {
    const valA = parseFloat(a[sortBy] ?? 0);
    const valB = parseFloat(b[sortBy] ?? 0);
    return valB - valA;
  });

  const topScorer = players.reduce((max, p) => (p.kills > (max?.kills || 0) ? p : max), null);
  const topMvp = players.reduce((max, p) => (p.hltv_rating > (max?.hltv_rating || 0) ? p : max), null);
  const topEntry = players.reduce((max, p) => (p.entry_kills > (max?.entry_kills || 0) ? p : max), null);
  const topHs = players.reduce((max, p) => (p.hs_percent > (max?.hs_percent || 0) ? p : max), null);

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

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-mono animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="glass-panel p-6 border-l-4 border-l-amber-500 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-widest mb-1">
            <Trophy className="w-4 h-4 text-amber-400 animate-pulse" /> OFFICIAL SEASON LEADERBOARD
          </div>
          <h2 className="text-2xl font-bold font-heading text-white uppercase tracking-wider">
            {leaderboardData?.season?.name || 'PixelPalace Community Cup 2'}
          </h2>
          <p className="text-sm text-zinc-400 mt-1">
            Ranked player performance matrix across {leaderboardData?.match_count || 27} official bracket matches. Powered by FLUX Impact Rating & HLTV 2.0.
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
            <span className="text-lg font-bold text-amber-400 font-heading">{players.length} PLAYERS</span>
          </div>
        </div>
      </div>

      {/* Featured MVP Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
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
      <div className="bg-black/60 border border-white/10 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search player, team or Steam ID..."
            className="w-full bg-zinc-900 border border-white/10 text-white text-sm pl-9 pr-3 py-2 rounded-xl focus:border-amber-400 focus:outline-none transition-colors"
          />
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-2 text-xs font-bold w-full sm:w-auto overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
          <span className="text-zinc-500 uppercase tracking-widest shrink-0 text-[10px]">SORT BY:</span>
          {[
            { id: 'hltv_rating', label: 'HLTV 2.0' },
            { id: 'rating', label: 'FLUX IMPACT' },
            { id: 'kd', label: 'K/D' },
            { id: 'adr', label: 'ADR' },
            { id: 'kills', label: 'KILLS' },
            { id: 'hs_percent', label: 'HS %' },
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => setSortBy(opt.id)}
              className={`px-3 py-1.5 rounded-lg border transition-all shrink-0 uppercase ${
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
            <table className="w-full text-left border-collapse text-sm">
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
                    <tr key={p.steam_id || idx} className="hover:bg-white/[0.04] transition-colors">
                      <td className="py-3.5 px-4 text-center font-bold" style={{ color: rankColor }}>
                        {rank === 1 ? '🥇 1' : rank === 2 ? '🥈 2' : rank === 3 ? '🥉 3' : rank}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white text-base flex items-center gap-1.5">
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
