import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Trophy, Tv, MessageSquare, ExternalLink, ShieldCheck, Sparkles, X, Zap } from 'lucide-react';
import { tournaments } from '../../config/tournaments';

export default function CommandPaletteModal({ isOpen, onClose }) {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery("");
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredTournaments = tournaments.filter(t => 
    t.name.toLowerCase().includes(query.toLowerCase()) ||
    t.gameMode.toLowerCase().includes(query.toLowerCase())
  );

  const quickLinks = [
    { title: "Watch Live Stream on Twitch", icon: Tv, action: () => window.open("https://www.twitch.tv/pXpLgg", "_blank") },
    { title: "Join Official Discord Server", icon: MessageSquare, action: () => window.open("https://discord.com/invite/pixelpalacee", "_blank") },
    { title: "Akros Anti-Cheat Downloads", icon: ShieldCheck, action: () => window.open("https://akros.ac/", "_blank") },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl glass-panel bg-[#090b14] border border-white/20 rounded-2xl shadow-[0_0_50px_rgba(0,240,255,0.25)] overflow-hidden font-mono">
        
        {/* Search Bar Input */}
        <div className="relative border-b border-white/10 p-4 flex items-center gap-3">
          <Search className="w-5 h-5 text-neon-cyan shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Type a command or search tournaments..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-white placeholder-zinc-500 outline-none"
          />
          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-3 space-y-3 scrollbar-thin">
          
          {/* Tournaments Section */}
          <div>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-2 mb-1.5 block">
              TOURNAMENT CIRCUITS
            </span>
            <div className="space-y-1">
              {filteredTournaments.map(t => (
                <div
                  key={t.id}
                  onClick={() => {
                    navigate(`/register/${t.slug}`);
                    onClose();
                  }}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/10 border border-transparent hover:border-white/10 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <Trophy className="w-4 h-4 text-neon-cyan shrink-0" />
                    <div>
                      <h4 className="text-xs font-heading font-black text-white uppercase group-hover:text-neon-cyan transition-colors">
                        {t.name}
                      </h4>
                      <span className="text-[10px] text-zinc-400 uppercase font-bold">{t.gameMode} • {t.prizePool}</span>
                    </div>
                  </div>
                  <span className="text-[9px] bg-white/10 px-2 py-0.5 rounded text-zinc-300 font-bold uppercase">
                    OPEN &rarr;
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions Section */}
          <div>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-2 mb-1.5 block">
              QUICK COMMANDS
            </span>
            <div className="space-y-1">
              {quickLinks.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    item.action();
                    onClose();
                  }}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/10 border border-transparent hover:border-white/10 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <item.icon className="w-4 h-4 text-neon-pink shrink-0" />
                    <span className="text-xs font-bold text-zinc-200 group-hover:text-white uppercase">
                      {item.title}
                    </span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white" />
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer Shortcut Indicator */}
        <div className="bg-black/60 border-t border-white/10 px-4 py-2 flex items-center justify-between text-[10px] text-zinc-500 font-bold uppercase">
          <span>NAVIGATION SHORTCUT</span>
          <span>PRESS <kbd className="bg-white/10 text-zinc-300 px-1.5 py-0.5 rounded border border-white/10">ESC</kbd> TO CLOSE</span>
        </div>

      </div>
    </div>
  );
}
