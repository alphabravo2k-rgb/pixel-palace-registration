import React, { useState, useEffect } from 'react';
import { ShieldCheck, Radio, Trophy, Sparkles, Terminal, Activity, Wifi, CheckCircle2, Zap, Lightbulb } from 'lucide-react';
import { useAudio } from '../../hooks/useAudio';

export function BootSequence({ onComplete }) {
  const [lines, setLines] = useState([]);
  const [progress, setProgress] = useState(0);
  const [activeMapIndex, setActiveMapIndex] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const { playClick } = useAudio();

  const mapBackgrounds = [
    "https://raw.githubusercontent.com/rpkaul/cs-map-images/main/de_mirage.png",
    "https://raw.githubusercontent.com/rpkaul/cs-map-images/main/de_inferno.png",
    "https://raw.githubusercontent.com/rpkaul/cs-map-images/main/de_nuke.png",
    "https://raw.githubusercontent.com/rpkaul/cs-map-images/main/de_dust2.png"
  ];

  const proTips = [
    "Akros Anti-Cheat must be active prior to launching the CS2 client.",
    "All players must join the Pixel Palace Voice Channels during tournament matches.",
    "CSTV spectator telemetry has a 120-second broadcast delay to ensure competitive integrity.",
    "Use the Broadcast Media Studio in the Match Center to export 4K social cards."
  ];

  useEffect(() => {
    // Cycle background map artwork & pro tips
    const mapInterval = setInterval(() => {
      setActiveMapIndex(prev => (prev + 1) % mapBackgrounds.length);
      setTipIndex(prev => (prev + 1) % proTips.length);
    }, 1500);

    const sequence = [
      "INIT_PIXEL_PALACE_ENTERPRISE_CORE_v3.0...",
      "ESTABLISHING_HIGH_SPEED_ESPORTS_UPLINK...",
      "AKROS_KERNEL_ANTI_CHEAT_VERIFIED [DRIVER v4.2]...",
      "CSTV_TELEMETRY_SERVERS_SYNCHRONIZED...",
      "FETCHING_TOURNAMENT_CIRCUIT_STATE...",
      "ALL_SYSTEMS_NOMINAL_WELCOME_OPERATOR"
    ];

    let currentLine = 0;
    const interval = setInterval(() => {
      if (currentLine < sequence.length) {
        setLines(prev => [...prev, sequence[currentLine]]);
        setProgress(Math.min(100, Math.round(((currentLine + 1) / sequence.length) * 100)));
        currentLine++;
      } else {
        clearInterval(interval);
        clearInterval(mapInterval);
        setIsReady(true);
        // Auto-launch after brief ready pulse
        setTimeout(() => {
          onComplete();
        }, 400);
      }
    }, 150);

    return () => {
      clearInterval(interval);
      clearInterval(mapInterval);
    };
  }, [onComplete, mapBackgrounds.length, proTips.length]);

  const handleManualEnter = () => {
    playClick();
    onComplete();
  };

  return (
    <div 
      onClick={isReady ? handleManualEnter : undefined}
      className="fixed inset-0 bg-[#03050c] z-[9999] flex flex-col items-center justify-between p-6 sm:p-10 font-mono select-none overflow-hidden cursor-pointer"
    >
      
      {/* Dynamic Background CS2 Map Showcase */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {mapBackgrounds.map((bg, idx) => (
          <img
            key={bg}
            src={bg}
            alt="CS2 Map Artwork"
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 scale-105 ${
              idx === activeMapIndex ? 'opacity-15 blur-sm' : 'opacity-0'
            }`}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-[#03050c] via-[#03050c]/80 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-neon-pink/10 via-transparent to-[#03050c]" />
      </div>

      {/* Top Diagnostics Bar */}
      <div className="w-full max-w-5xl flex items-center justify-between text-[10px] text-zinc-400 font-bold uppercase tracking-widest border-b border-white/10 pb-4 relative z-10 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-white font-heading font-black tracking-wider">PIXEL PALACE OS v3.0</span>
          <span className="hidden sm:inline text-zinc-500">• ENTERPRISE BROADCAST CORE</span>
        </div>

        {/* Real-Time Telemetry Pings */}
        <div className="flex items-center gap-4 text-[9px]">
          <span className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            <Wifi className="w-3 h-3" /> DXB DUBAI: 15ms
          </span>
          <span className="hidden md:flex items-center gap-1 text-neon-cyan bg-neon-cyan/10 px-2 py-0.5 rounded border border-neon-cyan/20">
            SGP: 28ms
          </span>
          <span className="flex items-center gap-1 text-neon-pink bg-neon-pink/10 px-2 py-0.5 rounded border border-neon-pink/20">
            <ShieldCheck className="w-3 h-3" /> AKROS SECURED
          </span>
        </div>
      </div>

      {/* Main Centered Stage */}
      <div className="flex flex-col items-center text-center my-auto relative max-w-lg w-full z-10">
        
        {/* Glow backdrop ambient lighting */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-80 h-80 bg-neon-cyan/25 blur-[120px] rounded-full pointer-events-none animate-pulse" />
        <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-80 h-80 bg-neon-pink/25 blur-[120px] rounded-full pointer-events-none" />

        {/* Logo Emblem */}
        <div className="relative mb-4">
          <div className="absolute inset-0 bg-neon-cyan/40 blur-3xl rounded-full animate-ping opacity-60" />
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border border-white/20 p-2 flex items-center justify-center bg-black/60 backdrop-blur-md shadow-[0_0_50px_rgba(0,240,255,0.3)] relative">
            <img 
              src="https://raw.githubusercontent.com/alphabravo2k-rgb/pixel-palace-registration/1a7d90c43796fd037316bdaf4f3b4de9a485d615/image_4379f9.png" 
              alt="Pixel Palace Official Logo" 
              className="w-20 h-20 sm:w-24 sm:h-24 object-contain relative z-10 drop-shadow-[0_0_30px_rgba(0,240,255,0.6)] animate-pulse"
            />
          </div>
        </div>

        {/* Title */}
        <div className="glitch-wrapper mb-2">
          <h1 className="text-4xl sm:text-5xl font-black text-white italic tracking-tighter font-heading uppercase drop-shadow-2xl leading-none glitch" data-text="PIXEL PALACE">
            PIXEL PALACE
          </h1>
        </div>

        <p className="text-[11px] text-zinc-400 font-body uppercase tracking-[0.3em] font-bold mb-6">
          The Premier CS2 Tournament Circuit & Community Platform
        </p>

        {/* Digital Progress Bar & Counter */}
        <div className="w-full space-y-2 mb-4">
          <div className="flex items-center justify-between text-xs font-bold font-mono">
            <span className="text-neon-cyan tracking-widest flex items-center gap-1.5 uppercase">
              <Activity className="w-4 h-4 text-neon-cyan animate-spin" /> INITIALIZING CIRCUIT TELEMETRY...
            </span>
            <span className="text-white text-base font-heading font-black tracking-wider">{progress}%</span>
          </div>

          <div className="w-full h-2.5 bg-black/90 border border-white/20 rounded-full overflow-hidden p-0.5 shadow-[0_0_25px_rgba(0,240,255,0.3)] relative">
            <div 
              className="h-full bg-gradient-to-r from-neon-pink via-purple-500 to-neon-cyan rounded-full transition-all duration-150 ease-out shadow-[0_0_20px_rgba(0,240,255,0.9)]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Pro Tip Strip */}
        <div className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 mb-4 flex items-center gap-2 text-left">
          <Lightbulb className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
          <p className="text-[10px] text-zinc-300 font-bold uppercase truncate">
            {proTips[tipIndex]}
          </p>
        </div>

        {/* Terminal Line Feed Box */}
        <div className="w-full bg-black/80 border border-white/15 rounded-xl p-3 h-28 overflow-hidden text-left flex flex-col justify-end text-[10px] font-mono shadow-2xl backdrop-blur-md">
          {lines.map((line, i) => (
            <div key={i} className="text-zinc-300 tracking-wider uppercase animate-in slide-in-from-bottom-1 duration-150 flex items-center gap-2 py-0.5">
              <span className="text-neon-cyan font-bold">{'>'}</span> 
              <span className={i === lines.length - 1 ? "text-neon-cyan font-bold" : "text-zinc-400"}>
                {line}
              </span>
            </div>
          ))}
          {progress < 100 && (
            <div className="text-neon-pink text-[10px] tracking-widest uppercase animate-pulse mt-0.5 flex items-center gap-2">
              <span className="text-neon-pink font-bold">{'>'}</span> <span className="animate-ping">_</span>
            </div>
          )}
        </div>

      </div>

      {/* Bottom Footer Badges */}
      <div className="w-full max-w-5xl border-t border-white/10 pt-4 flex flex-wrap items-center justify-between gap-3 text-[10px] text-zinc-400 font-bold uppercase tracking-widest relative z-10 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-zinc-300">
          <ShieldCheck className="w-4 h-4 text-neon-cyan" />
          <span>AKROS KERNEL ANTI-CHEAT INSTALLED</span>
        </div>

        <div className="flex items-center gap-2 text-rose-400">
          <Radio className="w-4 h-4 text-rose-400 animate-pulse" />
          <span>CSTV MATCH TELEMETRY READY</span>
        </div>
      </div>

    </div>
  );
}
