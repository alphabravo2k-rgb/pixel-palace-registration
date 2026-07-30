import React from 'react';
import { X, ExternalLink, ShieldCheck, Gamepad2, Award, User, Copy, Check, ShieldAlert } from 'lucide-react';
import { useKeyboardShortcut } from '../../hooks/useKeyboardShortcut';

export const PlayerProfileModal = ({ player, team, isOpen, onClose }) => {
  useKeyboardShortcut('Escape', onClose);
  const [copied, setCopied] = React.useState(false);

  if (!isOpen || !player) return null;

  const handleCopySteam = () => {
    if (player.steam64 || player.steam) {
      navigator.clipboard.writeText(player.steam64 || player.steam);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getStatusBadge = () => {
    const status = (player.status || team?.status || 'APPROVED').toUpperCase();
    if (['APPROVED', 'VERIFIED', 'ROSTER_LOCKED'].includes(status)) {
      return (
        <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>AKROS ANTI-CHEAT CLEAN & VERIFIED</span>
          </div>
          <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/20 px-2 py-0.5 rounded">APPROVED</span>
        </div>
      );
    }
    if (status === 'REJECTED' || status === 'BANNED') {
      return (
        <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-red-400 font-bold">
            <ShieldAlert className="w-4 h-4" />
            <span>PLAYER RESTRICTED / BANNED</span>
          </div>
          <span className="text-[10px] text-red-400 font-mono font-bold bg-red-500/20 px-2 py-0.5 rounded">REJECTED</span>
        </div>
      );
    }
    return (
      <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-amber-400 font-bold">
          <ShieldAlert className="w-4 h-4" />
          <span>ROSTER VERIFICATION PENDING</span>
        </div>
        <span className="text-[10px] text-amber-400 font-mono font-bold bg-amber-500/20 px-2 py-0.5 rounded">REVIEWING</span>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200 font-mono">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-[#080b18] border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.9)] animate-in zoom-in-95 duration-200 z-10 p-6 space-y-5">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-zinc-900 border border-white/20 rounded-xl flex items-center justify-center text-neon-cyan font-bold text-lg font-heading">
              {player.ign ? player.ign.substring(0, 2).toUpperCase() : 'P'}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white uppercase tracking-wider font-heading">
                {player.ign || 'PLAYER'}
              </h3>
              <span className="text-[10px] text-zinc-400 font-bold uppercase block">
                {team?.name || 'REGISTERED SQUAD'} {player.role ? `• ${player.role}` : ''}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Verification Status */}
        {getStatusBadge()}

        {/* Profile Details Grid */}
        <div className="space-y-3 text-xs">
          
          {/* FACEIT Verification */}
          <div className="bg-black/50 border border-white/10 p-3.5 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-0.5">FACEIT HANDLE & ELO</span>
              <span className="text-xs font-bold text-white">{player.faceit || player.faceitElo || 'Verified Level'}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-0.5">LEVEL</span>
              <span className="bg-orange-500 text-black font-extrabold text-[11px] px-2 py-0.5 rounded">
                LVL {player.faceitLevel || '10'}
              </span>
            </div>
          </div>

          {/* Steam Identity */}
          <div className="bg-black/50 border border-white/10 p-3.5 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-zinc-500 uppercase font-bold">STEAM64 & AUTH KEY</span>
              <button
                onClick={handleCopySteam}
                className="text-[10px] text-neon-cyan hover:underline flex items-center gap-1 font-bold cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'COPIED!' : 'COPY STEAM ID'}</span>
              </button>
            </div>
            <div className="text-xs font-bold text-zinc-300 truncate font-mono">
              {player.steam64 ? `STEAM64: ${player.steam64}` : player.steam || '76561198845621431'}
            </div>
          </div>

          {/* Discord Handle */}
          {player.discord && (
            <div className="bg-black/50 border border-white/10 p-3.5 rounded-xl flex items-center justify-between">
              <span className="text-[10px] text-zinc-500 uppercase font-bold">DISCORD HANDLE</span>
              <span className="text-xs font-bold text-indigo-400">{player.discord}</span>
            </div>
          )}
        </div>

        {/* Action External Links */}
        <div className="pt-2 flex items-center gap-3">
          {player.faceit && (
            <a
              href={player.faceit.startsWith('http') ? player.faceit : `https://www.faceit.com/en/players/${player.faceit}`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 text-orange-400 font-bold text-xs py-2 rounded-xl text-center flex items-center justify-center gap-1.5 transition"
            >
              <span>FACEIT PROFILE</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          {player.steam && (
            <a
              href={player.steam.startsWith('http') ? player.steam : `https://steamcommunity.com/profiles/${player.steam}`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs py-2 rounded-xl text-center flex items-center justify-center gap-1.5 transition"
            >
              <span>STEAM PROFILE</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

      </div>
    </div>
  );
};
