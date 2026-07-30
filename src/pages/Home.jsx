import React, { useState, useEffect, useMemo } from 'react';
import { CalendarX, Trophy, Users, Award, Target, History, Globe, Sparkles, Flame, Radio, ArrowRight, ShieldCheck, Zap, Search, Command, Crown, Lock, Clock, MessageSquare, Tv, Instagram, Map } from 'lucide-react';
import { tournaments } from '../config/tournaments';
import TournamentFilterTabs from '../components/shared/TournamentFilterTabs';
import TournamentCard from '../components/shared/TournamentCard';
import MapPoolSection from '../components/shared/MapPoolSection';
import CommandPaletteModal from '../components/modals/CommandPaletteModal';
import TwitchStreamModal from '../components/modals/TwitchStreamModal';
import { CountUp } from '../components/ui/CountUp';
import { Magnetic } from '../components/ui/Magnetic';
import { useAudio } from '../hooks/useAudio';
import { Link } from 'react-router-dom';

export const Home = () => {
  const { playHover, playClick } = useAudio();
  
  // Intelligent default tab based on live circuits
  const hasLive = tournaments.some(t => t.status === "LIVE");
  const [activeTab, setActiveTab] = useState(hasLive ? "LIVE" : "ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  // Modals state
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isTwitchOpen, setIsTwitchOpen] = useState(false);

  // Auto-detected player timezone string
  const playerTimezone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch {
      return "UTC";
    }
  }, []);

  const categories = ["ALL", "CS2 5V5", "CS2 1V1", "WINGMAN", "FC26", "ROCKET LEAGUE"];

  // Extract live, upcoming, and archived tournaments from tournaments config
  const liveTournaments = useMemo(() => tournaments.filter(t => t.status === "LIVE"), []);
  const upcomingTournaments = useMemo(() => tournaments.filter(t => t.status === "UPCOMING"), []);
  const archivedTournaments = useMemo(() => tournaments.filter(t => t.status === "ARCHIVED"), []);

  const primaryLive = liveTournaments[0] || tournaments[0];

  // Auto-updating real-time live countdown timer (1-second precision)
  const [countdownText, setCountdownText] = useState("");

  useEffect(() => {
    if (!primaryLive?.tournamentDate) return;

    const updateTimer = () => {
      const target = new Date(primaryLive.tournamentDate).getTime();
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) {
        setCountdownText("MATCHES IN PROGRESS");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) {
        setCountdownText(`BEGINS IN ${days}D ${hours}H ${mins}M ${secs}S`);
      } else {
        setCountdownText(`BEGINS IN ${hours}H ${mins}M ${secs}S`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [primaryLive]);

  // Calculate Org Level Statistics directly from real tournaments data
  const orgStats = useMemo(() => {
    let totalPrize = 0;
    const regionsSet = new Set();

    tournaments.forEach(t => {
      if (t.prizePool) {
        const matches = t.prizePool.match(/\$[0-9,]+/g);
        if (matches) {
          matches.forEach(match => {
            const amount = parseInt(match.replace(/[^0-9]/g, ''), 10);
            if (!isNaN(amount)) totalPrize += amount;
          });
        }
      }
      if (t.region) regionsSet.add(t.region);
    });

    return {
      totalEvents: tournaments.length,
      totalPrize: totalPrize > 0 ? totalPrize : 17000,
      totalRegions: regionsSet.size > 0 ? regionsSet.size : 4
    };
  }, []);

  // Dynamic Grid Filtering
  const displayedGridTournaments = useMemo(() => {
    let list = tournaments;
    
    if (activeTab === "LIVE") {
      list = liveTournaments;
    } else if (activeTab === "UPCOMING") {
      list = upcomingTournaments;
    } else if (activeTab === "ARCHIVED") {
      list = archivedTournaments;
    } else {
      list = [...liveTournaments, ...upcomingTournaments, ...archivedTournaments];
    }

    if (selectedCategory !== "ALL") {
      list = list.filter(t => 
        t.gameMode?.toUpperCase().includes(selectedCategory.replace("CS2 ", "")) || 
        t.name.toUpperCase().includes(selectedCategory)
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(t => 
        t.name.toLowerCase().includes(q) || 
        t.gameMode.toLowerCase().includes(q) ||
        t.region.toLowerCase().includes(q)
      );
    }
    return list;
  }, [activeTab, selectedCategory, searchQuery, liveTournaments, upcomingTournaments, archivedTournaments]);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 animate-in fade-in duration-500 relative z-10 font-mono space-y-6">
      
      {/* 🔴 Real-Time Auto-Updating Announcement Marquee Ticker */}
      <div className="w-full bg-black/80 border border-white/15 rounded-xl px-4 py-2 flex items-center justify-between text-xs backdrop-blur-md shadow-[0_0_25px_rgba(255,0,127,0.12)] overflow-hidden">
        <div className="flex items-center gap-2.5 shrink-0 pr-4 border-r border-white/10">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
          </span>
          <span className="font-heading font-black text-rose-400 uppercase tracking-widest text-[10px]">
            REAL-TIME COUNTDOWN
          </span>
        </div>

        <div className="overflow-hidden whitespace-nowrap text-zinc-300 font-bold text-[11px] uppercase tracking-wider flex items-center gap-8 animate-marquee">
          {primaryLive ? (
            <>
              <span className="text-amber-400">⏱️ {primaryLive.name.toUpperCase()} • {countdownText}</span>
              <span className="text-rose-400">• 🔒 REGISTRATION CLOSED • 32 TEAMS SEEDED</span>
              <span className="text-neon-cyan">• LOCAL TIMEZONE: {playerTimezone}</span>
              <button onClick={() => setIsTwitchOpen(true)} className="text-neon-pink hover:underline cursor-pointer">
                • 📺 WATCH STREAM LIVE
              </button>
            </>
          ) : (
            <span>🏆 PIXEL PALACE CS2 TOURNAMENT CIRCUIT • {orgStats.totalEvents} EVENTS • ${orgStats.totalPrize.toLocaleString()} USD DISTRIBUTED</span>
          )}
        </div>
      </div>

      {/* 👑 CLEAN BRAND IDENTITY HERO STAGE */}
      <div className="flex flex-col items-center text-center relative glass-panel p-6 sm:p-8 rounded-2xl border border-white/20 bg-gradient-to-b from-[#180728]/90 via-black/90 to-[#040914] shadow-[0_0_60px_rgba(0,240,255,0.12)] overflow-hidden">
        
        {/* Top-Right Corner Badges: Twitch Watch Button & Social Handles */}
        <div className="absolute top-4 right-4 hidden sm:flex items-center gap-2 z-20">
          <button
            onClick={() => setIsTwitchOpen(true)}
            className="p-1.5 px-2.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 transition-all border border-purple-500/40 flex items-center gap-1.5 text-[9px] font-bold uppercase shadow-[0_0_10px_rgba(168,85,247,0.3)] cursor-pointer"
          >
            <Tv className="w-3.5 h-3.5 text-purple-400" />
            <span>WATCH STREAM</span>
          </button>

          <a
            href="https://discord.com/invite/pixelpalacee"
            target="_blank"
            rel="noreferrer"
            title="Official Discord"
            className="p-1.5 rounded-lg bg-white/5 hover:bg-indigo-500/20 text-zinc-400 hover:text-indigo-300 transition-all border border-white/10 flex items-center gap-1 text-[9px] font-bold uppercase"
          >
            <MessageSquare className="w-3 h-3 text-indigo-400" />
          </a>

          <a
            href="https://www.instagram.com/pixelpalace.gg"
            target="_blank"
            rel="noreferrer"
            title="Official Instagram"
            className="p-1.5 rounded-lg bg-white/5 hover:bg-pink-500/20 text-zinc-400 hover:text-pink-300 transition-all border border-white/10 flex items-center gap-1 text-[9px] font-bold uppercase"
          >
            <Instagram className="w-3 h-3 text-pink-400" />
          </a>
        </div>

        {/* Glow backdrop ambient lighting */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-80 h-80 bg-neon-pink/15 blur-[100px] rounded-full pointer-events-none" />

        {/* Official Logo Emblem */}
        <div className="relative flex items-center justify-center mb-3">
          <div className="absolute inset-0 bg-neon-cyan/30 blur-2xl rounded-full animate-pulse" />
          <img 
            src="https://raw.githubusercontent.com/alphabravo2k-rgb/pixel-palace-registration/1a7d90c43796fd037316bdaf4f3b4de9a485d615/image_4379f9.png" 
            alt="Pixel Palace Official Logo" 
            className="w-20 h-20 sm:w-24 sm:h-24 object-contain relative z-10 drop-shadow-[0_0_25px_rgba(0,240,255,0.5)] transition-transform duration-300 hover:scale-105"
          />
        </div>

        {/* Title & Tagline */}
        <div className="glitch-wrapper mb-2">
          <h1 
            className="text-3xl sm:text-5xl font-black text-white italic tracking-tighter font-heading uppercase drop-shadow-2xl leading-none glitch"
            data-text="PIXEL PALACE"
          >
            PIXEL PALACE
          </h1>
        </div>

        <p className="text-zinc-400 font-body text-xs uppercase tracking-[0.25em] font-bold max-w-lg">
          The Premier CS2 Tournament Circuit & Community Platform
        </p>

        {/* Dynamic Org Stats Pills + Real-Time Regional Server Health Bar */}
        <div className="mt-5 flex flex-wrap justify-center items-center gap-3 sm:gap-6 glass-panel px-5 py-2 rounded-full border-white/15 bg-black/70 backdrop-blur-md shadow-xl">
          <div className="flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
            <span className="text-[10px] font-bold font-body tracking-wider text-zinc-300 uppercase">
              <span className="text-white text-xs mr-1 font-mono"><CountUp end={orgStats.totalEvents} suffix="+" /></span> Events
            </span>
          </div>
          <div className="hidden sm:block w-px h-4 bg-white/15" />
          <div className="flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-green-400 shrink-0" />
            <span className="text-[10px] font-bold font-body tracking-wider text-zinc-300 uppercase">
              <span className="text-white text-xs mr-1 font-mono"><CountUp end={orgStats.totalPrize} prefix="USD $" suffix="+" /></span> Prize Pool
            </span>
          </div>
          <div className="hidden sm:block w-px h-4 bg-white/15" />
          <div className="flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-neon-pink shrink-0" />
            <span className="text-[10px] font-bold font-body tracking-wider text-zinc-300 uppercase">
              <span className="text-white text-xs mr-1 font-mono"><CountUp end={orgStats.totalRegions} /></span> Regions
            </span>
          </div>
          <div className="hidden sm:block w-px h-4 bg-white/15" />
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-bold font-body tracking-wider text-emerald-400 uppercase">
              DXB DUBAI SERVER: 15MS
            </span>
          </div>
        </div>

        {/* Hero Action Button Centered Cleanly */}
        <div className="mt-5">
          <Magnetic>
            <a href="#circuits" className="inline-block">
              <button 
                onMouseEnter={playHover}
                onClick={playClick}
                className="btn-ignite flex items-center justify-center gap-2 px-7 py-3 rounded-xl font-heading font-black tracking-wider text-xs uppercase cursor-pointer shadow-[0_0_20px_rgba(255,0,127,0.35)]"
              >
                <span>EXPLORE CIRCUITS</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </a>
          </Magnetic>
        </div>
      </div>

      {/* 🛠 TOOLBAR: Quick Mode Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest shrink-0 mr-1 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-neon-cyan" /> QUICK MODES:
        </span>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all shrink-0 cursor-pointer border ${
              selectedCategory === cat
                ? 'bg-neon-cyan/20 border-neon-cyan text-neon-cyan shadow-[0_0_10px_rgba(0,240,255,0.25)]'
                : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 🛠 CONTROL TOOLBAR: Tabs & Command Search Bar */}
      <div id="circuits" className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <TournamentFilterTabs activeTab={activeTab} onTabChange={setActiveTab} />
        
        <div 
          onClick={() => setIsCommandOpen(true)}
          className="w-full sm:w-64 relative cursor-pointer"
        >
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            readOnly
            placeholder="Search tournaments..."
            value={searchQuery}
            className="w-full bg-black/70 border border-white/15 rounded-xl pl-8 pr-10 py-1.5 text-xs text-white placeholder-zinc-500 outline-none cursor-pointer hover:border-neon-cyan transition-colors"
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] bg-white/10 text-zinc-400 px-1.5 py-0.5 rounded font-mono border border-white/10">
            ⌘K
          </span>
        </div>
      </div>

      {/* 🔴 WIDE SPOTLIGHT BANNER ON THE LIVE TAB */}
      {activeTab === 'LIVE' && primaryLive ? (
        <div className="w-full glass-panel p-6 rounded-2xl border border-neon-pink/50 bg-gradient-to-r from-[#140824] via-black to-[#051826] shadow-[0_0_40px_rgba(255,0,127,0.25)] relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            
            {/* Left Column: Live Circuit Info */}
            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center gap-2.5">
                <span className="bg-rose-500/25 border border-rose-500 text-rose-300 px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full flex items-center gap-1.5 animate-pulse shadow-[0_0_12px_rgba(244,63,94,0.4)]">
                  <Radio className="w-3.5 h-3.5 text-rose-400" /> LIVE SPOTLIGHT CIRCUIT
                </span>
                <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">
                  CS2 COMPETITIVE • {primaryLive.region}
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-heading font-black text-white uppercase tracking-wider leading-tight">
                {primaryLive.name}
              </h2>

              <p className="text-xs text-zinc-400 font-body leading-relaxed max-w-xl">
                Official Counter-Strike 2 community championship featuring live match spectator telemetry, CSTV credentials, and media studio.
              </p>

              {/* Real Circuit Metrics */}
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <div className="bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-neon-cyan" /> {primaryLive.prizePool}
                </div>
                <div className="bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white flex items-center gap-2">
                  <Target className="w-4 h-4 text-neon-pink" /> {primaryLive.format}
                </div>
                <div className="bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-400" /> {primaryLive.maxTeams}/{primaryLive.maxTeams} Teams Locked
                </div>
              </div>
            </div>

            {/* Right Column: AUTO-UPDATING COUNTDOWN TIMER BOX */}
            <div className="lg:col-span-5 bg-black/80 border border-white/15 p-5 rounded-2xl space-y-4 flex flex-col justify-between h-full shadow-2xl backdrop-blur-md">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                    MATCH CENTER TELEMETRY
                  </span>
                  <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[9px] font-bold px-2 py-0.5 rounded uppercase flex items-center gap-1">
                    <Lock className="w-3 h-3 text-rose-400" /> REGISTRATION CLOSED
                  </span>
                </div>

                <div className="text-xs font-heading font-black text-amber-300 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400 animate-pulse" /> {countdownText || 'CALCULATING MATCH TIME...'}
                </div>

                <p className="text-xs text-zinc-400 font-body leading-relaxed">
                  32 teams locked & seeded. Access real-time match brackets, CSTV spectator specs, and broadcast media studio.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to={`/register/${primaryLive.slug}`}
                  onMouseEnter={playHover}
                  onClick={playClick}
                  className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-neon-pink to-neon-cyan hover:opacity-95 text-white font-heading font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(255,0,127,0.4)] cursor-pointer"
                >
                  <Zap className="w-4 h-4" />
                  <span>MATCH CENTER</span>
                </Link>

                <button
                  onClick={() => setIsTwitchOpen(true)}
                  className="px-4 py-3.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-300 font-heading font-black text-xs uppercase transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Tv className="w-4 h-4 text-purple-400" />
                  <span>STREAM</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* 🏆 PRIMARY CARDS GRID: RENDERED FOR ALL, UPCOMING, & ARCHIVED TABS */
        displayedGridTournaments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayedGridTournaments.map((tournament) => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="glass-panel p-10 flex flex-col items-center justify-center text-center border-dashed border-white/10 rounded-2xl">
            <CalendarX size={36} className="text-zinc-500 mb-3" />
            <h3 className="font-heading text-xl text-zinc-300 mb-1">NO CIRCUITS FOUND</h3>
            <p className="font-body text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
              There are currently no tournaments matching your active tab or filter.
            </p>
          </div>
        )
      )}

      {/* 🗺️ Interactive Active Duty Map Pool Showcase */}
      <MapPoolSection />

      {/* ⌘K Command Palette Modal */}
      <CommandPaletteModal isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />

      {/* 📺 Built-in Twitch Stream Modal */}
      <TwitchStreamModal isOpen={isTwitchOpen} onClose={() => setIsTwitchOpen(false)} />

    </div>
  );
};
