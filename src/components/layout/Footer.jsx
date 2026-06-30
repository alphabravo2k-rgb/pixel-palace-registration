import React from 'react';
import { ShieldAlert, Tv, Instagram } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full bg-black/90 border-t border-white/10 mt-20 py-12 relative z-10 shadow-[0_-10px_30px_rgba(0,0,0,0.8)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-3 gap-10 items-center">
        
        {/* LEFT: Identity */}
        <div className="flex items-center gap-5 justify-center md:justify-start group cursor-pointer">
          <img 
            src="https://raw.githubusercontent.com/alphabravo2k-rgb/pixel-palace-registration/1a7d90c43796fd037316bdaf4f3b4de9a485d615/image_4379f9.png" 
            alt="Pixel Palace Logo" 
            className="w-16 h-16 object-contain filter grayscale opacity-40 group-hover:opacity-100 group-hover:grayscale-0 group-hover:drop-shadow-[0_0_15px_rgba(240,0,255,0.5)] transition-all duration-500" 
          />
          <div className="h-12 w-[2px] bg-white/10 group-hover:bg-[#f000ff] transition-colors"></div>
          <div className="text-left flex flex-col justify-center">
            <h4 className="font-heading text-3xl text-zinc-300 group-hover:text-white leading-none tracking-[0.15em] transition-colors">PIXEL PALACE</h4>
            <p className="text-[9px] uppercase tracking-[0.3em] text-zinc-600 mt-1 font-bold font-body">
              © 2026 Sovereign Systems
            </p>
          </div>
        </div>

        {/* CENTER: Credit */}
        <div className="flex flex-col items-center justify-center text-center">
          <span className="text-[8px] uppercase tracking-[0.5em] text-zinc-700 font-bold mb-2 font-body">Engineered By</span>
          <a 
            href="https://discordapp.com/users/bravo.gg" 
            target="_blank" 
            rel="noreferrer" 
            className="text-lg font-black tracking-[0.3em] uppercase text-zinc-400 hover:text-white hover:drop-shadow-[0_0_15px_rgba(255,255,255,0.8)] transition-all duration-300 font-heading"
          >
            BRAVO<span className="text-[#f000ff]">.</span>GG
          </a>
        </div>

        {/* RIGHT: Socials & Support */}
        <div className="flex items-center justify-center md:justify-end gap-3">
          <a 
            href="https://www.twitch.tv/pXpLgg" 
            target="_blank" 
            rel="noreferrer" 
            className="flex items-center justify-center bg-black border border-white/10 hover:border-[#9146FF] transition-all p-3 shadow-[0_5px_15px_rgba(0,0,0,0.5)] hover:shadow-[0_0_15px_rgba(145,70,255,0.3)] group"
          >
            <Tv className="w-5 h-5 text-zinc-500 group-hover:text-[#9146FF] transition-colors" />
          </a>
          
          <a 
            href="https://www.instagram.com/pixelpalace.gg" 
            target="_blank" 
            rel="noreferrer" 
            className="flex items-center justify-center bg-black border border-white/10 hover:border-[#f000ff] transition-all p-3 shadow-[0_5px_15px_rgba(0,0,0,0.5)] hover:shadow-[0_0_15px_rgba(240,0,255,0.3)] group"
          >
            <Instagram className="w-5 h-5 text-zinc-500 group-hover:text-[#f000ff] transition-colors" />
          </a>

          <a 
            href="https://discord.com/invite/pixelpalacee" 
            target="_blank" 
            rel="noreferrer" 
            className="group flex items-center gap-3 px-5 py-2.5 bg-black border border-white/10 hover:border-[#00f0ff] transition-all duration-300 shadow-[0_5px_15px_rgba(0,0,0,0.5)] hover:shadow-[0_0_20px_rgba(0,240,255,0.2)]"
          >
            <div className="bg-zinc-900 group-hover:bg-[#00f0ff]/20 p-2 rounded-sm transition-colors">
              <ShieldAlert className="w-4 h-4 text-zinc-500 group-hover:text-[#00f0ff] transition-colors" />
            </div>
            <div className="flex flex-col text-left font-body">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-300 group-hover:text-white leading-none transition-colors">Contact Support</span>
            </div>
          </a>
        </div>
      </div>
    </footer>
  );
}
