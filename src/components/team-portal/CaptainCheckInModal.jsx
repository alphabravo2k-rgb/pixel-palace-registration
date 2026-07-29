import React, { useState, useEffect } from 'react';
import { Shield, Clock, CheckCircle2, AlertCircle, X, Swords } from 'lucide-react';

export function CaptainCheckInModal({ isOpen, onClose, match, onReadyConfirm }) {
  const [teamAReady, setTeamAReady] = useState(false);
  const [teamBReady, setTeamBReady] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(900); // 15 mins countdown

  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen || !match) return null;

  const teamAName = match.teamA?.name || match.team1_name || match.team1 || 'Team A';
  const teamBName = match.teamB?.name || match.team2_name || match.team2 || 'Team B';

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleToggleReady = (teamSide) => {
    if (teamSide === 'A') {
      const nextState = !teamAReady;
      setTeamAReady(nextState);
      if (nextState && teamBReady && onReadyConfirm) onReadyConfirm();
    } else {
      const nextState = !teamBReady;
      setTeamBReady(nextState);
      if (teamAReady && nextState && onReadyConfirm) onReadyConfirm();
    }
  };

  return (
    <div className="fixed inset-0 z-[180] flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-[#080b18] border border-slate-800 rounded-2xl p-6 shadow-[0_0_80px_rgba(0,0,0,0.9)] font-mono z-10 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-black text-white uppercase tracking-wider">
              Captain Pre-Match Check-In Hub
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Match Title & Timer */}
        <div className="bg-[#0c1024] border border-slate-800/80 p-4 rounded-xl text-center space-y-2">
          <div className="text-[10px] text-slate-500 uppercase tracking-widest">CHECK-IN DEADLINE COUNTDOWN</div>
          <div className="text-3xl font-black text-emerald-400 tracking-wider">
            {formatTimer(secondsLeft)}
          </div>
          <div className="text-xs text-slate-300 font-bold uppercase">
            Match #{match.id} · {match.round || 'Round of 32'}
          </div>
        </div>

        {/* Ready-Up Captain Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Team A */}
          <div className={`p-4 rounded-xl border transition-all text-center space-y-3 ${
            teamAReady ? 'bg-emerald-950/30 border-emerald-500/50' : 'bg-slate-950 border-slate-800'
          }`}>
            <span className="text-xs font-bold text-white uppercase block truncate">{teamAName}</span>
            <div className="flex justify-center">
              {teamAReady ? (
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 border border-emerald-800 px-2.5 py-1 rounded flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> READY
                </span>
              ) : (
                <span className="text-[10px] font-bold text-slate-500 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded flex items-center gap-1">
                  <Clock className="w-3 h-3" /> PENDING
                </span>
              )}
            </div>
            <button
              onClick={() => handleToggleReady('A')}
              className={`w-full py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                teamAReady
                  ? 'bg-slate-900 border border-slate-700 text-slate-300 hover:bg-slate-850'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20'
              }`}
            >
              {teamAReady ? 'Cancel Check-In' : '⚔️ READY UP'}
            </button>
          </div>

          {/* Team B */}
          <div className={`p-4 rounded-xl border transition-all text-center space-y-3 ${
            teamBReady ? 'bg-emerald-950/30 border-emerald-500/50' : 'bg-slate-950 border-slate-800'
          }`}>
            <span className="text-xs font-bold text-white uppercase block truncate">{teamBName}</span>
            <div className="flex justify-center">
              {teamBReady ? (
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 border border-emerald-800 px-2.5 py-1 rounded flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> READY
                </span>
              ) : (
                <span className="text-[10px] font-bold text-slate-500 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded flex items-center gap-1">
                  <Clock className="w-3 h-3" /> PENDING
                </span>
              )}
            </div>
            <button
              onClick={() => handleToggleReady('B')}
              className={`w-full py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                teamBReady
                  ? 'bg-slate-900 border border-slate-700 text-slate-300 hover:bg-slate-850'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20'
              }`}
            >
              {teamBReady ? 'Cancel Check-In' : '⚔️ READY UP'}
            </button>
          </div>
        </div>

        {/* Footer Notice */}
        <div className="text-[10px] text-slate-500 text-center border-t border-slate-850 pt-3">
          Both team captains must check in 15 mins prior to match start to proceed to server launch.
        </div>

      </div>
    </div>
  );
}
