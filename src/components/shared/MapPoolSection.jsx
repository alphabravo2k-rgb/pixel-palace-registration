import React, { useState } from 'react';
import { Map, Sparkles, Trophy, ShieldCheck, ExternalLink } from 'lucide-react';

export default function MapPoolSection() {
  // Pick rates based on actual CC2 (Community Cup 2) bracket data — 40 maps played across 31 matches.
  // Counts: Mirage 13 | Dust2 9 | Nuke 6 | Anubis 6 | Ancient 5 | Inferno 1 | Cache 0 | Train 0
  const maps = [
    { name: "MIRAGE",  type: "Active Duty", pickRate: "42%", picks: 13, img: "https://raw.githubusercontent.com/rpkaul/cs-map-images/main/de_mirage.png" },
    { name: "DUST2",   type: "Active Duty", pickRate: "29%", picks: 9,  img: "https://raw.githubusercontent.com/rpkaul/cs-map-images/main/de_dust2.png" },
    { name: "NUKE",    type: "Active Duty", pickRate: "19%", picks: 6,  img: "https://raw.githubusercontent.com/rpkaul/cs-map-images/main/de_nuke.png" },
    { name: "ANUBIS",  type: "Active Duty", pickRate: "19%", picks: 6,  img: "https://raw.githubusercontent.com/rpkaul/cs-map-images/main/de_anubis.png" },
    { name: "ANCIENT", type: "Active Duty", pickRate: "16%", picks: 5,  img: "https://raw.githubusercontent.com/rpkaul/cs-map-images/main/de_ancient.png" },
    { name: "INFERNO", type: "Active Duty", pickRate: "3%",  picks: 1,  img: "https://raw.githubusercontent.com/rpkaul/cs-map-images/main/de_inferno.png" },
    { name: "CACHE",   type: "Community Reserve", pickRate: "0%",  picks: 0,  img: "https://raw.githubusercontent.com/rpkaul/cs-map-images/main/de_cache.png" },
  ];

  const [activeMap, setActiveMap] = useState(maps[0]);

  return (
    <div className="w-full glass-panel p-6 rounded-2xl border border-white/15 bg-black/70 shadow-2xl font-mono relative overflow-hidden">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-5 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-neon-cyan/20 border border-neon-cyan/40 flex items-center justify-center shrink-0">
            <Map className="w-5 h-5 text-neon-cyan" />
          </div>
          <div>
            <h3 className="text-base font-heading font-black text-white uppercase tracking-wider flex items-center gap-2">
              <span>OFFICIAL CS2 COMPETITIVE MAP POOL</span>
              <span className="text-[9px] bg-neon-cyan/20 border border-neon-cyan text-neon-cyan px-2 py-0.5 rounded font-bold uppercase">
                7 MAPS
              </span>
            </h3>
            <p className="text-xs text-zinc-400">
              CC2 Pick Rates — 40 maps played across 31 matches · Active Duty Pool
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-zinc-300">
          <span className="text-zinc-500 uppercase text-[10px]">SELECTED MAP:</span>
          <span className="text-neon-pink font-heading font-black text-sm uppercase">{activeMap.name}</span>
        </div>
      </div>

      {/* Interactive Map Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {maps.map((m) => {
          const isSelected = activeMap.name === m.name;
          return (
            <div
              key={m.name}
              onClick={() => setActiveMap(m)}
              className={`relative h-28 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 border ${
                isSelected
                  ? 'border-neon-cyan scale-105 shadow-[0_0_20px_rgba(0,240,255,0.4)]'
                  : 'border-white/10 hover:border-white/30 opacity-70 hover:opacity-100'
              }`}
            >
              <img 
                src={m.img} 
                alt={m.name}
                className="w-full h-full object-cover" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              
              <div className="absolute bottom-2 left-2 right-2 text-left">
                <span className="text-xs font-heading font-black text-white uppercase block leading-none drop-shadow-md">
                  {m.name}
                </span>
                <span className="text-[9px] text-neon-cyan font-bold block mt-1">
                  {m.pickRate} PICK{m.picks > 0 ? ` · ${m.picks}x` : ''}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
