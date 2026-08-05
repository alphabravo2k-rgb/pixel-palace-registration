import React, { useState } from 'react';
import { 
  BookOpen, ShieldCheck, FileText, Download, Award, AlertTriangle, 
  Layers, Clock, CheckCircle2, ChevronRight, ExternalLink, CheckSquare, Square, Gavel, Users 
} from 'lucide-react';

export const RulebookTab = ({ tournament }) => {
  const [activeSection, setActiveSection] = useState('veto');
  const [checkedRules, setCheckedRules] = useState({});

  const toggleRuleCheck = (id) => {
    setCheckedRules(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const mandatoryChecklist = [
    { id: 'c1', title: 'Akros Anti-Cheat Client Mandate', desc: 'All 5 active players must have Akros Anti-Cheat v3.2 running before connecting to match servers.' },
    { id: 'c2', title: 'Discord Voice Channel Presence', desc: 'Team Captain and all 5 players must be in official Discord VC 15 minutes prior to match schedule.' },
    { id: 'c3', title: 'Steam64 & FACEIT Identity Matching', desc: 'In-game Steam64 ID and FACEIT profiles must match submitted registration data exactly.' },
    { id: 'c4', title: 'MR12 Format & Overtime Protocol', desc: 'Matches played MR12 (first to 13 rounds). Overtimes are MR3 with $10,000 starting economy.' },
    { id: 'c5', title: 'Substitute Policy & Roster Lock', desc: 'Maximum 1 substitute declared prior to veto start. No roster changes allowed once veto begins.' }
  ];

  const ruleSections = [
    {
      id: 'veto',
      icon: <Layers className="w-4 h-4 text-neon-cyan" />,
      title: '1. Map Pool & Veto Protocol',
      badge: 'CS2 ACTIVE DUTY',
      content: (
        <div className="space-y-6">
          <p className="text-zinc-300 text-sm leading-relaxed">
            All matches are contested strictly on the official Valve CS2 Active Duty Competitive Map Pool. Captains conduct map pick/ban sequences live 30 minutes prior to match start.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-2">
            {['Dust II', 'Mirage', 'Anubis', 'Ancient', 'Nuke', 'Inferno', 'Train'].map((map) => (
              <div key={map} className="bg-black/50 border border-white/10 p-2.5 rounded-xl text-center">
                <span className="text-white font-heading text-xs font-bold block uppercase">{map}</span>
                <span className="text-[8px] text-zinc-500 font-mono block mt-0.5">Active Duty</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="bg-black/40 border border-white/10 p-4 rounded-xl text-left">
              <h4 className="text-sm font-bold text-neon-cyan uppercase font-mono mb-2">Best-of-1 (BO1) Veto Sequence</h4>
              <ol className="text-xs space-y-1.5 text-zinc-300 font-mono list-decimal list-inside">
                <li>Higher Seed decides Team A / Team B</li>
                <li>Team A bans 1 map</li>
                <li>Team B bans 1 map</li>
                <li>Team A bans 1 map</li>
                <li>Team B bans 1 map</li>
                <li>Team A bans 1 map</li>
                <li>Team B bans 1 map</li>
                <li><strong className="text-white">Remaining 1 Map is Played</strong> (Team B selects starting side)</li>
              </ol>
            </div>

            <div className="bg-black/40 border border-white/10 p-4 rounded-xl text-left">
              <h4 className="text-sm font-bold text-neon-pink uppercase font-mono mb-2">Best-of-3 (BO3) Veto Sequence</h4>
              <ol className="text-xs space-y-1.5 text-zinc-300 font-mono list-decimal list-inside">
                <li>Team A bans 1 map</li>
                <li>Team B bans 1 map</li>
                <li><strong className="text-white">Team A picks Map 1</strong> (Team B chooses side)</li>
                <li><strong className="text-white">Team B picks Map 2</strong> (Team A chooses side)</li>
                <li>Team A bans 1 map</li>
                <li>Team B bans 1 map</li>
                <li><strong className="text-white">Remaining Map is Decider (Map 3)</strong></li>
              </ol>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'anticheat',
      icon: <ShieldCheck className="w-4 h-4 text-green-400" />,
      title: '2. Anti-Cheat & GOTV Demos',
      badge: 'AKROS REQUIRED',
      content: (
        <div className="space-y-4">
          <div className="bg-green-950/20 border border-green-500/30 p-4 rounded-xl flex items-start gap-3">
            <ShieldCheck className="w-6 h-6 text-green-400 shrink-0 mt-0.5" />
            <div className="text-sm text-zinc-300 leading-relaxed">
              <strong className="text-white uppercase font-bold block mb-1">Akros Anti-Cheat Mandatory Protocol</strong>
              All 5 registered players on a team MUST execute and authenticate the official Akros Anti-Cheat client before joining tournament servers. Players joining without active client logging will be automatically kicked by server hooks.
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="bg-black/40 border border-white/10 p-4 rounded-xl space-y-2">
              <span className="text-yellow-400 font-bold uppercase font-mono text-[11px] block">🔒 GOTV & Local POV Demos</span>
              <p className="text-zinc-400 text-xs">Server CSTV auto-records 128-tick GOTV demos. Players are also recommended to record local POV demos via <code className="text-zinc-200 bg-zinc-900 px-1.5 py-0.5 rounded">record demo_name</code> in console.</p>
            </div>

            <div className="bg-black/40 border border-white/10 p-4 rounded-xl space-y-2">
              <span className="text-red-400 font-bold uppercase font-mono text-xs block">🚫 Unfair Advantage & Exploit Bans</span>
              <p className="text-zinc-400 text-xs">Use of illegal pixel walks, script binds (excluding jumpthrow), external overlays, or smurfing will result in immediate team disqualification and 12-month platform ban.</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'match',
      icon: <Clock className="w-4 h-4 text-yellow-400" />,
      title: '3. Timings, Pauses & Overtime',
      badge: 'MR12 & OVERTIME',
      content: (
        <div className="space-y-4 text-xs font-mono">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-black/40 border border-white/10 p-3 rounded-xl text-center">
              <span className="text-[10px] text-zinc-500 uppercase block mb-1">Match Structure</span>
              <span className="text-white font-bold text-sm block">MR12 (First to 13)</span>
            </div>
            <div className="bg-black/40 border border-white/10 p-3 rounded-xl text-center">
              <span className="text-[10px] text-zinc-500 uppercase block mb-1">Overtime Rules</span>
              <span className="text-white font-bold text-sm block">MR3 ($10,000 Cash)</span>
            </div>
            <div className="bg-black/40 border border-white/10 p-3 rounded-xl text-center">
              <span className="text-[10px] text-zinc-500 uppercase block mb-1">Forfeit Timer</span>
              <span className="text-yellow-400 font-bold text-sm block">10 Mins Post-Schedule</span>
            </div>
          </div>

          <div className="bg-black/40 border border-white/10 p-4 rounded-xl space-y-2 text-left">
            <h4 className="text-xs font-bold text-white uppercase mb-2">Tactical & Technical Pauses</h4>
            <ul className="space-y-1.5 text-xs text-zinc-400 list-disc list-inside">
              <li>Each team receives <strong className="text-white">4 tactical pauses per map</strong> (30 seconds each).</li>
              <li>Technical pauses require admin notification in official Discord match channel. Max 10 minutes total per map.</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 'checklist',
      icon: <CheckSquare className="w-4 h-4 text-indigo-400" />,
      title: '4. Captain Pre-Match Checklist',
      badge: 'MANDATORY CHECKLIST',
      content: (
        <div className="space-y-4 text-xs font-mono">
          <p className="text-zinc-300 text-sm leading-relaxed">
            Captains must verify that all 5 players fulfill these mandatory checks prior to match time:
          </p>

          <div className="space-y-2.5">
            {mandatoryChecklist.map((item) => {
              const isChecked = checkedRules[item.id];
              return (
                <div
                  key={item.id}
                  onClick={() => toggleRuleCheck(item.id)}
                  className={`p-3.5 rounded-xl border transition cursor-pointer flex items-start gap-3 ${
                    isChecked
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                      : 'bg-black/40 border-white/10 hover:border-white/20 text-zinc-300'
                  }`}
                >
                  {isChecked ? (
                    <CheckSquare className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <Square className="w-5 h-5 text-zinc-500 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-bold text-white text-sm block font-heading">{item.title}</span>
                    <span className="text-xs text-zinc-400 block mt-0.5">{item.desc}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ),
    },
    {
      id: 'penalties',
      icon: <Gavel className="w-4 h-4 text-red-400" />,
      title: '5. Penalties & Code of Conduct',
      badge: 'DISCIPLINARY POLICY',
      content: (
        <div className="space-y-4 text-xs font-mono">
          <div className="bg-red-950/20 border border-red-500/30 p-4 rounded-xl space-y-2">
            <h4 className="text-xs font-bold text-red-400 uppercase font-heading">Zero Tolerance Policy</h4>
            <p className="text-zinc-300 text-sm leading-relaxed">
              Verbal abuse, racism, toxicity, ghosting, smurfing, or unauthorized match server leaks will result in immediate disqualification, forfeit of prize eligibility, and a minimum 12-month ban from all Pixel Palace events.
            </p>
          </div>
        </div>
      ),
    }
  ];

  const currentSection = ruleSections.find(s => s.id === activeSection) || ruleSections[0];

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500 font-mono">
      
      {/* Header Banner */}
      <div className="bg-[#080b18]/95 border-l-4 border-l-neon-cyan border border-white/10 p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 backdrop-blur-md shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-neon-cyan uppercase tracking-widest mb-1">
            <BookOpen className="w-4 h-4" /> OFFICIAL TOURNAMENT RULEBOOK
          </div>
          <h2 className="text-2xl font-bold font-heading text-white uppercase tracking-wider">
            Pixel Palace CS2 Competitive Regulations
          </h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-xl">
            Governing ruleset for Community Cup 2. All captains and players are strictly bound by these tournament regulations.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <a
            href="https://discord.com/invite/pixelpalacee"
            target="_blank"
            rel="noreferrer"
            className="bg-neon-cyan/10 hover:bg-neon-cyan/20 border border-neon-cyan/40 text-neon-cyan text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition"
          >
            <FileText className="w-4 h-4" />
            <span>DISCORD ADMIN SUPPORT</span>
          </a>
        </div>
      </div>

      {/* Main Grid: Sidebar Navigation & Content */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left Sidebar */}
        <div className="md:col-span-4 space-y-2">
          {ruleSections.map(sec => (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id)}
              className={`w-full p-4 rounded-xl border text-left flex items-center justify-between transition cursor-pointer ${
                activeSection === sec.id
                  ? 'bg-neon-cyan/15 border-neon-cyan text-white shadow-[0_0_20px_rgba(0,240,255,0.2)]'
                  : 'bg-black/50 border-white/10 text-zinc-400 hover:text-white hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-3">
                {sec.icon}
                <div>
                  <span className="text-sm font-bold font-heading block">{sec.title}</span>
                  <span className="text-[9px] text-zinc-500 font-bold block">{sec.badge}</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-500" />
            </button>
          ))}
        </div>

        {/* Right Content Panel */}
        <div className="md:col-span-8 bg-[#080b18]/95 border border-white/10 p-6 rounded-2xl relative shadow-xl backdrop-blur-md">
          <div className="hud-crosshair tl" /><div className="hud-crosshair tr" />
          
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
            <h3 className="text-base font-bold text-white uppercase font-heading tracking-wider flex items-center gap-2">
              {currentSection.icon}
              {currentSection.title}
            </h3>
            <span className="text-[10px] text-neon-cyan font-bold border border-neon-cyan/30 px-2 py-0.5 rounded">
              {currentSection.badge}
            </span>
          </div>

          {currentSection.content}
        </div>

      </div>

    </div>
  );
};
