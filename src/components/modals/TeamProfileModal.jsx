import { Crosshair, X, MessageSquare, AlertTriangle, CheckCircle2, Clock, Shield, Ban, Trophy, Hourglass, Gamepad2, ChevronRight, User } from 'lucide-react';
import React, { useState } from 'react';
import { useKeyboardShortcut } from '../../hooks/useKeyboardShortcut';

const getFaceitLevelStyle = (lvlStr) => {
  const lvl = parseInt(lvlStr);
  if (isNaN(lvl) || lvl <= 0) return { bg: 'bg-zinc-800 text-zinc-500', text: 'text-zinc-500', label: '-' };

  if (lvl === 1) {
    return { bg: 'bg-[#4D5356] text-white', text: 'text-[#4D5356]', label: '1' };
  }
  if (lvl === 2 || lvl === 3) {
    return { bg: 'bg-[#00E65A] text-black font-extrabold', text: 'text-[#00E65A]', label: String(lvl) };
  }
  if (lvl >= 4 && lvl <= 7) {
    return { bg: 'bg-[#FFC800] text-black font-extrabold', text: 'text-[#FFC800]', label: String(lvl) };
  }
  if (lvl === 8 || lvl === 9) {
    return { bg: 'bg-[#FF5E00] text-white font-extrabold', text: 'text-[#FF5E00]', label: String(lvl) };
  }
  if (lvl === 10) {
    return { bg: 'bg-[#FF1E27] text-white font-extrabold shadow-[0_0_10px_rgba(255,30,39,0.5)] border border-[#FF1E27]/30', text: 'text-[#FF1E27]', label: '10' };
  }
  return { bg: 'bg-zinc-800 text-zinc-300', text: 'text-zinc-300', label: String(lvl) };
};

const getSeedStyle = (seedName) => {
  const seed = (seedName || '').toString().trim().toUpperCase();
  const SEEDS_MAP = {
    'IRON': { bg: 'bg-[#607D8B]/10 text-[#607D8B] border-[#607D8B]/30' },
    'BRONZE': { bg: 'bg-[#A0522D]/10 text-[#A0522D] border-[#A0522D]/30' },
    'SILVER': { bg: 'bg-[#9E9E9E]/10 text-[#9E9E9E] border-[#9E9E9E]/30' },
    'GOLD': { bg: 'bg-[#FFC107]/10 text-[#FFC107] border-[#FFC107]/30' },
    'PLATINUM': { bg: 'bg-[#00ACC1]/10 text-[#00ACC1] border-[#00ACC1]/30' },
    'DIAMOND': { bg: 'bg-[#7B1FA2]/10 text-[#7B1FA2] border-[#7B1FA2]/30' },
    'ELITE': { bg: 'bg-[#E91E63]/10 text-[#E91E63] border-[#E91E63]/30' },
  };
  return SEEDS_MAP[seed] || { bg: 'bg-zinc-800/40 text-zinc-400 border-zinc-700/40' };
};

