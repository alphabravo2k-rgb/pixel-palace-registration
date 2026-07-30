import React from 'react';
import { ShieldAlert, Tv, Instagram, MessageCircle, Globe, Terminal, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="w-full bg-[#050507] border-t border-white/10 mt-16 py-10 relative z-10 font-mono shadow-[0_-10px_30px_rgba(0,0,0,0.9)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
          
          {/* Col 1: Brand Emblem & Identity */}
          <div className="space-y-3 md:col-span-1">
            <Link to="/" className="flex items-center gap-3 group">
              <img
                src="https://raw.githubusercontent.com/alphabravo2k-rgb/pixel-palace-registration/1a7d90c43796fd037316bdaf4f3b4de9a485d615/image_4379f9.png"
                alt="Pixel Palace Official Logo"
                className="w-12 h-12 object-contain group-hover:scale-105 transition-transform duration-300 drop-shadow-[0_0_12px_rgba(240,0,255,0.6)]"
              />
              <div>
                <h4 className="font-heading text-lg font-black text-white tracking-widest leading-none">PIXEL PALACE</h4>
                <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold block mt-1">CS2 PRO SERIES PORTAL</span>
              </div>
            </Link>
            <p className="text-[10px] text-zinc-400 leading-relaxed">
              Official tournament operating platform powered by real-time bracket sync, server anti-cheat protocols, and live spectator analytics.
            </p>
          </div>

          {/* Col 2: Platform Navigation */}
          <div className="space-y-2">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block mb-2">QUICK NAVIGATION</span>
            <ul className="space-y-1.5 text-xs text-zinc-400">
              <li>
                <Link to="/match-center" className="hover:text-neon-cyan transition-colors flex items-center gap-1">
                  <ChevronRight className="w-3 h-3 text-neon-cyan" /> Match Center & Live Streams
                </Link>
              </li>
              <li>
                <a href="#rules" className="hover:text-neon-cyan transition-colors flex items-center gap-1">
                  <ChevronRight className="w-3 h-3 text-neon-cyan" /> Official CS2 Rulebook
                </a>
              </li>
              <li>
                <a href="#track" className="hover:text-neon-cyan transition-colors flex items-center gap-1">
                  <ChevronRight className="w-3 h-3 text-neon-cyan" /> Captain Team Portal
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Anti-Cheat & Infrastructure */}
          <div className="space-y-2">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block mb-2">INFRASTRUCTURE</span>
            <div className="space-y-1 text-xs">
              <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
                <span>AKROS ANTI-CHEAT V3.2 ACTIVE</span>
              </div>
              <p className="text-[10px] text-zinc-500">128-Tick Dedicated Match Servers</p>
              <p className="text-[10px] text-zinc-500">CSTV 128-Tick Auto-Recording</p>
            </div>
          </div>

          {/* Col 4: Community & Support */}
          <div className="space-y-3">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block">COMMUNITY & SUPPORT</span>
            <div className="flex items-center gap-2">
              <a
                href="https://discord.com/invite/pixelpalacee"
                target="_blank"
                rel="noreferrer"
                className="bg-zinc-900 hover:bg-neon-purple/20 border border-white/10 hover:border-neon-purple/50 text-white p-2.5 rounded-lg transition"
                title="Discord Community"
              >
                <MessageCircle className="w-4 h-4 text-neon-cyan" />
              </a>
              <a
                href="https://www.twitch.tv/pXpLgg"
                target="_blank"
                rel="noreferrer"
                className="bg-zinc-900 hover:bg-[#6441a5]/20 border border-white/10 hover:border-[#9146FF]/50 text-white p-2.5 rounded-lg transition"
                title="Twitch Stream"
              >
                <Tv className="w-4 h-4 text-[#9146FF]" />
              </a>
              <a
                href="https://www.instagram.com/pixelpalace.gg"
                target="_blank"
                rel="noreferrer"
                className="bg-zinc-900 hover:bg-neon-pink/20 border border-white/10 hover:border-neon-pink/50 text-white p-2.5 rounded-lg transition"
                title="Instagram"
              >
                <Instagram className="w-4 h-4 text-neon-pink" />
              </a>
            </div>

            <a
              href="https://discord.com/invite/pixelpalacee"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-xs font-bold text-neon-cyan bg-neon-cyan/10 border border-neon-cyan/30 px-3 py-1.5 rounded hover:bg-neon-cyan/20 transition"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>DISCORD LIVE SUPPORT</span>
            </a>
          </div>

        </div>

        {/* Bottom Bar: Rights & Engineering Credit */}
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-zinc-500">
          <div>© 2026 PIXEL PALACE ESPORTS. ALL RIGHTS RESERVED.</div>

          <div className="flex items-center gap-2">
            <span>ENGINEERED BY</span>
            <a
              href="https://discordapp.com/users/bravo.gg"
              target="_blank"
              rel="noreferrer"
              className="text-white font-bold tracking-widest hover:text-neon-pink transition-colors font-heading"
            >
              BRAVO<span className="text-neon-pink">.</span>GG
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
}
