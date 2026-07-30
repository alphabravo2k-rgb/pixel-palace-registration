import React from 'react';
import { X, Tv, Radio, ExternalLink } from 'lucide-react';

export default function TwitchStreamModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-4xl glass-panel bg-[#080914] border border-purple-500/40 rounded-2xl shadow-[0_0_80px_rgba(168,85,247,0.3)] overflow-hidden font-mono">
        
        {/* Modal Header */}
        <div className="p-4 bg-black/80 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center">
              <Tv className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm font-heading font-black text-white uppercase tracking-wider flex items-center gap-2">
                <span>PIXEL PALACE OFFICIAL TWITCH STREAM</span>
                <span className="bg-rose-500/20 text-rose-400 border border-rose-500/40 text-[9px] px-2 py-0.5 rounded font-bold uppercase flex items-center gap-1">
                  <Radio className="w-3 h-3 text-rose-400 animate-pulse" /> LIVE NOW
                </span>
              </h3>
              <p className="text-[10px] text-zinc-400">
                Official CS2 Tournament Stream • Twitch Channel: pXpLgg
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://www.twitch.tv/pXpLgg"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 text-xs font-bold uppercase transition-all flex items-center gap-1"
            >
              <span>OPEN ON TWITCH</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Embedded Twitch Iframe Player */}
        <div className="relative w-full aspect-video bg-black">
          <iframe
            src={`https://player.twitch.tv/?channel=pxplgg&parent=${window.location.hostname}&autoplay=true`}
            title="Pixel Palace Official Twitch Stream"
            height="100%"
            width="100%"
            allowFullScreen
            className="w-full h-full border-none"
          />
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-black/80 border-t border-white/10 flex items-center justify-between text-[10px] text-zinc-400 font-bold uppercase">
          <span>🎮 PIXEL PALACE CS2 COMMUNITY CUP 2 • CSTV BROADCAST</span>
          <span>CHANCE FOR EXCLUSIVE IN-GAME DROPS</span>
        </div>

      </div>
    </div>
  );
}
