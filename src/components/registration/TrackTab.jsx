import React, { useState, useEffect } from 'react';
import { 
  Search, Lock, CheckCircle2, XCircle, AlertCircle, RefreshCw, 
  User, ShieldCheck, ExternalLink, AlertOctagon, HelpCircle, Trophy, 
  MessageSquare, Clock, Copy, Check, Headphones, ShieldAlert, ChevronRight, X
} from 'lucide-react';
import { trackRegistration } from '../../services/sheets';
import { Terminal } from '../../utils/logger';

export const TrackTab = ({ tournament, playHover, playClick, onSelectPlayer }) => {
  const [searchId, setSearchId] = useState('');
  const [secondaryId, setSecondaryId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [teamData, setTeamData] = useState(null);
  const [logoError, setLogoError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [refreshCountdown, setRefreshCountdown] = useState(60);

  const isIdSequential = searchId.trim() && !(searchId.trim().length === 36 && searchId.trim().includes('-'));

  // Prefill check on mount
  useEffect(() => {
    const prefillKey = `pp_track_prefill_${tournament?.id}`;
    const storedId = localStorage.getItem(prefillKey);
    if (storedId) {
      setSearchId(storedId);
      localStorage.removeItem(prefillKey);
      handleTrack(storedId);
    }
  }, [tournament?.id]);

  // Live Auto-refresh hook (updates every 60s without screen flicker)
  useEffect(() => {
    if (!teamData || loading) return;
    const timer = setInterval(() => {
      setRefreshCountdown(prev => {
        if (prev <= 1) {
          handleTrack(teamData.submissionId || teamData.registrationId, true);
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [teamData, loading]);

  const handleTrack = async (forcedId, silent = false) => {
    const idToSearch = forcedId || searchId;
    if (!idToSearch.trim()) return;

    if (!silent) {
      setLoading(true);
      setError(null);
      setTeamData(null);
    }
    setLogoError(false);
    setRefreshCountdown(60);

    try {
      const res = await trackRegistration(tournament.id, idToSearch, isIdSequential ? secondaryId : '');
      if (res && res.success && res.team) {
        if (res.team.logo && res.team.logo.includes("drive.google.com")) {
          const driveIdMatch = res.team.logo.match(/id=([a-zA-Z0-9_-]{25,})/) || res.team.logo.match(/\/d\/([a-zA-Z0-9_-]{25,})/);
          if (driveIdMatch) {
            res.team.logo = "https://lh3.googleusercontent.com/d/" + driveIdMatch[1];
          }
        }
        setTeamData(res.team);
        // Save to local storage for quick access
        localStorage.setItem('pp_last_submission_id', idToSearch);
        if (res.team.name) localStorage.setItem('pp_last_team_name', res.team.name);
      } else {
        if (res?.error === 'VERIFICATION_REQUIRED') {
          setError("Verification required. For security, lookups using sequential Registration IDs require the Captain's FACEIT Nickname.");
        } else {
          setError(res?.error || 'ID not recognized. Please check your 36-character Submission ID.');
        }
      }
    } catch (err) {
      setError('Connection to tracking terminal failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!teamData) return;
    navigator.clipboard.writeText(teamData.submissionId || teamData.registrationId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    if (playClick) playClick();
  };

  const getStatusBadge = (status) => {
    const s = (status || '').toUpperCase();
    if (['APPROVED', 'VERIFIED', 'ROSTER_LOCKED'].includes(s)) {
      return <span className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-xs px-3 py-1 rounded-full uppercase font-mono">🟢 VERIFIED & APPROVED</span>;
    }
    if (s === 'REJECTED' || s === 'DISQUALIFIED') {
      return <span className="bg-red-500/15 border border-red-500/30 text-red-400 font-bold text-xs px-3 py-1 rounded-full uppercase font-mono">🔴 ACTION REQUIRED</span>;
    }
    return <span className="bg-amber-500/15 border border-amber-500/30 text-amber-400 font-bold text-xs px-3 py-1 rounded-full uppercase font-mono">🟡 PENDING REVIEW</span>;
  };

  return (
    <div className="max-w-4xl mx-auto font-mono">
      <div className="bg-[#080b18]/95 border border-white/10 rounded-2xl p-5 sm:p-7 min-h-[480px] max-h-[85vh] overflow-y-auto custom-scrollbar relative shadow-[0_0_60px_rgba(0,0,0,0.9)] backdrop-blur-md">
        <div className="hud-crosshair tl" /><div className="hud-crosshair tr" /><div className="hud-crosshair bl" /><div className="hud-crosshair br" />

        {/* Top Bar Header */}
        <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-neon-cyan/10 border border-neon-cyan/30 rounded-xl text-neon-cyan">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl text-white font-heading font-black tracking-wider leading-none uppercase">
                TEAM PORTAL
              </h2>
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block mt-0.5">
                CAPTAIN COMMAND & ROSTER VERIFICATION
              </span>
            </div>
          </div>

          <div>
            {teamData ? (
              <button
                onClick={() => { playClick && playClick(); setTeamData(null); setError(null); setSearchId(''); setSecondaryId(''); setLogoError(false); }}
                className="bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>EXIT SQUAD</span>
              </button>
            ) : (
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest hidden sm:inline">
                STATUS: IDLE
              </span>
            )}
          </div>
        </div>

        {!teamData ? (
          /* SEARCH INPUT FORM */
          <div className="max-w-md mx-auto py-6 text-center space-y-5">
            <div className="relative mb-2">
              <div className="absolute inset-0 bg-neon-cyan/10 blur-xl rounded-full scale-125" />
              <Search className="w-12 h-12 text-neon-cyan mx-auto relative z-10 animate-pulse" />
            </div>

            <div>
              <h3 className="text-lg font-heading text-white uppercase tracking-widest font-bold">
                ENTER SUBMISSION KEY
              </h3>
              <p className="text-zinc-400 text-xs leading-relaxed mt-1">
                Enter your 36-character Submission ID below to manage team check-in, review roster status, and view captain commands.
              </p>
            </div>

            {/* Quick Load Saved Submission ID Button if present */}
            {localStorage.getItem('pp_last_submission_id') && (
              <div className="bg-neon-cyan/10 border border-neon-cyan/30 p-3 rounded-xl flex items-center justify-between text-xs">
                <span className="text-neon-cyan font-bold truncate">
                  ⚡ SAVED SQUAD: {localStorage.getItem('pp_last_team_name') || 'MY SQUAD'}
                </span>
                <button
                  onClick={() => {
                    const savedId = localStorage.getItem('pp_last_submission_id');
                    if (savedId) {
                      setSearchId(savedId);
                      handleTrack(savedId);
                    }
                  }}
                  className="bg-neon-cyan text-black font-bold text-[10px] px-3 py-1 rounded hover:bg-white transition uppercase font-mono shrink-0 ml-2 cursor-pointer"
                >
                  QUICK LOAD
                </button>
              </div>
            )}

            <div className="space-y-4 pt-2">
              <div className="space-y-3">
                <div className="flex items-center bg-black/60 border border-white/20 rounded-xl overflow-hidden p-1 focus-within:border-neon-cyan transition-colors">
                  <input
                    type="text"
                    value={searchId}
                    onChange={(e) => setSearchId(e.target.value)}
                    placeholder="ENTER SUBMISSION ID OR REG ID"
                    className="bg-transparent border-none text-white font-mono px-4 py-2.5 focus:outline-none flex-grow text-xs placeholder-zinc-600 tracking-wider uppercase font-semibold text-center md:text-left"
                    onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
                  />
                  {!isIdSequential && (
                    <button
                      onClick={() => { playClick && playClick(); handleTrack(); }}
                      disabled={loading || !searchId.trim()}
                      className="bg-neon-cyan text-black px-5 py-2.5 font-heading font-black text-xs uppercase tracking-widest hover:bg-white transition-colors disabled:opacity-50 flex items-center gap-1.5 rounded-lg shrink-0 cursor-pointer"
                    >
                      {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'ENTER'}
                    </button>
                  )}
                </div>

                {isIdSequential && (
                  <div className="space-y-2 text-left animate-in slide-in-from-top duration-300">
                    <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest block mb-1">
                      Captain's FACEIT Nickname (Required for verification)
                    </label>
                    <div className="flex items-center bg-black/60 border border-white/20 rounded-xl overflow-hidden p-1 focus-within:border-neon-cyan transition-colors">
                      <input
                        type="text"
                        value={secondaryId}
                        onChange={(e) => setSecondaryId(e.target.value)}
                        placeholder="e.g. SultaaN-"
                        className="bg-transparent border-none text-white font-mono px-4 py-2.5 focus:outline-none flex-grow text-xs placeholder-zinc-600 tracking-wider font-semibold"
                        onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
                      />
                      <button
                        onClick={() => { playClick && playClick(); handleTrack(); }}
                        disabled={loading || !secondaryId.trim()}
                        className="bg-neon-cyan text-black px-5 py-2.5 font-heading font-black text-xs uppercase tracking-widest hover:bg-white transition-colors disabled:opacity-50 flex items-center gap-1.5 rounded-lg shrink-0 cursor-pointer"
                      >
                        {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'VERIFY'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="flex gap-3 items-start bg-red-950/20 border border-red-500/30 p-3.5 rounded-xl text-left animate-in fade-in duration-300 text-xs">
                  <AlertOctagon className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-red-400 font-bold uppercase tracking-wider block">Access Error</span>
                    <p className="text-zinc-400 text-xs mt-0.5">{error}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="text-[10px] text-zinc-500 pt-4 border-t border-white/5">
              🔒 Encrypted SHA-256 Key Lookup • Sequential IDs require Captain FACEIT Nickname
            </div>
          </div>
        ) : (
          /* TEAM DASHBOARD DECK */
          <div className="space-y-6 animate-in fade-in duration-300">
            
            {/* Team Identity Banner */}
            <div className="bg-black/40 border border-white/10 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-zinc-950 border border-white/20 rounded-xl flex items-center justify-center p-1.5 shrink-0">
                  {teamData.logo && !logoError ? (
                    <img src={teamData.logo} alt={teamData.name} className="w-full h-full object-contain" onError={() => setLogoError(true)} />
                  ) : (
                    <span className="text-neon-cyan font-bold text-lg font-heading">{teamData.tag || teamData.name?.substring(0, 3)}</span>
                  )}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white font-heading uppercase tracking-wider">
                    {teamData.name} {teamData.tag && <span className="text-neon-cyan text-lg">[{teamData.tag}]</span>}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-xs text-zinc-400">
                    <span>KEY:</span>
                    <code className="text-white bg-zinc-900 border border-white/10 px-2 py-0.5 rounded text-[11px] font-mono">
                      {teamData.submissionId || teamData.registrationId}
                    </code>
                    <button onClick={handleCopy} className="hover:text-neon-cyan transition-colors cursor-pointer">
                      {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                {getStatusBadge(teamData.status)}
                <span className="text-[10px] text-zinc-500 font-bold uppercase">
                  AUTO-SYNC IN {refreshCountdown}S
                </span>
              </div>
            </div>

            {/* Captain Action Dock */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <a
                href="https://discord.gg/pixelpalacee"
                target="_blank"
                rel="noreferrer"
                className="bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 p-3 rounded-xl flex items-center justify-between font-bold transition group"
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-indigo-400" />
                  <span>DISCORD MATCH LOBBY</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white" />
              </a>

              <div className="bg-black/40 border border-white/10 p-3 rounded-xl flex items-center justify-between">
                <span className="text-zinc-400 font-bold">ANTI-CHEAT:</span>
                <span className="text-green-400 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> AKROS READY
                </span>
              </div>

              <div className="bg-black/40 border border-white/10 p-3 rounded-xl flex items-center justify-between">
                <span className="text-zinc-400 font-bold">ROSTER SIZE:</span>
                <span className="text-neon-cyan font-bold">
                  {teamData.roster?.length || 5} PLAYERS
                </span>
              </div>
            </div>

            {/* 5v5 Roster Grid */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-heading flex items-center gap-2">
                <User className="w-4 h-4 text-neon-cyan" /> DECLARED SQUAD ROSTER ({teamData.roster?.length || 5})
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {(teamData.roster || []).map((player, idx) => (
                  <div
                    key={idx}
                    onClick={() => onSelectPlayer && onSelectPlayer(player, teamData)}
                    className="bg-black/50 hover:bg-black/80 border border-white/10 hover:border-neon-cyan/40 p-3.5 rounded-xl transition cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-zinc-900 border border-white/10 rounded-lg flex items-center justify-center text-neon-cyan font-bold font-heading">
                        {player.ign ? player.ign.substring(0, 2).toUpperCase() : 'P'}
                      </div>
                      <div>
                        <span className="font-bold text-white group-hover:text-neon-cyan transition-colors block">
                          {player.ign || player.name || `Player #${idx + 1}`}
                        </span>
                        <span className="text-[9px] text-zinc-500 uppercase font-bold block">
                          {player.role || (idx === 0 ? 'CAPTAIN' : 'CORE PLAYER')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[9px] px-2 py-0.5 rounded font-bold">
                        FACEIT LVL {player.faceitLevel || '10'}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-neon-cyan transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};
