import React, { useState } from 'react';
import { X, Trophy, AlertTriangle, ShieldCheck } from 'lucide-react';
import { tournamentService } from '../../services/TournamentService';

export function AdminScoreOverrideModal({ isOpen, onClose, match, onRefresh }) {
  const [scoreA, setScoreA] = useState(match?.seriesScore?.teamAWins ?? match?.map_wins_team1 ?? 0);
  const [scoreB, setScoreB] = useState(match?.seriesScore?.teamBWins ?? match?.map_wins_team2 ?? 0);
  const [status, setStatus] = useState(match?.status || 'Live');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !match) return null;

  const teamAName = match.teamA?.name || match.team1_name || match.team1 || 'Team A';
  const teamBName = match.teamB?.name || match.team2_name || match.team2 || 'Team B';

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Execute match score override
      await tournamentService.updateMatchScore(match.id, {
        score_team1: Number(scoreA),
        score_team2: Number(scoreB),
        status: status,
      });

      if (onRefresh) onRefresh();
      onClose();
    } catch (err) {
      alert(`Failed to update score: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWalkover = async (winnerSide) => {
    const winnerName = winnerSide === 'A' ? teamAName : teamBName;
    if (!window.confirm(`Declare Walkover (W.O.) victory for ${winnerName}?`)) return;

    setIsSubmitting(true);
    try {
      const finalScoreA = winnerSide === 'A' ? 1 : 0;
      const finalScoreB = winnerSide === 'B' ? 1 : 0;

      await tournamentService.updateMatchScore(match.id, {
        score_team1: finalScoreA,
        score_team2: finalScoreB,
        status: 'Completed',
        winner: winnerSide === 'A' ? 'team1' : 'team2'
      });

      if (onRefresh) onRefresh();
      onClose();
    } catch (err) {
      alert(`Walkover declaration failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 animate-in fade-in duration-150">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-[#090c19] border border-slate-800 rounded-2xl p-6 shadow-[0_0_60px_rgba(0,0,0,0.9)] font-mono z-10 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm font-black text-white uppercase tracking-wider">
              Admin Match Override — #{match.id}
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Teams & Score Controls */}
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-2 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-850">
            {/* Team A */}
            <div className="space-y-2 text-center">
              <span className="text-xs font-bold text-white uppercase block truncate">{teamAName}</span>
              <div className="flex justify-center">
                <input
                  type="number"
                  min="0"
                  max="16"
                  value={scoreA}
                  onChange={(e) => setScoreA(e.target.value)}
                  className="w-16 h-12 text-center text-xl font-black bg-slate-900 border border-slate-700 text-amber-400 rounded-lg focus:outline-none focus:border-amber-400"
                />
              </div>
              <button
                type="button"
                onClick={() => handleWalkover('A')}
                className="text-[9px] font-bold text-amber-400 hover:text-amber-300 uppercase underline cursor-pointer"
              >
                Declare W.O. Victory
              </button>
            </div>

            {/* Team B */}
            <div className="space-y-2 text-center">
              <span className="text-xs font-bold text-white uppercase block truncate">{teamBName}</span>
              <div className="flex justify-center">
                <input
                  type="number"
                  min="0"
                  max="16"
                  value={scoreB}
                  onChange={(e) => setScoreB(e.target.value)}
                  className="w-16 h-12 text-center text-xl font-black bg-slate-900 border border-slate-700 text-amber-400 rounded-lg focus:outline-none focus:border-amber-400"
                />
              </div>
              <button
                type="button"
                onClick={() => handleWalkover('B')}
                className="text-[9px] font-bold text-amber-400 hover:text-amber-300 uppercase underline cursor-pointer"
              >
                Declare W.O. Victory
              </button>
            </div>
          </div>

          {/* Match Status Select */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Match Lifecycle Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-xs text-white p-2.5 rounded-lg font-mono focus:outline-none focus:border-amber-400"
            >
              <option value="Upcoming">⏳ Upcoming / Pending</option>
              <option value="Live">● Live Match</option>
              <option value="Completed">✓ Completed / Finished</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
            >
              {isSubmitting ? 'Saving Override…' : 'Save Score Override'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
