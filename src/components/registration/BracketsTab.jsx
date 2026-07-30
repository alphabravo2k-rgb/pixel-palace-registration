import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Target, Loader2, RefreshCw, Clock, ChevronRight, Zap } from 'lucide-react';
import { tournamentService } from '../../services/TournamentService';
import { getTeamLogo as resolveLogo } from '../../utils/teamResolver';
import { resolveDisplayMatches } from '../../utils/bracketSelector';
import { PPCC2_LAYOUT, generateConnectorPath } from '../../config/ppcc2Layout';
import { BracketMatchCard } from './BracketMatchCard';

export const BracketsTab = ({
  bracketData: initialBracketData,
  tournament,
  teams = []
}) => {
  const [bracketData, setBracketData] = useState(initialBracketData);
  const [loading, setLoading] = useState(!initialBracketData);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(new Date().toLocaleTimeString());
  const canvasRef = useRef(null);

  // Fast O(1) Logo Lookup Map
  const logoMap = useMemo(() => {
    const map = new Map();
    const teamList = Array.isArray(teams) ? teams : (typeof teams === 'object' && teams !== null ? Object.values(teams) : []);
    teamList.forEach(t => {
      if (t?.name) map.set(t.name.toLowerCase(), t.logo || t.logo_url);
    });
    return map;
  }, [teams]);

  const getTeamLogo = useCallback((teamInput) => {
    if (!teamInput) return null;
    if (typeof teamInput === 'object' && teamInput.logo) return teamInput.logo;
    const nameStr = typeof teamInput === 'string' ? teamInput : teamInput.name;
    if (!nameStr || typeof nameStr !== 'string') return null;
    const lower = nameStr.toLowerCase();
    return logoMap.get(lower) || resolveLogo(nameStr);
  }, [logoMap]);

  // Unified Data Loading Handler via TournamentService
  const loadBracket = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);

    try {
      const data = await tournamentService.fetchBracket(tournament);
      setBracketData(data);
      setError(false);
      setLastSyncTime(new Date().toLocaleTimeString());
    } catch (err) {
      console.error("Failed to load bracket data:", err);
      if (!bracketData) setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tournament, bracketData]);

  // Polling Loop
  useEffect(() => {
    loadBracket(false);
    const pollInterval = setInterval(() => {
      loadBracket(false);
    }, 15000);

    return () => clearInterval(pollInterval);
  }, [loadBracket]);

  const slotsMap = useMemo(() => {
    return PPCC2_LAYOUT.slotsMap;
  }, []);

  const rawMatches = bracketData?.matches || [];
  const { matches: displayMatches } = resolveDisplayMatches(rawMatches);
  const fluxMap = useMemo(() => {
    return new Map((displayMatches || []).map(m => [`${m.round_number ?? m.roundNumber}-${m.position}`, m]));
  }, [displayMatches]);

  // Memoized SVG Connectors Render Layer
  const svgConnectorsLayer = useMemo(() => {
    return PPCC2_LAYOUT.connectors.map((conn) => {
      const pathStr = generateConnectorPath(conn, slotsMap);
      const isByeConn = conn.type === 'bye-single';

      return (
        <path
          key={conn.id}
          d={pathStr}
          stroke={isByeConn ? 'rgba(0, 240, 255, 0.55)' : 'rgba(0, 240, 255, 0.35)'}
          strokeWidth={isByeConn ? '2' : '1.75'}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
    });
  }, [slotsMap]);

  // Scroll to column offset
  const scrollToRound = (xOffset) => {
    if (canvasRef.current) {
      canvasRef.current.scrollTo({ left: xOffset, behavior: 'smooth' });
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto font-mono">
        <div className="bg-[#080b18]/95 border border-white/10 rounded-2xl p-8 min-h-[480px] flex flex-col items-center justify-center text-center">
          <Loader2 className="w-10 h-10 animate-spin mb-4 text-neon-cyan drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]" />
          <p className="text-zinc-400 text-xs tracking-widest uppercase font-bold">
            Establishing Uplink to Tournament Network...
          </p>
        </div>
      </div>
    );
  }

  // Error State
  if (error && !bracketData) {
    return (
      <div className="max-w-7xl mx-auto font-mono">
        <div className="bg-[#080b18]/95 border border-white/10 rounded-2xl p-8 min-h-[480px] flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-4">
            <Target className="w-6 h-6 text-red-400" />
          </div>
          <h3 className="text-lg font-heading text-white uppercase tracking-wider mb-2 font-bold">
            Bracket Network Offline
          </h3>
          <p className="text-zinc-400 text-xs max-w-md mb-6">
            Unable to fetch current tournament match state. Please verify network connectivity.
          </p>
          <button
            onClick={() => loadBracket(true)}
            className="px-5 py-2.5 bg-neon-cyan/10 hover:bg-neon-cyan/20 border border-neon-cyan/40 text-neon-cyan font-bold text-xs uppercase tracking-widest rounded-xl transition cursor-pointer"
          >
            Retry Sync
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto font-mono">
      <div className="bg-[#080b18]/95 border border-white/10 rounded-2xl p-5 sm:p-7 min-h-[500px] max-h-[85vh] overflow-hidden flex flex-col justify-between relative shadow-[0_0_60px_rgba(0,0,0,0.9)] backdrop-blur-md">
        <div className="hud-crosshair tl"></div><div className="hud-crosshair tr"></div>

        {/* Dashboard Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 border-b border-white/10 pb-4 shrink-0">
          <div>
            <h2 className="text-xl sm:text-2xl text-white font-heading font-black tracking-wider leading-none uppercase flex items-center gap-2.5">
              <Target className="w-6 h-6 text-neon-cyan" /> TOURNAMENT BRACKET MATRIX
            </h2>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block mt-0.5">
              SINGLE ELIMINATION PLAYOFFS DRAW
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-[10px] text-zinc-400 font-bold flex items-center gap-1.5 bg-black/50 px-3 py-1.5 rounded-lg border border-white/10">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
              <span>SYNC: <span className="text-white">{lastSyncTime}</span></span>
            </div>

            <button
              onClick={() => loadBracket(true)}
              disabled={refreshing}
              className="text-zinc-300 hover:text-neon-cyan flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest transition bg-white/5 hover:bg-white/10 px-3.5 py-1.5 border border-white/10 rounded-lg cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-neon-cyan' : ''}`} />
              <span>{refreshing ? 'SYNCING...' : 'SYNC LIVE'}</span>
            </button>
          </div>
        </div>

        {/* Round Filter Quick Jump Toolbar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-4 shrink-0 text-xs custom-scrollbar">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider shrink-0 mr-1">JUMP TO ROUND:</span>
          {PPCC2_LAYOUT.columns.map((col) => (
            <button
              key={col.round}
              onClick={() => scrollToRound(col.x)}
              className="bg-white/5 hover:bg-neon-cyan/20 border border-white/10 hover:border-neon-cyan/50 text-zinc-300 hover:text-neon-cyan px-3 py-1 rounded-lg text-[11px] font-bold transition whitespace-nowrap cursor-pointer"
            >
              {col.label}
            </button>
          ))}
        </div>

        {/* Scrollable Geometric Canvas Container */}
        <div
          ref={canvasRef}
          className="overflow-x-auto overflow-y-auto max-h-[62vh] pb-6 custom-scrollbar flex-grow"
        >
          <div
            className="relative select-none"
            style={{
              width: `${PPCC2_LAYOUT.config.containerWidth}px`,
              height: `${PPCC2_LAYOUT.config.containerHeight + 35}px`
            }}
          >
            {/* 1. Round Headers */}
            {PPCC2_LAYOUT.columns.map((col) => (
              <div
                key={col.round}
                className="absolute top-0 border-b border-white/10 pb-1.5 flex items-center justify-between"
                style={{ left: `${col.x}px`, width: `${col.width}px` }}
              >
                <h3 className="text-xs font-heading text-neon-cyan uppercase tracking-widest leading-none font-bold">
                  {col.label}
                </h3>
                <span className="text-[8px] bg-white/5 border border-white/10 text-zinc-400 px-1.5 py-0.5 rounded font-mono font-bold leading-none">
                  {col.matchesLabel}
                </span>
              </div>
            ))}

            {/* 2. Parametric SVG Connector Overlay Layer */}
            <svg
              className="absolute inset-0 pointer-events-none overflow-visible z-0"
              style={{
                width: `${PPCC2_LAYOUT.config.containerWidth}px`,
                height: `${PPCC2_LAYOUT.config.containerHeight}px`,
                top: '35px'
              }}
            >
              {svgConnectorsLayer}
            </svg>

            {/* 3. Standalone Match Cards Layer */}
            <div className="absolute inset-0 z-10" style={{ top: '35px' }}>
              {PPCC2_LAYOUT.slots.map((slot) => {
                const matchData = fluxMap.get(`${slot.round}-${slot.position}`);

                return (
                  <BracketMatchCard
                    key={slot.slotKey}
                    slot={slot}
                    matchData={matchData}
                    getTeamLogo={getTeamLogo}
                  />
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
