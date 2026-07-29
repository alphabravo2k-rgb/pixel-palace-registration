import React from 'react';
import { X, Tv, MessageSquare } from 'lucide-react';

export function StreamModal({ isOpen, onClose, match }) {
  if (!isOpen) return null;

  const team1Name = match?.team1Obj?.name || match?.team1 || 'Team A';
  const team2Name = match?.team2Obj?.name || match?.team2 || 'Team B';
  const matchId = match?.id || '1';

  // Embed channel URL (default Pixel Palace YouTube stream embed)
  const embedUrl = match?.streamUrl || "https://www.youtube.com/embed/live_stream?channel=pixelpalaceesports&autoplay=1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl bg-[#0b0e1b] border border-violet-500/40 rounded-2xl overflow-hidden shadow-2xl space-y-0"
        style={{ boxShadow: '0 0 50px rgba(139, 92, 246, 0.25)' }}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/80 border-b border-slate-800 font-mono">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs font-black text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-full uppercase tracking-wider">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
              LIVE BROADCAST
            </span>
            <span className="text-xs font-black text-white">
              MATCH #{matchId} · {team1Name} vs {team2Name}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Stream Video Iframe */}
        <div className="relative aspect-video w-full bg-black">
          <iframe
            src={embedUrl}
            title="Pixel Palace CS2 Live Broadcast"
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-3 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between font-mono text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <Tv size={14} className="text-violet-400" />
            <span>Pixel Palace Official CS2 Stream</span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-bold text-violet-300 hover:text-white transition"
            >
              Open in YouTube ↗
            </a>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded text-xs transition"
            >
              Close Stream
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
