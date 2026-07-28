/**
 * Match Center — API-Driven Match Detail Page
 * Three lifecycle states driven by Kancha's Pixel Palace API:
 *   PRE-MATCH  → Shows real teams, schedule, format, countdown
 *   LIVE       → Shows live scores, current map, round progress
 *   COMPLETED  → Shows final scores, winner, stats (when API provides them)
 *
 * NO hardcoded stats. Everything comes from the API or displays "Not yet available".
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { tournamentService } from '../../../services/TournamentService.js';
import { getTeamLogoUrl, getTeamTag } from '../../../utils/teamResolver.js';
import { Logger } from '../../shared/kernel/Logger.js';

// ─── Helpers ────────────────────────────────────────────────────────────────

const ROUND_NAMES = { 1: 'Round of 32', 2: 'Round of 16', 3: 'Quarterfinals', 4: 'Semifinals', 5: 'Grand Final' };

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

// ─── Map Result Row (for completed matches) ───────────────────────────────────

function MapResultRow({ mapName, teamAScore, teamBScore, teamAName, teamBName, mapIndex }) {
  const winner = teamAScore > teamBScore ? 'A' : 'B';
  return (
    <div
      className="flex items-center justify-between px-4 py-3 rounded-lg"
      style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(99,102,241,0.15)' }}
    >
      <div className="flex items-center gap-3">
        <span className="text-[9px] font-mono text-slate-500 tracking-wider">MAP {mapIndex}</span>
        <span className="text-sm font-bold text-slate-200 font-mono uppercase">
          {mapName.replace('de_', '')}
        </span>
      </div>
      <div className="flex items-center gap-4 font-mono">
        <span className={`font-black text-base ${winner === 'A' ? 'text-amber-400' : 'text-slate-400'}`}>
          {teamAScore}
        </span>
        <span className="text-slate-600 text-sm">—</span>
        <span className={`font-black text-base ${winner === 'B' ? 'text-amber-400' : 'text-slate-400'}`}>
          {teamBScore}
        </span>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

// Poll interval: 30 seconds (matches can update when Kancha changes status on portal)
const POLL_INTERVAL_MS = 30_000;

export function MatchCenterSpectator() {
  const { matchId } = useParams();
  const navigate = useNavigate();

  const [match, setMatch] = useState(null);
  const [bracketScheduledDate, setBracketScheduledDate] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ── Data fetcher (used for initial load + polling) ─────────────────────────
  const fetchMatchData = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      // Always bust cache on background poll to get latest updates from Kancha's API
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
      const found = data.matches.find(m =>
        String(m.id) === String(matchId) || m.id === numericId
      );

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

  const teamA = match?.team1Obj || null;
  const teamB = match?.team2Obj || null;
  const teamAName = teamA?.name || match?.team1 || 'TBD';
  const teamBName = teamB?.name || match?.team2 || 'TBD';

  const seriesScoreA = match?.seriesScore?.teamAWins ?? null;
  const seriesScoreB = match?.seriesScore?.teamBWins ?? null;
  const hasSeriesScore = seriesScoreA !== null;

  const isWinnerA = phase === 'COMPLETED' && match?.winner === 'team1';
  const isWinnerB = phase === 'COMPLETED' && match?.winner === 'team2';

  const roundLabel = ROUND_NAMES[match?.roundNumber] || (match?.round) || 'Match';
  const format = match?.format || 'BO1';
  const scheduledDate = bracketScheduledDate || match?.scheduledDate || '2026-07-31';
  const countdown = useCountdown(
    scheduledDate ? `${scheduledDate}T17:00:00+05:00` : null
  );

  // Maps data (only exists if API provides it on completion)
  const mapResults = useMemo(() => match?.mapResults || match?.maps || [], [match]);

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
    <div className="min-h-screen" style={{ background: '#070a14', color: '#e2e8f0' }}>

      {/* ── Top Nav Bar ── */}
      <div
        className="sticky top-0 z-50 flex items-center justify-between px-6 py-3"
        style={{ background: 'rgba(7,10,20,0.95)', borderBottom: '1px solid rgba(99,102,241,0.15)', backdropFilter: 'blur(12px)' }}
      >
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-violet-600 flex items-center justify-center text-white font-black text-sm">P</div>
            <span className="text-white font-black text-sm tracking-wide">PIXEL PALACE</span>
          </Link>
          <span className="text-slate-700">|</span>
          <span className="text-slate-400 text-xs font-mono tracking-wider uppercase">Match #{match.id}</span>
        </div>
        <div className="flex items-center gap-3">
          <PhaseBadge phase={phase} />
          <Link
            to="/match-center"
            className="text-[11px] font-mono font-bold px-3 py-1.5 rounded transition-colors"
            style={{ background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(100,116,139,0.3)', color: '#94a3b8' }}
          >
            ← BRACKETS LIST
          </Link>
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
            {scheduledDate && (
              <>
                <span className="text-slate-700">·</span>
                <span className="text-xs font-mono text-slate-500">📅 {scheduledDate}</span>
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
                  {countdown && (
                    <div className="text-center">
                      <div className="text-[9px] font-mono text-slate-600 tracking-widest uppercase mb-0.5">STARTS IN</div>
                      <div className="text-sm font-black text-violet-400 font-mono">{countdown}</div>
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
                  Match scheduled for {scheduledDate || 'July 31, 2026'} · Pixel Palace Community Cup 2
                </div>
              </div>
            )}
            {phase === 'LIVE' && (
              <div className="inline-flex items-center gap-2 text-xs font-mono tracking-widest uppercase px-4 py-1.5 rounded-full"
                style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399' }}>
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
                Match is live — data updates automatically
              </div>
            )}
            {phase === 'COMPLETED' && (
              <div className="inline-block text-xs font-mono tracking-widest uppercase px-4 py-1.5 rounded-full"
                style={{ background: 'rgba(100,116,139,0.1)', border: '1px solid rgba(100,116,139,0.25)', color: '#94a3b8' }}>
                Match completed · {teamAName === teamA?.name && isWinnerA ? teamAName : isWinnerB ? teamBName : '—'} advances
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Content Sections ── */}
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">

        {/* PRE-MATCH: Match Info Card */}
        <div
          className="rounded-xl p-6 space-y-5"
          style={{ background: 'rgba(13,17,40,0.8)', border: '1px solid rgba(99,102,241,0.18)' }}
        >
          <h2 className="text-xs font-black tracking-widest uppercase font-mono"
            style={{ color: '#818cf8' }}>MATCH INFORMATION</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Match ID', value: `#${match.id}` },
              { label: 'Round', value: roundLabel },
              { label: 'Format', value: format },
              { label: 'Status', value: match.status || 'Pending' },
              { label: 'Scheduled', value: scheduledDate || 'July 31, 2026' },
              { label: 'Tournament', value: 'PP Community Cup 2' },
              { label: 'Team 1', value: teamAName },
              { label: 'Team 2', value: teamBName },
            ].map(({ label, value }) => (
              <div key={label} className="space-y-1">
                <div className="text-[9px] font-mono tracking-widest uppercase text-slate-600">{label}</div>
                <div className="text-sm font-bold text-slate-200 font-mono">{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Map Results — only when API provides them (COMPLETED) */}
        {phase === 'COMPLETED' && mapResults.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-black tracking-widest uppercase font-mono" style={{ color: '#818cf8' }}>
              MAP RESULTS
            </h2>
            <div className="space-y-2">
              {mapResults.map((map, idx) => (
                <MapResultRow
                  key={idx}
                  mapName={map.name || map.map_name || `Map ${idx + 1}`}
                  mapIndex={idx + 1}
                  teamAScore={map.scoreA ?? map.score_team1 ?? 0}
                  teamBScore={map.scoreB ?? map.score_team2 ?? 0}
                  teamAName={teamAName}
                  teamBName={teamBName}
                />
              ))}
            </div>
          </div>
        )}

        {/* Phase-gated sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Live Score / Map */}
          {phase === 'LIVE' ? (
            <div className="rounded-xl p-6" style={{ background: 'rgba(13,17,40,0.8)', border: '1px solid rgba(16,185,129,0.25)' }}>
              <h3 className="text-xs font-black tracking-widest uppercase font-mono text-emerald-400 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
                LIVE MATCH DATA
              </h3>
              {match.activeMap ? (
                <div className="space-y-2 font-mono text-sm">
                  <div className="text-slate-400">Current Map: <span className="text-white font-bold">{match.activeMap.replace('de_', '').toUpperCase()}</span></div>
                  <div className="text-slate-400">Round Score: <span className="text-white font-bold">{match.score?.teamAScore ?? 0} – {match.score?.teamBScore ?? 0}</span></div>
                </div>
              ) : (
                <p className="text-slate-500 text-sm font-mono">Waiting for map data…</p>
              )}
            </div>
          ) : (
            <PlaceholderSection
              icon="📡"
              label="Live Statistics"
              note={phase === 'PRE_MATCH' ? 'Available once the match starts on ' + (scheduledDate || 'July 31') : 'Match not live'}
            />
          )}

          {/* Player Statistics */}
          {phase === 'COMPLETED' && match.playerStats ? (
            <div className="rounded-xl p-6" style={{ background: 'rgba(13,17,40,0.8)', border: '1px solid rgba(99,102,241,0.18)' }}>
              <h3 className="text-xs font-black tracking-widest uppercase font-mono text-violet-400 mb-4">PLAYER STATISTICS</h3>
              <p className="text-slate-500 text-sm font-mono">Stats available from API.</p>
            </div>
          ) : (
            <PlaceholderSection
              icon="👤"
              label="Player Statistics"
              note={phase === 'PRE_MATCH' ? 'Available after the match is played' : 'Loading player data…'}
            />
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <PlaceholderSection
            icon="💰"
            label="Economy Timeline"
            note={phase === 'PRE_MATCH' ? 'Available after match completion' : phase === 'LIVE' ? 'Will appear during match' : 'No economy data available'}
          />
          <PlaceholderSection
            icon="🗺️"
            label="Map Veto"
            note={phase === 'PRE_MATCH' ? 'Published before match start' : 'Veto sequence completed'}
          />
          <PlaceholderSection
            icon="🔒"
            label="GOTV Demos & Replays"
            note="Protected · Internal Tournament Ops Access Only"
          />
        </div>

        {/* FACEIT Integration */}
        <div
          className="rounded-xl p-6 text-center"
          style={{ background: 'rgba(13,17,40,0.8)', border: '1px solid rgba(239,103,54,0.2)' }}
        >
          <div className="text-2xl mb-2">⚡</div>
          <div className="text-sm font-bold text-orange-400 font-mono tracking-wide">FACEIT INTEGRATION</div>
          <div className="text-[11px] text-slate-600 font-mono mt-1">
            {phase === 'PRE_MATCH'
              ? 'FACEIT match room will appear here when created by the tournament organizer.'
              : 'FACEIT room link not yet linked to this match.'}
          </div>
        </div>



      </div>

      {/* Footer */}
      <div className="text-center py-8 border-t" style={{ borderColor: 'rgba(99,102,241,0.08)' }}>
        <p className="text-[10px] font-mono text-slate-700 tracking-widest uppercase">
          Pixel Palace Tournament Operations System · Powered by Kancha Platform
        </p>
      </div>
    </div>
  );
}

export default MatchCenterSpectator;
