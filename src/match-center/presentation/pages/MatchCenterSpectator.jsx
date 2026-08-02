/**
 * Match Center — API-Driven Match Detail Page
 * Three lifecycle states driven by Pixel Palace Platform API:
 *   PRE-MATCH  → Shows real teams, schedule, format, countdown
 *   LIVE       → Shows live scores, current map, round progress
 *   COMPLETED  → Shows final scores, winner, stats & full player scoreboard (when API provides them)
 *
 * NO hardcoded stats. Everything comes from the API or displays "Not yet available".
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { tournamentService } from '../../../services/TournamentService.js';
import { getTeamLogoUrl, getTeamTag } from '../../../utils/teamResolver.js';
import { getMatchSchedule, formatVisitorLocalTime, getLiveCountdown } from '../../../utils/matchSchedule.js';
import { getGoogleCalendarUrl } from '../../../utils/calendarHelper.js';
import { lotFluxbotAdapter, lotDlanAdapter, LotGamingAdapter } from '../../infrastructure/LotGamingAdapter.js';
import { Logger } from '../../shared/kernel/Logger.js';
import { StreamModal } from '../../../components/match-center/StreamModal.jsx';
import { CaptainCheckInModal } from '../../../components/team-portal/CaptainCheckInModal.jsx';
import { MatchShareCardModal } from '../../../components/modals/MatchShareCardModal.jsx';
import { generateSocialMatchCard } from '../../../utils/socialCardExporter.js';

// ─── Helpers ────────────────────────────────────────────────────────────────

const ROUND_NAMES = { 1: 'Round of 32', 2: 'Round of 16', 3: 'Quarterfinals', 4: 'Semifinals', 5: 'Grand Final' };

const FACEIT_LEVEL_COLORS = {
  1: '#cccccc', 2: '#cccccc', 3: '#f7a91e', 4: '#f7a91e', 5: '#f7a91e',
  6: '#f36e39', 7: '#f36e39', 8: '#f36e39', 9: '#ff3333', 10: '#ff0000',
};

function FaceitBadge({ faceit }) {
  if (!faceit) return null;
  const level = faceit.level || faceit.skill_level || 10;
  const elo = faceit.elo || faceit.faceit_elo || null;
  const color = FACEIT_LEVEL_COLORS[level] || '#ff0000';
  const url = (faceit.faceit_url || faceit.profileUrl)?.replace('{lang}', 'en');

  const content = (
    <span
      className="inline-flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded font-mono shrink-0"
      style={{ background: `${color}20`, color, border: `1px solid ${color}44` }}
      title={`FACEIT Level ${level}${elo ? ` · ${elo} ELO` : ''}`}
    >
      <svg width="8" height="8" viewBox="0 0 10 10" fill={color}>
        <polygon points="5,0 6.2,3.8 10,3.8 7,6.2 8.1,10 5,7.8 1.9,10 3,6.2 0,3.8 3.8,3.8" />
      </svg>
      LVL {level}{elo ? ` · ${elo}` : ''}
    </span>
  );

  if (url) {
    return <a href={url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>{content}</a>;
  }
  return content;
}

function getMatchPhase(status) {
  if (!status) return 'PRE_MATCH';
  const s = status.toUpperCase();
  if (s === 'LIVE' || s === 'PAUSED' || s === 'IN_PROGRESS') return 'LIVE';
  if (s === 'COMPLETED' || s === 'FINISHED' || s === 'WALKOVER') return 'COMPLETED';
  return 'PRE_MATCH';
}

function useCountdown(scheduledDate) {
  const [remaining, setRemaining] = useState('');
  useEffect(() => {
    if (!scheduledDate) { setRemaining(''); return; }
    const target = new Date(scheduledDate);
    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) { setRemaining('Starting soon'); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setRemaining(`${d > 0 ? `${d}d ` : ''}${h}h ${m}m`);
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [scheduledDate]);
  return remaining;
}

// ─── Team Card ───────────────────────────────────────────────────────────────

function TeamDisplay({ team, side = 'left', score = null, isWinner = false }) {
  const name = team?.name || 'TBD';
  const tag = team?.tag || getTeamTag(team) || '???';
  const logo = team?.logo || getTeamLogoUrl(team);

  return (
    <div className={`flex flex-col items-center gap-3 flex-1 ${side === 'right' ? 'items-center' : 'items-center'}`}>
      {/* Logo */}
      <div
        className="w-20 h-20 rounded-xl flex items-center justify-center text-2xl font-black overflow-hidden"
        style={{
          background: isWinner
            ? 'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(245,158,11,0.1))'
            : 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.1))',
          border: isWinner
            ? '2px solid rgba(251,191,36,0.5)'
            : '1px solid rgba(99,102,241,0.3)',
          boxShadow: isWinner ? '0 0 20px rgba(251,191,36,0.2)' : 'none',
          color: '#c4b5fd',
        }}
      >
        {logo
          ? <img src={logo} alt={name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
          : <span style={{ fontSize: 28 }}>{tag[0]}</span>}
      </div>

      {/* Score */}
      {score !== null && (
        <div
          className="text-4xl font-black font-mono"
          style={{
            color: isWinner ? '#fbbf24' : '#94a3b8',
            textShadow: isWinner ? '0 0 20px rgba(251,191,36,0.4)' : 'none',
          }}
        >
          {score}
        </div>
      )}

      {/* Name & tag */}
      <div className="text-center">
        <div
          className="font-black text-white text-lg"
          style={{ textShadow: isWinner ? '0 0 12px rgba(251,191,36,0.3)' : '0 0 8px rgba(255,255,255,0.1)' }}
        >
          {name}
        </div>
        <div className="text-[10px] font-mono tracking-widest mt-0.5" style={{ color: '#7c3aed' }}>
          {tag}
        </div>
      </div>

      {isWinner && (
        <div
          className="text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded font-mono"
          style={{ background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.4)', color: '#fbbf24' }}
        >
          🏆 WINNER
        </div>
      )}
    </div>
  );
}

// ─── Phase Badge ─────────────────────────────────────────────────────────────

