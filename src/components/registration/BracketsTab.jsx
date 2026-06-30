import React, { useState, useEffect } from 'react';
import { Target, Loader2, AlertOctagon, ExternalLink, Tv, RefreshCw } from 'lucide-react';
import { fetchTournamentBracket } from '../../services/sheets';

export const BracketsTab = ({
  bracketData: initialBracketData,
  tournament,
  isArchived,
  teams = []
}) => {
  const [bracketData, setBracketData] = useState(initialBracketData);
  const [loading, setLoading] = useState(!initialBracketData);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  // 1. Fetch & Auto-Poll Loop (Runs only when the tab is mounted)
  useEffect(() => {
    let active = true;
    let pollInterval = null;

    const loadBracket = async (isManual = false) => {
      if (isManual) setRefreshing(true);
      else if (!bracketData) setLoading(true);

      try {
        const data = await fetchTournamentBracket(tournament.id);
        if (active) {
          setBracketData(data);
          setError(false);
        }
      } catch (err) {
        console.error("Failed to load bracket data:", err);
        if (active && !bracketData) {
          setError(true);
        }
      } finally {
        if (active) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };

    loadBracket();

    // Poll every 15 seconds to fetch latest updates (scores, streams, status)
    pollInterval = setInterval(() => {
      loadBracket(false);
    }, 15000);

    return () => {
      active = false;
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [tournament.id]);

  // Helper: Find team logo by name (case-insensitive)
  const getTeamLogo = (teamName) => {
    if (!teamName) return null;
    const cleanName = teamName.toString().trim().toUpperCase();
    if (cleanName === 'TBD' || cleanName === 'BYE' || !cleanName) return null;
    const found = teams.find(t => (t.name || '').toString().trim().toUpperCase() === cleanName);
    return found && found.logo && found.logo.startsWith('http') ? found.logo : null;
  };

  // Helper: Flexible match timezone localization
  const formatMatchTime = (timeStr) => {
    if (!timeStr) return "TBD";
    const clean = timeStr.toString().trim();

    // Check if it's a ISO date-time string (e.g. 2026-07-31T20:00:00+05:00)
    if (clean.includes('-') && clean.includes('T')) {
      const d = new Date(clean);
      if (!isNaN(d.getTime())) {
        const dateOptions = { month: 'short', day: 'numeric' };
        const timeOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
        const dateStr = d.toLocaleDateString([], dateOptions);
        const timeStrFormatted = d.toLocaleTimeString([], timeOptions);
        return `${dateStr} @ ${timeStrFormatted} (Local)`;
      }
    }

    // Parse custom formats (e.g., "20:00 +5" or "18:30 +4 GMT" or "8:00 PM +5")
    try {
      const parts = clean.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?\s*([+-]\d{1,2})/i);
      if (parts) {
        let hrs = parseInt(parts[1], 10);
        const mins = parseInt(parts[2], 10);
        const ampm = parts[3] ? parts[3].toUpperCase() : null;
        const offset = parseInt(parts[4], 10);

        if (ampm === "PM" && hrs < 12) hrs += 12;
        if (ampm === "AM" && hrs === 12) hrs = 0;

        const targetDate = new Date();
        const utcHours = (hrs - offset + 24) % 24;
        targetDate.setUTCHours(utcHours, mins, 0, 0);

        return targetDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }) + " (Local)";
      }
    } catch (e) {
      console.warn("[Bracket] Time parse failed:", e);
    }

    return clean; // Fallback to raw string
  };

  // 2. Loading State
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto xl:max-w-7xl">
        <div className="glass-panel p-8 min-h-[600px] flex flex-col items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin mb-6 text-neon-cyan drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]" />
          <span className="font-bold tracking-[0.3em] uppercase text-sm font-body text-zinc-400">Loading live bracket feed...</span>
        </div>
      </div>
    );
  }

  // 3. Error State
  if (error || !bracketData) {
    return (
      <div className="max-w-6xl mx-auto xl:max-w-7xl">
        <div className="glass-panel p-8 min-h-[600px] flex flex-col items-center justify-center bg-red-950/10 border border-dashed border-red-500/20 rounded-md">
          <AlertOctagon className="w-12 h-12 mb-6 text-red-500" />
          <span className="font-heading text-2xl uppercase text-red-500">BRACKETS OFFLINE</span>
          <p className="text-xs font-body opacity-60 mt-2 uppercase tracking-widest text-zinc-400">Could not pull live bracket data from Google Sheets.</p>
        </div>
      </div>
    );
  }

  // 4. Render Layouts based on bracket type (live vs. legacy image)
  const isLiveBracket = bracketData.type === 'live' && Array.isArray(bracketData.matches);

  // Group and sort matches by round if live
  let rounds = [];
  let matchesByRound = {};
  if (isLiveBracket) {
    bracketData.matches.forEach(m => {
      if (!matchesByRound[m.round]) {
        matchesByRound[m.round] = [];
      }
      matchesByRound[m.round].push(m);
    });

    const ROUND_ORDER = {
      "round of 32": 1,
      "round of 16": 2,
      "quarterfinals": 3,
      "semifinals": 4,
      "grand finals": 5
    };

    rounds = Object.keys(matchesByRound).sort((a, b) => {
      const orderA = ROUND_ORDER[a.toLowerCase()] || 99;
      const orderB = ROUND_ORDER[b.toLowerCase()] || 99;
      return orderA - orderB;
    });
  }

  return (
    <div className="max-w-6xl mx-auto xl:max-w-7xl">
      <div className="glass-panel p-8 min-h-[600px]">
        <div className="hud-crosshair tl"></div><div className="hud-crosshair tr"></div>
        
        {/* Tab Header */}
        <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-6 shadow-[0_1px_0_rgba(255,255,255,0.05)]">
          <h2 className="text-4xl text-white font-heading tracking-wider leading-none uppercase flex items-center gap-3">
            <Target className="w-8 h-8 text-neon-cyan" /> Tournament Bracket
          </h2>
          {isLiveBracket && (
            <button 
              onClick={() => {
                setRefreshing(true);
                fetchTournamentBracket(tournament.id)
                  .then(data => {
                    setBracketData(data);
                    setError(false);
                  })
                  .catch(() => setError(true))
                  .finally(() => setRefreshing(false));
              }}
              disabled={refreshing}
              className="text-zinc-400 hover:text-neon-cyan flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-colors bg-black/50 px-4 py-2 border border-white/10 hover:border-neon-cyan/50 font-body disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-neon-cyan' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Sync Live'}
            </button>
          )}
        </div>

        {/* Dynamic Live Bracket Tree */}
        {isLiveBracket ? (
          <div className="flex flex-col lg:flex-row gap-8 overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-neon-cyan/20 scrollbar-track-transparent">
            {rounds.map((roundName, rIdx) => {
              const roundMatches = matchesByRound[roundName] || [];
              return (
                <div key={rIdx} className="flex-grow min-w-[280px] max-w-[340px] flex flex-col gap-6">
                  {/* Round Header */}
                  <div className="border-b border-white/10 pb-3 flex items-center justify-between">
                    <h3 className="text-sm font-heading text-neon-cyan uppercase tracking-widest leading-none">
                      {roundName}
                    </h3>
                    <span className="text-[9px] bg-white/5 border border-white/10 text-zinc-400 px-2 py-0.5 rounded font-body font-bold leading-none">
                      {roundMatches.length} Match{roundMatches.length > 1 ? 'es' : ''}
                    </span>
                  </div>
                  
                  {/* Matches List */}
                  <div className="flex flex-col gap-4">
                    {roundMatches.map((m) => {
                      const isCompleted = m.status === 'COMPLETED';
                      const isLive = m.status === 'LIVE';
                      const isOnHold = m.status === 'ON HOLD';
                      const isBye = m.status === 'BYE';
                      
                      const t1Logo = getTeamLogo(m.team1);
                      const t2Logo = getTeamLogo(m.team2);

                      return (
                        <div 
                          key={m.id} 
                          className={`bg-black/60 border ${
                            isLive 
                              ? 'border-neon-cyan/50 shadow-[0_0_15px_rgba(0,240,255,0.15)] animate-pulse' 
                              : isCompleted 
                                ? 'border-white/10 hover:border-white/20' 
                                : 'border-white/5 hover:border-white/10'
                          } rounded-lg p-3 relative overflow-hidden group transition-all`}
                        >
                           {/* Match ID and Format Tags */}
                          <div className="absolute top-1.5 right-2 flex items-center gap-1.5">
                            <span className="text-[8px] bg-white/5 border border-white/10 text-zinc-500 font-extrabold px-1 py-0.5 rounded font-body leading-none">
                              {m.format || 'BO1'}
                            </span>
                            <span className="text-[8px] font-bold text-zinc-600 font-body">
                              {m.id}
                            </span>
                          </div>

                          {/* Team 1 Row */}
                          <div className={`flex items-center justify-between py-1.5 border-b border-white/5 ${
                            isCompleted && m.winner === m.team1 ? 'text-green-400 font-semibold' : 'text-zinc-300'
                          }`}>
                            <div className="flex items-center gap-2.5 truncate pr-2">
                              {t1Logo ? (
                                <img src={t1Logo} className="w-5 h-5 rounded-full object-cover shrink-0 border border-white/10" alt="" />
                              ) : (
                                <div className="w-5 h-5 rounded-full bg-zinc-900 flex items-center justify-center text-[10px] font-bold shrink-0 border border-white/10 text-zinc-500 font-body">?</div>
                              )}
                              <span className="text-xs font-bold font-body truncate uppercase tracking-wider">
                                {m.team1 || 'TBD'}
                              </span>
                            </div>
                            <span className="text-xs font-black font-body px-1.5 bg-black/40 rounded border border-white/5">
                              {isCompleted ? (m.score.split('-')[0] || '0') : ''}
                            </span>
                          </div>

                          {/* Team 2 Row */}
                          <div className={`flex items-center justify-between py-1.5 ${
                            isCompleted && m.winner === m.team2 ? 'text-green-400 font-semibold' : 'text-zinc-300'
                          }`}>
                            <div className="flex items-center gap-2.5 truncate pr-2">
                              {t2Logo ? (
                                <img src={t2Logo} className="w-5 h-5 rounded-full object-cover shrink-0 border border-white/10" alt="" />
                              ) : (
                                <div className="w-5 h-5 rounded-full bg-zinc-900 flex items-center justify-center text-[10px] font-bold shrink-0 border border-white/10 text-zinc-500 font-body">?</div>
                              )}
                              <span className="text-xs font-bold font-body truncate uppercase tracking-wider">
                                {m.team2 || 'TBD'}
                              </span>
                            </div>
                            <span className="text-xs font-black font-body px-1.5 bg-black/40 rounded border border-white/5">
                              {isCompleted ? (m.score.split('-')[1] || '0') : ''}
                            </span>
                          </div>

                          {/* Selected Maps display */}
                          {m.maps && (
                            <div className="mt-2.5 px-2 py-1 bg-black/30 border border-white/5 rounded text-[8px] font-bold text-zinc-400 font-body truncate uppercase tracking-wider">
                              <span className="text-neon-cyan/80 font-black mr-1">MAPS:</span> {m.maps}
                            </div>
                          )}

                          {/* Match Info Footer */}
                          <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between">
                            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest font-body">
                              {formatMatchTime(m.time)}
                            </span>
                            
                            <div className="flex items-center gap-2">
                              {isLive && m.stream && (
                                <a 
                                  href={m.stream} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-[8px] bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest px-2 py-0.5 rounded shadow-[0_0_10px_rgba(220,38,38,0.5)] border border-red-500 transition-colors"
                                >
                                  <Tv size={8} /> WATCH LIVE
                                </a>
                              )}
                              {!isLive && m.stream && (
                                <a 
                                  href={m.stream} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-[8px] border border-white/10 hover:border-neon-cyan/50 text-zinc-400 hover:text-neon-cyan px-2 py-0.5 rounded transition-colors uppercase font-bold"
                                >
                                  Stream
                                </a>
                              )}
                              {isLive && !m.stream && (
                                <span className="text-[8px] bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30 px-2 py-0.5 rounded font-black tracking-widest animate-pulse">
                                  LIVE
                                </span>
                              )}
                              {isOnHold && (
                                <span className="text-[8px] bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-2 py-0.5 rounded font-bold">
                                  ON HOLD
                                </span>
                              )}
                              {isBye && (
                                <span className="text-[8px] bg-zinc-800 text-zinc-400 border border-zinc-700/30 px-2 py-0.5 rounded font-bold">
                                  BYE
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // Legacy Image Fallback Layout
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-grow bg-black/50 border border-white/10 rounded overflow-hidden min-h-[400px] flex items-center justify-center relative p-1 md:p-8">
              <p className="absolute top-4 left-4 text-[10px] text-zinc-500 font-bold uppercase font-body tracking-[0.3em] hidden md:block">LIVE FEED // STANDINGS</p>
              {tournament.bracketEmbedUrl ? (
                <iframe 
                  src={`${tournament.bracketEmbedUrl}?theme=1&multiplier=1`} 
                  width="100%" 
                  height="100%" 
                  frameBorder="0" 
                  scrolling="auto" 
                  allowTransparency="true" 
                  sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
                  className="w-full min-h-[500px] md:min-h-[700px] rounded shadow-[0_0_50px_rgba(0,240,255,0.1)] border-none"
                ></iframe>
              ) : bracketData?.bracketUrl ? (
                <img 
                  src={bracketData.bracketUrl} 
                  alt="Tournament Bracket" 
                  className="max-w-full rounded shadow-[0_0_50px_rgba(0,240,255,0.1)] border border-neon-cyan/20" 
                />
              ) : (
                <div className="text-center text-zinc-600">
                  <Target className="w-16 h-16 mb-4 mx-auto opacity-20" />
                  <h3 className="font-heading text-xl uppercase tracking-widest">Seeding Phase</h3>
                  <p className="text-xs font-body tracking-widest opacity-60 mt-2 uppercase">The bracket will be visible once teams verify check-in.</p>
                </div>
              )}
            </div>

            <div className="lg:w-80 flex-shrink-0 flex flex-col gap-6">
              <div className="bg-black/50 border border-white/10 rounded p-6">
                <h3 className="text-xl font-heading text-neon-cyan uppercase mb-4 tracking-widest">{isArchived ? "Final Stage" : "Schedule"}</h3>
                <ul className="space-y-3 font-body text-sm font-bold text-zinc-300">
                  { (tournament.scheduleUtc && tournament.scheduleUtc.length > 0) ? (
                    tournament.scheduleUtc.map((iso, i) => {
                      const labels = ["Quarterfinals", "Semifinals", "Grand Finals", "Lower Bracket", "Consolation"];
                      const label = labels[i] || "Match Stage";
                      return (
                        <li key={i} className="flex flex-col gap-1 mb-4 last:mb-0 border-l border-white/5 pl-3 ml-0.5">
                          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 leading-none">{label}</span>
                          <span className={`text-sm font-bold tracking-widest leading-none mt-1 ${isArchived ? 'text-zinc-400' : 'text-neon-cyan'}`}>
                            {formatMatchTime(iso)}
                          </span>
                          {!isArchived && (
                            <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest mt-1 opacity-50 font-body">
                              Broadcast: {(() => {
                                const date = new Date(iso);
                                const formatTime = (tz, label) => date.toLocaleTimeString('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit', hour12: true }).replace(' ', '') + ' ' + label;
                                return `${formatTime('Asia/Karachi', 'PAK')} / ${formatTime('Asia/Kolkata', 'IND')} / ${formatTime('Asia/Dubai', 'UAE')}`;
                              })()}
                            </span>
                          )}
                        </li>
                      );
                    })
                  ) : (bracketData && bracketData.schedule && bracketData.schedule.length > 0) ? (
                    bracketData.schedule.map((item, i) => (
                      <li key={i} className="flex gap-2 items-start">
                        <div className={`w-1.5 h-1.5 ${isArchived ? 'bg-yellow-500 shadow-yellow-500/50' : 'bg-neon-pink shadow-neon-pink/50'} rounded-full mt-1.5 shrink-0 shadow-[0_0_5px]`}></div>
                        <span className={isArchived ? 'text-zinc-400' : 'text-zinc-200'}>{item}</span>
                      </li>
                    ))
                  ) : isArchived ? (
                    <li className="flex gap-2 items-start">
                      <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-1.5 shrink-0 shadow-[0_0_5px_rgba(234,179,8,0.5)]"></div>
                      <span className="text-zinc-400">Grand Final: {tournament.champion?.name || "TBD"} vs {tournament.runnerUp?.name || "TBD"}</span>
                    </li>
                  ) : (
                    <p className="text-xs italic text-zinc-600 uppercase">TBD Post-Seeding</p>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