export const TeamProfileModal = ({ team, onClose, onSelectPlayer }) => {
  useKeyboardShortcut('Escape', onClose);
  const [logoFailed, setLogoFailed] = useState(false);
  if (!team) return null;

  // ── Status configuration ───────────────────────────────────────────────
  const STATUS_CONFIG = {
    'VERIFIED': { label: 'VERIFIED', color: 'bg-green-500/10 text-green-400 border-green-500/30', icon: CheckCircle2 },
    'PENDING REVIEW': { label: 'PENDING REVIEW', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30', icon: Clock },
    'OBJECTION': { label: 'ACTION REQUIRED', color: 'bg-orange-500/10 text-orange-400 border-orange-500/40', icon: AlertTriangle },
    'WAITLISTED': { label: 'WAITLISTED', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30', icon: Hourglass },
    'REJECTED': { label: 'NOT ACCEPTED', color: 'bg-red-500/10 text-red-400 border-red-500/30', icon: Ban },
    'DISQUALIFIED': { label: 'DISQUALIFIED', color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30', icon: Shield },
    'CHAMPION': { label: 'CHAMPION 🏆', color: 'bg-yellow-400/10 text-yellow-300 border-yellow-400/40', icon: Trophy },
  };

  const statusKey = team.status || 'VERIFIED';
  const statusCfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG['VERIFIED'];
  const StatusIcon = statusCfg.icon || CheckCircle2;
  
  // Resolve roster array from registered roster, API players array, or squad players
  const rawRoster = team.roster || team.players || team.team1_players || team.team2_players || [];
  const activeRoster = rawRoster.map((p, idx) => ({
    ign: p.ign || p.name || p.username || (typeof p === 'string' ? p : `Player ${idx + 1}`),
    role: p.role || (idx === 0 ? 'Captain' : 'Player'),
    faceitLevel: p.faceitLevel || p.level || p.skill_level || 10,
    faceitElo: p.faceitElo || p.elo || p.faceit_elo || 2042,
    steamId: p.steamId || p.steam_id || 'STEAM_0:1:76561198',
  }));

  const captainPlayer = activeRoster.find(p => (p.role || '').toLowerCase().includes('captain')) || activeRoster[0];

  const getTeamTag = (name) => name?.slice(0, 3).toUpperCase();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200 font-mono">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={onClose} />

      {/* Modal Card - Constrained to 85vh to fit any screen with internal scrolling */}
      <div className="relative w-full max-w-3xl max-h-[85vh] bg-[#080b18] border border-indigo-500/30 rounded-2xl flex flex-col overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.9)] animate-in zoom-in-95 duration-200 z-10">
        
        {/* Sticky Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0b0e22] border-b border-slate-800/80 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold bg-neon-cyan/15 border border-neon-cyan/30 text-neon-cyan px-2.5 py-1 rounded">
              [{team.tag || getTeamTag(team.name) || 'TEAM'}]
            </span>
            <h2 className="text-lg font-black text-white font-heading uppercase tracking-wider truncate">
              {team.name || 'REGISTERED SQUAD'}
            </h2>
            <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${statusCfg.color}`}>
              <StatusIcon size={10} />
              {statusCfg.label}
            </span>
          </div>

          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-white transition-all font-mono text-xs font-bold cursor-pointer"
          >
            <span>✕ Close</span>
            <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">ESC</span>
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="overflow-y-auto max-h-[calc(85vh-70px)] p-6 space-y-6 custom-scrollbar">

          {/* Team Meta Hero Banner */}
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 bg-[#0c1026] border border-slate-800/80 p-5 rounded-xl relative overflow-hidden">
            {/* Logo */}
            <div className="w-20 h-20 rounded-xl bg-slate-950 border border-slate-800 p-2 shrink-0 shadow-xl relative group">
              <img
                src={logoFailed || !team.logo || !team.logo.startsWith('http') ? 'https://raw.githubusercontent.com/rpkaul/cs-map-images/main/de_dust2.png' : team.logo}
                alt={team.name}
                className={`w-full h-full object-contain relative z-10 ${logoFailed ? 'opacity-20 grayscale' : ''}`}
                onError={() => setLogoFailed(true)}
              />
            </div>

            {/* Info Grid */}
            <div className="flex-grow space-y-4 text-center md:text-left">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/60 border border-slate-800/60 p-3 rounded-lg text-xs">
                <div>
                  <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">Average ELO</span>
                  <span className="text-base font-bold text-neon-cyan">{team.averageElo || '2042'} ELO</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">Tournament Seed</span>
                  <span className="text-base font-bold text-white">#{team.seed || '01'} SEED</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">Active Roster</span>
                  <span className="text-base font-bold text-emerald-400">{activeRoster.length} Players</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">Region</span>
                  <span className="text-base font-bold text-slate-300">{team.region || 'PAKISTAN'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs text-slate-400 border-t border-slate-800/60 pt-3">
                <div>
                  <span className="text-[9px] text-slate-500 uppercase block font-bold">Team Captain</span>
                  <span className="text-white font-bold">{captainPlayer?.ign || 'SultaaN-'}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 uppercase block font-bold">Qualification</span>
                  <span className="text-white font-bold">{team.inviteCode ? 'Invited Squad' : 'Open Qualifier'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Roster Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-neon-cyan uppercase tracking-widest flex items-center gap-2 font-heading">
                <Crosshair className="w-4 h-4 text-neon-cyan" /> REGISTERED SQUAD ROSTER ({activeRoster.length})
              </h3>
              <span className="text-[10px] text-zinc-500">CLICK ANY PLAYER TO VIEW PROFILE</span>
            </div>

            {activeRoster.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs uppercase tracking-widest bg-slate-950 border border-dashed border-slate-800 rounded-xl">
                Roster details pending verification.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {activeRoster.map((p, i) => (
                  <div
                    key={i}
                    onClick={() => onSelectPlayer && onSelectPlayer(p, team)}
                    className="bg-[#0b0f24] hover:bg-[#111636] border border-slate-800/80 hover:border-neon-cyan/50 p-3.5 rounded-xl transition cursor-pointer space-y-2.5 group"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                      <div className="flex items-center gap-2 truncate">
                        <span className={`w-2 h-2 rounded-full ${p.role === 'Captain' || i === 0 ? 'bg-amber-400' : 'bg-neon-cyan'}`} />
                        <span className="text-xs font-bold text-white group-hover:text-neon-cyan transition-colors uppercase tracking-wider truncate">
                          {p.ign || `PLAYER #${i+1}`}
                        </span>
                      </div>
                      <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${
                        p.role === 'Captain' || i === 0 ? 'bg-amber-500/10 border-amber-500/40 text-amber-400' : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}>
                        {p.role || (i === 0 ? 'Captain' : `Player ${i+1}`)}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between items-center bg-slate-950 px-2.5 py-1.5 rounded border border-slate-850">
                        <span className="text-[9px] text-slate-500 uppercase font-bold">FACEIT LVL</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${getFaceitLevelStyle(p.faceitLevel || 10).bg}`}>
                          LVL {p.faceitLevel || 10}
                        </span>
                      </div>
                      <div className="flex justify-between items-center bg-slate-950 px-2.5 py-1.5 rounded border border-slate-850">
                        <span className="text-[9px] text-slate-500 uppercase font-bold">FACEIT ELO</span>
                        <span className="text-neon-cyan font-bold">{p.faceitElo || '2000'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