function PhaseBadge({ phase }) {
  if (phase === 'LIVE') return (
    <span className="flex items-center gap-1.5 text-[11px] font-black tracking-widest uppercase font-mono px-3 py-1 rounded"
      style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)', color: '#34d399' }}>
      <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
      LIVE
    </span>
  );
  if (phase === 'COMPLETED') return (
    <span className="text-[11px] font-black tracking-widest uppercase font-mono px-3 py-1 rounded"
      style={{ background: 'rgba(100,116,139,0.15)', border: '1px solid rgba(100,116,139,0.3)', color: '#94a3b8' }}>
      ✓ COMPLETED
    </span>
  );
  return (
    <span className="text-[11px] font-black tracking-widest uppercase font-mono px-3 py-1 rounded"
      style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8' }}>
      ○ UPCOMING
    </span>
  );
}

// ─── Placeholder Section ──────────────────────────────────────────────────────

function PlaceholderSection({ icon, label, note }) {
  return (
    <div
      className="rounded-xl p-8 text-center"
      style={{ background: 'rgba(15,23,42,0.5)', border: '1px dashed rgba(99,102,241,0.2)' }}
    >
      <div className="text-3xl mb-3">{icon}</div>
      <div className="text-sm font-bold text-slate-400 font-mono tracking-wide">{label}</div>
      {note && <div className="text-[11px] text-slate-600 mt-1 font-mono">{note}</div>}
    </div>
  );
}

// ─── Player Scoreboard Table Component ────────────────────────────────────────

function PlayerScoreboardTable({ teamName, players = [], isWinner = false }) {
  if (!players || players.length === 0) return null;

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(13,17,40,0.8)', border: '1px solid rgba(99,102,241,0.18)' }}>
      <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: 'rgba(99,102,241,0.12)' }}>
        <span className="font-black text-sm text-white font-mono flex items-center gap-2">
          {teamName}
          {isWinner && <span className="text-[9px] bg-amber-500/20 border border-amber-500/40 text-amber-400 px-2 py-0.5 rounded uppercase">WINNER</span>}
        </span>
        <span className="text-[10px] font-mono text-slate-500">{players.length} Players</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs font-mono">
          <thead>
            <tr className="border-b text-[9px] uppercase text-slate-500 font-bold" style={{ borderColor: 'rgba(99,102,241,0.1)' }}>
              <th className="py-2.5 px-4">Player</th>
              <th className="py-2.5 px-2 text-center">K</th>
              <th className="py-2.5 px-2 text-center">D</th>
              <th className="py-2.5 px-2 text-center">A</th>
              <th className="py-2.5 px-2 text-center">+/-</th>
              <th className="py-2.5 px-2 text-center">ADR</th>
              <th className="py-2.5 px-2 text-center">HS%</th>
              <th className="py-2.5 px-2 text-center" title="KAST % (Kill, Assist, Survived or Traded rounds)">KAST</th>
              <th className="py-2.5 px-2 text-center" title="Opening / Entry Frags">FK</th>
              <th className="py-2.5 px-2 text-center" title="Clutches Won">CL</th>
              <th className="py-2.5 px-2 text-center" title="Multikills (2k/3k/4k/5k)">MK</th>
              <th className="py-2.5 px-3 text-right">Rating 2.0</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            {players.map((p, idx) => {
              const diff = (p.kills || 0) - (p.deaths || 0);
              const rating = p.hltv_rating || p.hltvRating || p.rating || 0;
              const entryKills = p.entry_kills ?? p.entryKills ?? 0;
              const kastPct = p.kast_pct ?? p.kastPct ?? 0;
              const clutches = p.clutches?.total ?? (p.clutch_1v1 || 0) + (p.clutch_1v2 || 0) + (p.clutch_1v3 || 0) + (p.clutch_1v4 || 0) + (p.clutch_1v5 || 0);
              
              const m2k = p.multikill_2k ?? p.multikills?.k2 ?? 0;
              const m3k = p.multikill_3k ?? p.multikills?.k3 ?? 0;
              const m4k = p.multikill_4k ?? p.multikills?.k4 ?? 0;
              const m5k = p.multikill_5k ?? p.multikills?.k5 ?? 0;
              const multikillCount = m2k + m3k + m4k + m5k;

              return (
                <tr key={p.steam_id || p.steamId || p.name || idx} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-2.5 px-4 font-bold text-slate-200 flex items-center gap-2">
                    {p.name}
                    <FaceitBadge faceit={p.faceit} />
                  </td>
                  <td className="py-2.5 px-2 text-center font-bold text-white">{p.kills || 0}</td>
                  <td className="py-2.5 px-2 text-center text-slate-400">{p.deaths || 0}</td>
                  <td className="py-2.5 px-2 text-center text-slate-400">{p.assists || 0}</td>
                  <td className={`py-2.5 px-2 text-center font-bold ${diff > 0 ? 'text-emerald-400' : diff < 0 ? 'text-rose-400' : 'text-slate-500'}`}>
                    {diff > 0 ? `+${diff}` : diff}
                  </td>
                  <td className="py-2.5 px-2 text-center text-slate-300">{p.adr ? Math.round(p.adr) : '-'}</td>
                  <td className="py-2.5 px-2 text-center text-slate-400">{p.hs_pct ?? p.hsPct ?? 0}%</td>
                  <td className="py-2.5 px-2 text-center text-slate-300">{kastPct ? `${kastPct}%` : '-'}</td>
                  <td className="py-2.5 px-2 text-center text-cyan-400 font-semibold">{entryKills > 0 ? entryKills : '-'}</td>
                  <td className="py-2.5 px-2 text-center text-purple-400 font-semibold">{clutches > 0 ? clutches : '-'}</td>
                  <td className="py-2.5 px-2 text-center text-amber-300 font-semibold" title={`2k:${m2k} 3k:${m3k} 4k:${m4k} 5k:${m5k}`}>
                    {multikillCount > 0 ? multikillCount : '-'}
                  </td>
                  <td className="py-2.5 px-3 text-right font-black text-amber-400">
                    {typeof rating === 'number' && rating > 0 ? rating.toFixed(2) : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MapResultRow({ mapName, teamAScore, teamBScore, mapIndex, teamAName, teamBName, isLive }) {
  const winner = teamAScore > teamBScore ? 'A' : teamBScore > teamAScore ? 'B' : null;
  const winnerName = winner === 'A' ? teamAName : winner === 'B' ? teamBName : null;

  return (
    <div
      className={`flex items-center justify-between px-5 py-3 rounded.xl transition-all ${
        isLive
          ? 'bg-cyan-950/40 border border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
          : 'bg-[#0f172a]/70 border border-slate-800'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-mono text-slate-500 tracking-wider font-bold">MAP {mapIndex}</span>
        <span className="text-sm font-black text-white font-mono uppercase tracking-wide">
          {mapName.replace('de_', '')}
        </span>
        {isLive ? (
          <span className="text-[9px] font-black font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
            LIVE MAP
          </span>
        ) : winnerName ? (
          <span className="text-[9.5px] font-black font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
            🏆 WON BY {winnerName.toUpperCase()}
          </span>
        ) : null}
      </div>
      <div className="flex items-center gap-4 font-mono">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 hidden sm:inline">{teamAName}</span>
          <span className={`font-black text-lg ${winner === 'A' ? 'text-amber-400' : isLive ? 'text-cyan-300' : 'text-slate-300'}`}>
            {teamAScore}
          </span>
        </div>
        <span className="text-slate-600 text-sm font-bold">—</span>
        <div className="flex items-center gap-2">
          <span className={`font-black text-lg ${winner === 'B' ? 'text-amber-400' : isLive ? 'text-cyan-300' : 'text-slate-300'}`}>
            {teamBScore}
          </span>
          <span className="text-xs text-slate-400 hidden sm:inline">{teamBName}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

// Poll interval: 30 seconds (matches can update when Kancha changes status on portal)
const POLL_INTERVAL_MS = 30_000;

export function MatchCenterSpectator({ matchIdProp, onClose }) {
  const { matchId: routeMatchId } = useParams();
  const matchId = matchIdProp || routeMatchId;
  const navigate = useNavigate();

  const [match, setMatch] = useState(null);
  const [bracketScheduledDate, setBracketScheduledDate] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // BO3 Map Selector Tab: 'SERIES' | 0 | 1 | 2
  const [selectedMapTab, setSelectedMapTab] = useState('SERIES');
  const [activeDetailTab, setActiveDetailTab] = useState('OVERVIEW');
  const [isStreamOpen, setIsStreamOpen] = useState(false);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // ── Data fetcher (used for initial load + polling) ─────────────────────────
  const fetchMatchData = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      if (isBackground) tournamentService.clearCache();

      const data = await tournamentService.fetchBracket();
      if (!data?.matches) {
        if (!isBackground) setError('Failed to load bracket data.');
        return;
      }

      if (data.bracket?.scheduled_date) {
        setBracketScheduledDate(data.bracket.scheduled_date);
      }

      const numericId = parseInt(matchId, 10);
      let found = data.matches.find(m =>
        String(m.id) === String(matchId) || m.id === numericId
      );

      // Fetch LOT match data when:
      //  a) bracket has linked a lotMatchId (SCHEDULED + match_id present), OR
      //  b) match is LIVE or COMPLETED (always need live scoreboard)
      const hasLotLink = found?.lotMatchId != null;
      const shouldFetchLot = found && (hasLotLink || found.status === 'LIVE' || found.status === 'COMPLETED');
      if (numericId > 0 && shouldFetchLot) {
        const lotFetchId = found.lotMatchId || numericId;
        try {
          // Primary: Pixel Palace canonical API (always has latest data for linked matches)
          const rawLot = await LotGamingAdapter.fetchFromPixelPalace(lotFetchId) ||
                         await lotFluxbotAdapter.fetchMatchData(lotFetchId).catch(() => null) ||
                         await lotDlanAdapter.fetchMatchData(lotFetchId).catch(() => null);
          if (rawLot) {
            found = {
              ...(found || {}),
              ...rawLot,
              id: found?.id || numericId,           // always preserve bracket match ID
              lotMatchId: lotFetchId,
              status: rawLot.status === 'finished' ? 'COMPLETED'
                : rawLot.status === 'live' ? 'LIVE'
                : rawLot.match_stage === 'warmup' ? 'SCHEDULED'
                : found?.status || 'PENDING',
              team1_players: rawLot.team1_players || [],
              team2_players: rawLot.team2_players || [],
              liveMap: rawLot.map || found?.liveMap || null,
              mapImageUrl: rawLot.map_image_url || null,
              matchStage: rawLot.match_stage || null,
              mapScoreT1: rawLot.score_team1 ?? found?.mapScoreT1 ?? 0,
              mapScoreT2: rawLot.score_team2 ?? found?.mapScoreT2 ?? 0,
              map_stats: rawLot.map_stats ? (typeof rawLot.map_stats === 'string' ? JSON.parse(rawLot.map_stats) : rawLot.map_stats) : [],
              map_list: rawLot.map_list ? (typeof rawLot.map_list === 'string' ? JSON.parse(rawLot.map_list) : rawLot.map_list) : [],
              demo_links: rawLot.demo_links || [],
              demoLinks: (rawLot.demo_links || []).map(d => ({
                mapIndex: d.map_index,
                filename: d.filename,
                downloadUrl: d.download_url,
              })),
              server: {
                country: rawLot.server_country_name || null,
                city: rawLot.server_city || null,
                countryCode: rawLot.server_country_code || null,
                serverPassword: rawLot.server_password_set || rawLot.server_password || null,
                cstvIp: rawLot.cstv1_ip || null,
                cstvPassword: rawLot.cstv1_password || null,
                cstvPublic: rawLot.cstv1_public === 1,
                cstvViewers: rawLot.cstv1_viewers ?? 0,
                sdrAddress: rawLot.sdr_address || null,
              },
              stats_by_map: rawLot.stats_by_map || null,
              statsByMap: rawLot.stats_by_map ? (
                typeof rawLot.stats_by_map === 'string' ? JSON.parse(rawLot.stats_by_map) : rawLot.stats_by_map
              ) : null,
              seriesScore: {
                teamAWins: rawLot.map_wins_team1 ?? found?.mapWinsT1 ?? 0,
                teamBWins: rawLot.map_wins_team2 ?? found?.mapWinsT2 ?? 0,
              }
            };
          }
        } catch {
          // Ignore LOT error — fall back to bracket inline data
        }
      }

      if (found) {
        setMatch(found);
        setLastUpdated(new Date());
        setError(null);
      } else {
        if (!isBackground) setError(`Match #${matchId} not found in bracket.`);
      }
    } catch (err) {
      if (!isBackground) setError(err.message || 'Failed to load match.');
      Logger.error(`[MatchDetail] Error loading match ${matchId}: ${err.message}`);
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, [matchId]);

  // Initial load + 30-second interval polling
  useEffect(() => {
    if (!matchId) return;
    fetchMatchData(false);

    const timer = setInterval(() => {
      fetchMatchData(true);
    }, POLL_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [matchId, fetchMatchData]);

  const phase = useMemo(() => getMatchPhase(match?.status), [match?.status]);

  const teamA = match?.team1Obj || { name: match?.team1_name || match?.team1 || 'TBD' };
  const teamB = match?.team2Obj || { name: match?.team2_name || match?.team2 || 'TBD' };
  const teamAName = teamA?.name || match?.team1_name || match?.team1 || 'TBD';
  const teamBName = teamB?.name || match?.team2_name || match?.team2 || 'TBD';

  const seriesScoreA = match?.seriesScore?.teamAWins ?? match?.map_wins_team1 ?? null;
  const seriesScoreB = match?.seriesScore?.teamBWins ?? match?.map_wins_team2 ?? null;
  const hasSeriesScore = seriesScoreA !== null;

  const isWinnerA = phase === 'COMPLETED' && (match?.winner === 'team1' || match?.map_wins_team1 > match?.map_wins_team2);
  const isWinnerB = phase === 'COMPLETED' && (match?.winner === 'team2' || match?.map_wins_team2 > match?.map_wins_team1);

  // 1-second live ticker for real-time D, H, M, S countdown
  const [nowTick, setNowTick] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const scheduleInfo = useMemo(() => {
    return getMatchSchedule(match?.id || matchId, match?.scheduled_date || match?.scheduledDate);
  }, [match?.id, matchId, match?.scheduled_date, match?.scheduledDate]);

  const visitorLocalTime = useMemo(() => {
    return formatVisitorLocalTime(scheduleInfo.iso);
  }, [scheduleInfo.iso]);

  const liveCountdown = useMemo(() => {
    return getLiveCountdown(scheduleInfo.iso);
  }, [scheduleInfo.iso, nowTick]);

  const roundLabel = scheduleInfo.round || ROUND_NAMES[match?.roundNumber || match?.round_number] || (match?.round) || 'Match';
  const format = scheduleInfo.type || match?.format || (match?.best_of ? `BO${match.best_of}` : 'BO1');
  const scheduledDate = visitorLocalTime.fullString || scheduleInfo.pkt || '31/07/2026';

  // Maps data (if API provides it on completion)
  const mapResults = useMemo(() => match?.map_stats || match?.mapResults || match?.maps || [], [match]);

  // Active players list if available
  const team1Players = match?.team1_players || match?.playerStats?.teamA || [];
  const team2Players = match?.team2_players || match?.playerStats?.teamB || [];
  const hasPlayerStats = team1Players.length > 0 || team2Players.length > 0;

  // ── Loading ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#070a14' }}>
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-500 font-mono text-sm tracking-widest uppercase">Loading match data…</p>
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────

  if (error || !match) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#070a14' }}>
        <div className="text-center space-y-4 max-w-md">
          <div className="text-5xl">🔍</div>
          <h2 className="text-white font-black text-xl">Match Not Found</h2>
          <p className="text-slate-500 font-mono text-sm">{error || `Match #${matchId} does not exist in the current bracket.`}</p>
          <button
            onClick={() => navigate('/match-center')}
            className="mt-4 px-6 py-2 rounded-lg font-mono font-bold text-sm text-white"
            style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)' }}
          >
            ← Back to Match Center
          </button>
        </div>
      </div>
    );
  }

  // ── Match Page ────────────────────────────────────────────────────────────

  return (
    <div className="w-full text-slate-100 font-body relative bg-[#070a14]" style={{ color: '#e2e8f0' }}>

      {/* ── Top Nav Bar ── */}
      <div
        className="sticky top-0 z-50 flex flex-wrap items-center justify-between px-6 py-3 border-b border-white/10"
        style={{ background: 'rgba(7,10,20,0.95)', backdropFilter: 'blur(12px)' }}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 bg-neon-pink/30 blur-md rounded-full animate-pulse" />
              <img
                src="https://raw.githubusercontent.com/alphabravo2k-rgb/pixel-palace-registration/1a7d90c43796fd037316bdaf4f3b4de9a485d615/image_4379f9.png"
                alt="Pixel Palace Official Logo"
                className="h-9 object-contain relative z-10"
              />
            </div>
          </div>
          <span className="text-zinc-700">|</span>
          <span className="text-neon-cyan text-xs font-mono tracking-wider uppercase font-bold bg-neon-cyan/10 border border-neon-cyan/30 px-2 py-0.5 rounded">
            Match #{match.id}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <PhaseBadge phase={phase} />
          <button
            onClick={() => setIsCheckInOpen(true)}
            className="text-[11px] font-mono font-bold px-3 py-1.5 rounded transition-all flex items-center gap-1.5 cursor-pointer hover:bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/40"
          >
            🛡️ CAPTAIN CHECK-IN
          </button>
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="text-[11px] font-mono font-bold px-3 py-1.5 rounded transition-all flex items-center gap-1.5 cursor-pointer hover:bg-neon-pink/20 bg-neon-pink/10 border border-neon-pink/40 text-neon-pink shadow-[0_0_12px_rgba(255,0,127,0.2)]"
          >
            🖼️ SHARE CARD
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              setCopiedLink(true);
              setTimeout(() => setCopiedLink(false), 2000);
            }}
            className="text-[11px] font-mono font-bold px-3 py-1.5 rounded transition-all flex items-center gap-1.5 cursor-pointer hover:bg-slate-800 bg-slate-900 border border-slate-700 text-slate-200"
          >
            {copiedLink ? '✓ COPIED!' : '📋 COPY LINK'}
          </button>
          {match?.demoLinks && match.demoLinks.length > 0 && (
            <a
              href={match.demoLinks[0].downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-mono font-bold px-3 py-1.5 rounded transition-all flex items-center gap-1.5 cursor-pointer hover:bg-purple-500/30 bg-purple-500/20 border border-purple-500/40 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.2)]"
              title={`Download GOTV Demo (${match.demoLinks[0].filename})`}
            >
              📥 DEMO REPLAY
            </a>
          )}
          <button
            onClick={() => setIsStreamOpen(true)}
            className="text-[11px] font-mono font-bold px-3 py-1.5 rounded transition-all flex items-center gap-1.5 cursor-pointer hover:scale-105 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400"
          >
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
            📺 WATCH STREAM
          </button>
          {onClose ? (
            <button
              onClick={onClose}
              className="text-xs font-mono font-bold px-3 py-1.5 rounded bg-rose-500/20 border border-rose-500/40 text-rose-400 hover:bg-rose-500/30 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>✕ CLOSE</span>
            </button>
          ) : (
            <button
              onClick={() => navigate('/register/community-cup-2')}
              className="text-[11px] font-mono font-bold px-3 py-1.5 rounded transition-colors bg-slate-900 border border-slate-700 text-slate-400 hover:text-white"
            >
              ← BRACKETS LIST
            </button>
          )}
        </div>
      </div>

      {/* ── Hero Match Card ── */}
      <div
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, rgba(99,102,241,0.08) 0%, rgba(7,10,20,0) 100%)',
          borderBottom: '1px solid rgba(99,102,241,0.12)',
        }}
      >
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-1/4 top-0 w-96 h-96 rounded-full opacity-5"
            style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }} />
          <div className="absolute right-1/4 top-0 w-96 h-96 rounded-full opacity-5"
            style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)' }} />
        </div>

        <div className="max-w-5xl mx-auto px-6 py-10 relative">
          {/* Round + Format banner */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <span
              className="text-sm font-black tracking-widest uppercase font-mono"
              style={{ color: '#a78bfa', textShadow: '0 0 16px rgba(167,139,250,0.5)' }}
            >
              {roundLabel}
            </span>
            <span className="text-slate-700">·</span>
            <span
              className="text-xs font-black font-mono px-2.5 py-0.5 rounded"
              style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.35)', color: '#818cf8' }}
            >
              {format}
            </span>
            {visitorLocalTime.fullString && (
              <>
                <span className="text-slate-700">·</span>
                <span className="text-xs font-mono text-emerald-400 font-bold">🌐 Your Local Time: {visitorLocalTime.fullString}</span>
              </>
            )}
          </div>

          {/* Teams Hero */}
          <div className="flex items-center justify-center gap-6 md:gap-12">
            <TeamDisplay
              team={teamA}
              side="left"
              score={phase !== 'PRE_MATCH' && hasSeriesScore ? seriesScoreA : null}
              isWinner={isWinnerA}
            />

            {/* Center VS / Score */}
            <div className="flex flex-col items-center shrink-0">
              {phase === 'PRE_MATCH' ? (
                <>
                  <div
                    className="text-2xl font-black font-mono px-5 py-3 rounded-xl mb-2"
                    style={{
                      background: 'rgba(15,23,42,0.8)',
                      border: '1px solid rgba(139,92,246,0.4)',
                      color: '#a78bfa',
                      textShadow: '0 0 12px rgba(167,139,250,0.5)',
                    }}
                  >
                    VS
                  </div>
                  {liveCountdown && (
                    <div className="text-center">
                      <div className="text-[9px] font-mono text-slate-500 tracking-widest uppercase mb-0.5">STARTS IN</div>
                      <div className="text-base font-black text-violet-400 font-mono tracking-wider">
                        {liveCountdown.formatted}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center">
                  <div className="text-[9px] font-mono text-slate-500 tracking-widest uppercase mb-1">SERIES SCORE</div>
                  <div
                    className="text-4xl font-black font-mono tracking-tight"
                    style={{ color: '#f8fafc', textShadow: '0 0 20px rgba(255,255,255,0.2)' }}
                  >
                    {seriesScoreA ?? '?'}
                    <span className="text-slate-600 mx-2 font-normal text-2xl">–</span>
                    {seriesScoreB ?? '?'}
                  </div>
                </div>
              )}

              {/* Live Map Pill — shown as soon as bracket links a LOT match */}
              {match?.liveMap && (
                <div className="flex items-center justify-center gap-2 mt-3">
                  <span
                    className="inline-flex items-center gap-2 text-xs font-mono font-bold px-3 py-1 rounded-full uppercase tracking-widest"
                    style={{ background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.35)', color: '#22d3ee' }}
                  >
                    🗺️ MAP: {match.liveMap.replace('de_', '').toUpperCase()}
                  </span>
                  {match?.mapScoreT1 > 0 || match?.mapScoreT2 > 0 ? (
                    <span
                      className="inline-flex items-center gap-1 text-xs font-mono font-bold px-3 py-1 rounded-full uppercase tracking-widest"
                      style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.35)', color: '#a78bfa' }}
                    >
                      SCORE {match.mapScoreT1} – {match.mapScoreT2}
                    </span>
                  ) : null}
                </div>
              )}
            </div>

            <TeamDisplay
              team={teamB}
              side="right"
              score={phase !== 'PRE_MATCH' && hasSeriesScore ? seriesScoreB : null}
              isWinner={isWinnerB}
            />
          </div>

          {/* Status line */}
          <div className="text-center mt-8">
            {phase === 'PRE_MATCH' && (
              <div className="space-y-1">
                <div
                  className="inline-block text-xs font-mono tracking-widest uppercase px-4 py-1.5 rounded-full"
                  style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', color: '#6366f1' }}
                >
                  Match scheduled for {scheduledDate} · Pixel Palace Community Cup 2
                </div>
              </div>
            )}
            {phase === 'LIVE' && (
              <div className="inline-flex items-center gap-2 text-xs font-mono tracking-widest uppercase px-4 py-1.5 rounded-full"
                style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399' }}>
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
                Match is live — auto-refreshing every 30s
              </div>
            )}
            {phase === 'COMPLETED' && (
              <div className="inline-block text-xs font-mono tracking-widest uppercase px-4 py-1.5 rounded-full"
                style={{ background: 'rgba(100,116,139,0.1)', border: '1px solid rgba(100,116,139,0.25)', color: '#94a3b8' }}>
                Match completed · {isWinnerA ? teamAName : isWinnerB ? teamBName : '—'} advances
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Content Sections ── */}
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-6">

        {/* ── Broadcast Navigation Tabs ── */}
        <div className="flex border-b border-slate-800/80 font-mono text-xs uppercase font-bold gap-2">
          <button
            onClick={() => setActiveDetailTab('OVERVIEW')}
            className={`px-4 py-2.5 border-b-2 transition-all cursor-pointer ${
              activeDetailTab === 'OVERVIEW'
                ? 'border-violet-500 text-white bg-slate-900/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            ⚔️ Match Overview
          </button>
          <button
            onClick={() => setActiveDetailTab('MAPS')}
            className={`px-4 py-2.5 border-b-2 transition-all cursor-pointer ${
              activeDetailTab === 'MAPS'
                ? 'border-violet-500 text-white bg-slate-900/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            🗺️ Map Pool & Veto
          </button>
          <button
            onClick={() => setActiveDetailTab('SCOREBOARD')}
            className={`px-4 py-2.5 border-b-2 transition-all cursor-pointer ${
              activeDetailTab === 'SCOREBOARD'
                ? 'border-violet-500 text-white bg-slate-900/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            📊 Scoreboard & Analytics
          </button>
        </div>

        {/* TAB 1: MATCH OVERVIEW */}
        {activeDetailTab === 'OVERVIEW' && (
          <div className="space-y-6 font-mono">
            <div
              className="rounded-xl p-6 space-y-5"
              style={{ background: 'rgba(13,17,40,0.8)', border: '1px solid rgba(99,102,241,0.18)' }}
            >
              <h2 className="text-xs font-black tracking-widest uppercase text-violet-400">
                MATCH INFORMATION & METADATA
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Match ID', value: `#${match.id}` },
                  { label: 'Round', value: roundLabel },
                  { label: 'Format', value: format },
                  { label: 'Status', value: match.status || 'Pending' },
                  { label: 'Scheduled', value: scheduledDate },
                  { label: 'Tournament', value: 'PP Community Cup 2' },
                  { label: 'Team 1', value: teamAName },
                  { label: 'Team 2', value: teamBName },
                  ...(match.liveMap ? [{ label: 'Vetoed Map', value: match.liveMap.replace('de_', '').toUpperCase() }] : []),
                  ...(match.lotMatchId ? [{ label: 'Server Session Ref', value: `#${match.lotMatchId}`, highlight: true }] : []),
                  ...(match.hasLotData && (match.mapScoreT1 > 0 || match.mapScoreT2 > 0) ? [
                    { label: 'Live Score', value: `${match.mapScoreT1} – ${match.mapScoreT2}`, highlight: true }
                  ] : []),
                ].map(({ label, value, highlight }) => (
                  <div key={label} className="space-y-1">
                    <div className="text-[9px] tracking-widest uppercase text-slate-500">{label}</div>
                    <div className="text-sm font-bold text-slate-200">{value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action & Timezone Toolbar */}
            <div className="bg-[#0b0f20] border border-slate-800/80 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 text-xs">
                {visitorLocalTime.fullString && (
                  <span className="text-emerald-400 font-bold flex items-center gap-1.5 bg-emerald-950/40 border border-emerald-800/40 px-3 py-1 rounded-md">
                    🌐 Your Local Time: {visitorLocalTime.fullString}
                  </span>
                )}
                <span className="text-slate-700 hidden sm:inline">|</span>
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                  <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-300">🇵🇰 8:00 PM PKT</span>
                  <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-300">🇦🇪 7:00 PM GST</span>
                  <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-300">🇸🇦 6:00 PM AST</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={getGoogleCalendarUrl(match)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-800/40 text-xs font-bold px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5"
                >
                  📅 <span>Google Calendar Sync</span>
                </a>
                {match?.demoLinks && match.demoLinks.length > 0 ? (
                  <a
                    href={match.demoLinks[0].downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/50 text-xs font-bold px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 shadow-[0_0_12px_rgba(168,85,247,0.3)]"
                  >
                    📥 <span>Download GOTV Demo (.dem)</span>
                  </a>
                ) : (
                  <div className="bg-slate-900 text-slate-400 border border-slate-800 text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1">
                    🔒 <span>GOTV Demos Protected / Processing</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MAP POOL & VETO */}
        {activeDetailTab === 'MAPS' && (
          <div className="space-y-6 font-mono">
            {/* Map Results Breakdown (Shown if Completed OR Live) */}
            {(phase === 'COMPLETED' || phase === 'LIVE') && (mapResults.length > 0 || match?.liveMap) && (
              <div className="space-y-3">
                <h2 className="text-xs font-black tracking-widest uppercase text-violet-400">
                  {phase === 'LIVE' ? 'LIVE MAP BREAKDOWN' : 'MAP RESULTS BREAKDOWN'}
                </h2>
                <div className="space-y-2">
                  {/* Completed map results in the series */}
                  {mapResults.map((map, idx) => {
                    const isCurrentLiveMap = phase === 'LIVE' && idx === (match?.currentMapIndex ?? mapResults.length);
                    return (
                      <MapResultRow
                        key={idx}
                        mapName={map.map_name || map.name || `Map ${idx + 1}`}
                        mapIndex={idx + 1}
                        teamAScore={isCurrentLiveMap ? (match?.mapScoreT1 ?? map.score_team1 ?? 0) : (map.score_team1 ?? map.scoreA ?? 0)}
                        teamBScore={isCurrentLiveMap ? (match?.mapScoreT2 ?? map.score_team2 ?? 0) : (map.score_team2 ?? map.scoreB ?? 0)}
                        teamAName={teamAName}
                        teamBName={teamBName}
                        isLive={isCurrentLiveMap}
                      />
                    );
                  })}
                  
                  {/* Live active map row if current live map index is beyond completed map_stats */}
                  {phase === 'LIVE' && match?.liveMap && (match?.currentMapIndex ?? 0) >= mapResults.length && (
                    <MapResultRow
                      mapName={match.liveMap}
                      mapIndex={mapResults.length + 1}
                      teamAScore={match.mapScoreT1 ?? 0}
                      teamBScore={match.mapScoreT2 ?? 0}
                      teamAName={teamAName}
                      teamBName={teamBName}
                      isLive={true}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Active Duty Map Pool */}
            <div className="bg-[#0c0f1f] border border-slate-800/80 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-white uppercase tracking-wider">
                  CS2 Active Duty Competitive Map Pool
                </h3>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                  OFFICIAL MAP POOL
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-7 gap-3">
                {[
                  { name: 'Dust II', code: 'de_dust2', img: 'https://raw.githubusercontent.com/rpkaul/cs-map-images/main/de_dust2.png' },
                  { name: 'Mirage', code: 'de_mirage', img: 'https://raw.githubusercontent.com/rpkaul/cs-map-images/main/de_mirage.png' },
                  { name: 'Anubis', code: 'de_anubis', img: 'https://raw.githubusercontent.com/rpkaul/cs-map-images/main/de_anubis.png' },
                  { name: 'Ancient', code: 'de_ancient', img: 'https://raw.githubusercontent.com/rpkaul/cs-map-images/main/de_ancient.png' },
                  { name: 'Nuke', code: 'de_nuke', img: 'https://raw.githubusercontent.com/rpkaul/cs-map-images/main/de_nuke.png' },
                  { name: 'Inferno', code: 'de_inferno', img: 'https://raw.githubusercontent.com/rpkaul/cs-map-images/main/de_inferno.png' },
                  { name: 'Vertigo', code: 'de_vertigo', img: 'https://raw.githubusercontent.com/rpkaul/cs-map-images/main/de_vertigo.png' },
                ].map(({ name, code, img }) => {
                  const cleanCode = code.replace('de_', '');
                  
                  // Check if played in mapResults
                  const playedEntry = mapResults.find(m => (m.map_name || m.name || '').toLowerCase().includes(cleanCode));
                  const mapList = (match?.map_list || []).map(m => String(m).toLowerCase());
                  
                  const rawActiveMap = (match?.liveMap || match?.map || '').toLowerCase();
                  const isActiveLive = phase === 'LIVE' && rawActiveMap.includes(cleanCode);
                  const isPlayed = Boolean(playedEntry);
                  const isSelectedInList = mapList.some(m => m.includes(cleanCode));

                  const isPicked = isPlayed || isSelectedInList;
                  const isBanned = (mapResults.length > 0 || mapList.length > 0) && !isPicked && !isActiveLive;

                  // Scores & Winners
                  let scoreLabel = null;
                  let winnerTag = null;
                  if (isActiveLive) {
                    scoreLabel = `${match?.mapScoreT1 ?? 0} – ${match?.mapScoreT2 ?? 0}`;
                  } else if (playedEntry) {
                    const s1 = playedEntry.score_team1 ?? playedEntry.scoreA ?? 0;
                    const s2 = playedEntry.score_team2 ?? playedEntry.scoreB ?? 0;
                    scoreLabel = `${s1} – ${s2}`;
                    if (s1 > s2) winnerTag = teamAName;
                    else if (s2 > s1) winnerTag = teamBName;
                  }

                  // Map pick/ban attribution
                  let attributionLabel = null;
                  if (match?.veto?.bans && match.veto.bans[cleanCode]) {
                    attributionLabel = `BANNED BY ${match.veto.bans[cleanCode].toUpperCase()}`;
                  } else if (match?.veto?.picks && match.veto.picks[cleanCode]) {
                    attributionLabel = `PICKED BY ${match.veto.picks[cleanCode].toUpperCase()}`;
                  }

                  return (
                    <div
                      key={code}
                      className={`relative rounded-xl overflow-hidden text-center transition-all duration-300 group border min-h-[90px] flex flex-col justify-between p-2.5 ${
                        isActiveLive
                          ? 'border-2 border-cyan-400 shadow-[0_0_16px_rgba(6,182,212,0.4)] animate-pulse'
                          : isPicked
                          ? 'border-emerald-500/70 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                          : isBanned
                          ? 'border-rose-500/30 opacity-50 grayscale'
                          : 'border-slate-800/80'
                      }`}
                    >
                      {/* Map Background Image */}
                      <div
                        className="absolute inset-0 bg-cover bg-center pointer-events-none opacity-35 group-hover:scale-105 transition-transform duration-500"
                        style={{ backgroundImage: `url(${img})` }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/40 pointer-events-none" />

                      {/* Top Label */}
                      <div className="relative z-10">
                        <span className={`text-[8px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded inline-block ${
                          isActiveLive
                            ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400/50'
                            : isPicked
                            ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/50'
                            : isBanned
                            ? 'bg-rose-500/20 text-rose-400 line-through'
                            : 'bg-slate-900/80 text-slate-400'
                        }`}>
                          {isActiveLive ? '⚡ LIVE MAP' : isPicked ? (attributionLabel || '✓ PICKED') : isBanned ? (attributionLabel || '✕ BANNED') : 'Active Duty'}
                        </span>
                      </div>

                      {/* Map Name & Live Score / Winner */}
                      <div className="relative z-10 my-1">
                        <span className={`text-xs font-black uppercase tracking-wider block ${
                          isBanned ? 'text-slate-400 line-through' : 'text-white'
                        }`}>
                          {name}
                        </span>
                        {scoreLabel && (
                          <div className={`text-xs font-black font-mono mt-0.5 ${isActiveLive ? 'text-cyan-300' : 'text-amber-400'}`}>
                            {scoreLabel}
                          </div>
                        )}
                        {winnerTag && !isActiveLive && (
                          <div className="text-[7.5px] font-bold text-amber-300 uppercase tracking-tighter truncate max-w-full px-1">
                            🏆 {winnerTag}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="text-[10px] text-slate-500 text-center pt-2 border-t border-slate-850">
                Official Map Pick/Ban sequence will be conducted live by team captains 30 mins prior to match start.
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SCOREBOARD & ANALYTICS */}
        {activeDetailTab === 'SCOREBOARD' && (
          <div className="space-y-6 font-mono">

            {/* ─── Protected Server & Spectator Info Box ─── */}
            {match?.server && (
              <div className="rounded-xl p-5 space-y-4" style={{ background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.25)' }}>
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-black tracking-widest uppercase text-cyan-400">🎮 SERVER &amp; SPECTATOR INFO</h2>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/50 border border-emerald-800/40 px-2 py-0.5 rounded uppercase">
                    {match.server.city}, {match.server.country}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[11px]">
                  <div className="p-3 rounded-lg" style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(6,182,212,0.2)' }}>
                    <div className="text-[9px] text-cyan-600 uppercase tracking-widest mb-1">GOTV / CSTV FEED</div>
                    <div className="font-black text-cyan-300 font-mono flex items-center gap-1.5">
                      <span>🔒</span> Official Broadcast Stream
                    </div>
                  </div>
                  <div className="p-3 rounded-lg" style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(16,185,129,0.2)' }}>
                    <div className="text-[9px] text-emerald-600 uppercase tracking-widest mb-1">SERVER INFRASTRUCTURE</div>
                    <div className="font-black text-emerald-400 font-mono flex items-center gap-1.5">
                      <span>🟢</span> Protected Match Server
                    </div>
                  </div>
                  {match.matchStage && (
                    <div className="p-3 rounded-lg" style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(99,102,241,0.2)' }}>
                      <div className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">Match Stage</div>
                      <div className="font-black text-white uppercase font-mono">{match.matchStage}</div>
                    </div>
                  )}
                </div>
                <div className="text-[10px] text-slate-500 pt-2 border-t border-slate-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5">
                    <span>🔒</span> Direct IP addresses and passwords are protected to secure servers against DDoS &amp; cyber attacks.
                  </span>
                  <button
                    onClick={() => setIsStreamOpen(true)}
                    className="text-violet-400 hover:text-violet-300 font-bold underline transition-colors shrink-0"
                  >
                    Watch Official Stream ↗
                  </button>
                </div>
              </div>
            )}

            {/* ─── Pre-Match Lineup Cards (shown during warmup / pending) ─── */}
            {phase === 'PRE_MATCH' && (match?.team1_players?.length > 0 || match?.team2_players?.length > 0) && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-black tracking-widest uppercase text-violet-400">⚔️ PRE-MATCH PLAYER LINEUP</h2>
                  <span className="text-[10px] font-mono text-slate-500">FACEIT ELO · All Registered Players</span>
                </div>
                {[{ name: teamAName, players: match.team1_players }, { name: teamBName, players: match.team2_players }].map(({ name, players }) => (
                  <div key={name} className="rounded-xl overflow-hidden" style={{ background: 'rgba(13,17,40,0.8)', border: '1px solid rgba(99,102,241,0.18)' }}>
                    <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: 'rgba(99,102,241,0.12)' }}>
                      <span className="font-black text-sm text-white font-mono">{name}</span>
                      <span className="text-[10px] font-mono text-slate-500">{players.length} Players Registered</span>
                    </div>
                    <div className="divide-y divide-slate-800/40">
                      {players.map((p, idx) => {
                        const faceit = p.faceit;
                        const level = faceit?.skill_level || null;
                        const elo = faceit?.faceit_elo || null;
                        const avatar = faceit?.avatar || null;
                        const profileUrl = faceit?.faceit_url?.replace('{lang}', 'en');
                        const levelColor = FACEIT_LEVEL_COLORS[level] || '#94a3b8';
                        return (
                          <div key={p.steam_id || idx} className="flex items-center justify-between px-5 py-2.5 hover:bg-slate-800/20 transition">
                            <div className="flex items-center gap-3">
                              {avatar
                                ? <img src={avatar} alt={p.name} className="w-7 h-7 rounded-full object-cover border border-slate-700" referrerPolicy="no-referrer" />
                                : <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-400">{(p.name || '?')[0].toUpperCase()}</div>
                              }
                              <span className="text-sm font-bold text-slate-200 font-mono">{p.name}</span>
                              {faceit?.country && <span className="text-[9px] text-slate-600 uppercase">{faceit.country}</span>}
                            </div>
                            <div className="flex items-center gap-2">
                              {level && (
                                <a href={profileUrl} target="_blank" rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded font-mono"
                                  style={{ background: `${levelColor}20`, color: levelColor, border: `1px solid ${levelColor}44` }}
                                >
                                  <svg width="8" height="8" viewBox="0 0 10 10" fill={levelColor}><polygon points="5,0 6.2,3.8 10,3.8 7,6.2 8.1,10 5,7.8 1.9,10 3,6.2 0,3.8 3.8,3.8" /></svg>
                                  LVL {level} · {elo?.toLocaleString()} ELO
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ─── Live / Post-Match Scoreboard ─── */}
            {hasPlayerStats ? (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <h2 className="text-xs font-black tracking-widest uppercase text-violet-400">
                    PLAYER PERFORMANCE SCOREBOARD
                  </h2>
                  <div className="flex items-center gap-2">
                    {/* Map Selector Pills */}
                    <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px] font-bold">
                      <button
                        onClick={() => setSelectedMapTab('SERIES')}
                        className={`px-3 py-1 rounded transition-all ${
                          selectedMapTab === 'SERIES'
                            ? 'bg-violet-600 text-white shadow'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        ALL MAPS
                      </button>
                      {(match?.map_stats || mapResults || []).map((m, idx) => {
                        const mapTitle = (m.map_name || m.name || `Map ${idx + 1}`).replace('de_', '').toUpperCase();
                        return (
                          <button
                            key={idx}
                            onClick={() => setSelectedMapTab(idx)}
                            className={`px-3 py-1 rounded transition-all ${
                              selectedMapTab === idx
                                ? 'bg-violet-600 text-white shadow'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            M{idx + 1}: {mapTitle}
                          </button>
                        );
                      })}
                    </div>
                    {lastUpdated && (
                      <span className="text-[10px] text-slate-500 hidden md:inline">
                        Auto-synced: {lastUpdated.toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Scoreboard Content (Cumulative vs Selected Map) */}
                {(() => {
                  let activeTeam1Players = team1Players;
                  let activeTeam2Players = team2Players;

                  if (selectedMapTab !== 'SERIES' && match?.statsByMap) {
                    const mapKey = String(selectedMapTab);
                    const mapData = match.statsByMap[mapKey] || match.statsByMap[selectedMapTab];
                    if (mapData) {
                      const rawT1 = mapData.team1_players || mapData.teamA || [];
                      const rawT2 = mapData.team2_players || mapData.teamB || [];
                      if (rawT1.length > 0) activeTeam1Players = rawT1;
                      if (rawT2.length > 0) activeTeam2Players = rawT2;
                    }
                  }

                  return (
                    <div className="space-y-6">
                      <PlayerScoreboardTable teamName={teamAName} players={activeTeam1Players} isWinner={isWinnerA} />
                      <PlayerScoreboardTable teamName={teamBName} players={activeTeam2Players} isWinner={isWinnerB} />
                    </div>
                  );
                })()}
              </div>
            ) : phase !== 'PRE_MATCH' && (
              <div className="bg-[#0c0f1f] border border-slate-800/80 rounded-2xl p-10 text-center space-y-3">
                <div className="text-3xl">📊</div>
                <h3 className="text-sm font-bold text-white uppercase">Player Scoreboard Pending Match Execution</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Detailed player performance stats are currently sync-pending.
                </p>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Footer */}
      <div className="text-center py-8 border-t" style={{ borderColor: 'rgba(99,102,241,0.08)' }}>
        <p className="text-[10px] font-mono text-slate-700 tracking-widest uppercase">
          Pixel Palace Tournament Operations System · Enterprise Esports Edition v3.0
        </p>
      </div>

      <StreamModal
        isOpen={isStreamOpen}
        onClose={() => setIsStreamOpen(false)}
        match={match}
      />
      <CaptainCheckInModal
        isOpen={isCheckInOpen}
        onClose={() => setIsCheckInOpen(false)}
        match={match}
      />
      {isShareModalOpen && (
        <MatchShareCardModal
          match={match}
          onClose={() => setIsShareModalOpen(false)}
        />
      )}
    </div>
  );
}

export default MatchCenterSpectator;
